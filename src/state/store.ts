import { create } from "zustand";
import { db, logEvent, type BadgeRow, type CouponRow, type ProgressRow, type SessionRow } from "../engine/save/db";
import { clearBackup, requestPersistentStorage, restoreBackupIfNeeded } from "../engine/save/backup";
import { generateQuestionSet } from "../engine/generators";
import { DEFAULT_RATING, difficultyFromRating, stageDifficulty, updateRating } from "../engine/difficulty/skillRating";
import { starsForResult } from "../engine/progress/stars";
import { isRapidGuessing, weightedPayout, workedExample } from "../engine/answers/answerEngine";
import { STR } from "../strings/en";
import { itemById } from "../engine/economy/catalog";
import { BADGES, stageById, stageIndexInWorld, worldOfStage, worldById, type BadgeDef } from "../content/worlds";
import { withGameDefaults, withWorldDefaults } from "./gates";
import { persona } from "../persona.config";
import { newSeed } from "../engine/rng";
import { setMuted } from "../engine/feedback/audio";
import { startMusic, stopMusic } from "../engine/feedback/music";

export interface SessionResult {
  stars: 1 | 2 | 3;
  payout: number;
  firstTime: boolean;
  newBadge: BadgeDef | null;
  perfect: boolean;
}

export interface Session extends SessionRow {
  lastAnswer: "correct" | "wrong" | null;
  showHint: boolean;
  workedExample: string | null;
  companionLine: string | null;
  result: SessionResult | null;
}

interface GameStore {
  loaded: boolean;
  hasSave: boolean;
  starDust: number;
  progress: Record<string, ProgressRow>;
  inventory: string[];
  badges: BadgeRow[];
  skillRatings: Record<string, number>;
  soundOn: boolean;
  musicOn: boolean;
  lastStageId: string | null;
  coupons: CouponRow[];
  /** Parent gates: which worlds / minigames Sam may open right now. */
  enabledWorlds: Record<string, boolean>;
  enabledGames: Record<string, boolean>;
  videoEnabled: boolean;
  videoMode: "corner" | "background";
  videoUrls: string[];
  session: Session | null;

  hydrate: () => Promise<void>;
  startStage: (stageId: string) => boolean;
  answer: (choice: string) => "correct" | "wrong" | "again" | null;
  advance: () => void;
  clearSession: () => void;
  buyItem: (itemId: string) => boolean;
  redeemCoupon: (couponId: number) => void;
  earnDust: (amount: number, reason: string) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  // Parent Section controls
  setStarDust: (amount: number) => void;
  setWorldProgress: (worldId: string, completedCount: number) => void;
  setWorldEnabled: (worldId: string, on: boolean) => void;
  setGameEnabled: (gameId: string, on: boolean) => void;
  setVideoEnabled: (on: boolean) => void;
  setVideoMode: (mode: "corner" | "background") => void;
  addVideoUrl: (url: string) => void;
  removeVideoUrl: (url: string) => void;
  resetAll: () => Promise<void>;
}


function persistSettings(get: () => GameStore): void {
  const { soundOn, musicOn, lastStageId, enabledWorlds, enabledGames, videoEnabled, videoMode, videoUrls } = get();
  void db.settings.put({
    id: 1,
    soundOn,
    musicOn,
    lastStageId: lastStageId ?? undefined,
    enabledWorlds,
    enabledGames,
    videoEnabled,
    videoMode,
    videoUrls,
  });
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persistSession(session: Session | null): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (session && !session.result) {
      void db.session.put({
        id: session.id,
        stageId: session.stageId,
        seed: session.seed,
        questions: session.questions,
        index: session.index,
        correctCount: session.correctCount,
        firstTryMisses: session.firstTryMisses,
        missStreak: session.missStreak,
        attemptMissed: session.attemptMissed,
        wrongStamps: session.wrongStamps,
        proveLeft: session.proveLeft ?? 0,
      });
    } else {
      void db.session.delete(1);
    }
  }, 300);
}

function withReplacedQuestion(s: Session, generator: Parameters<typeof generateQuestionSet>[0], params: Parameters<typeof generateQuestionSet>[1], difficulty: number, easier: boolean): Session["questions"] {
  const [replacement] = generateQuestionSet(generator, params, 1, newSeed(), { difficulty, easier });
  const questions = [...s.questions];
  questions[s.index] = replacement;
  return questions;
}

/** Rule 1+3+5 miss transition: discard, regenerate, scaffold, detect guessing. */
function missTransition(
  s: Session,
  stage: NonNullable<ReturnType<typeof stageById>>,
  skill: string,
  ratings: Record<string, number>,
  q: Session["questions"][number],
  firstAttemptInSlot: boolean,
): Session {
  const wrongStamps = [...s.wrongStamps, Date.now()];
  const rapid = isRapidGuessing(wrongStamps);
  const missStreak = firstAttemptInSlot ? s.missStreak + 1 : s.missStreak;
  const easier = rapid || missStreak >= 2;
  if (rapid) {
    // Rule 5: a signal, not misbehavior — adapt difficulty, log, one warm line.
    ratings[skill] = Math.max(0, (ratings[skill] ?? DEFAULT_RATING) - 8);
    void db.skillRatings.put({ skill, rating: ratings[skill] });
    logEvent("guess.rapid", { stageId: s.stageId, skill });
  }
  const difficulty = easier ? 0 : difficultyFromRating(ratings[skill] ?? DEFAULT_RATING);
  return {
    ...s,
    questions: withReplacedQuestion(s, stage.generator, stage.params, difficulty, easier),
    wrongStamps,
    lastAnswer: "wrong",
    // Choice questions are tap-guessable: demand 2 correct in a row.
    proveLeft: q.inputMode === "choices" ? 2 : 0,
    attemptMissed: true,
    firstTryMisses: firstAttemptInSlot ? s.firstTryMisses + 1 : s.firstTryMisses,
    missStreak: easier ? 0 : missStreak,
    showHint: true,
    // Rule 3: second miss in the slot → show the discarded question solved.
    workedExample: firstAttemptInSlot ? null : workedExample(q) || null,
    companionLine: rapid ? STR.companionSlow : s.companionLine,
  };
}

export const useGame = create<GameStore>((set, get) => ({
  loaded: false,
  hasSave: false,
  starDust: 0,
  progress: {},
  inventory: [],
  badges: [],
  skillRatings: {},
  soundOn: true,
  musicOn: true,
  lastStageId: null,
  coupons: [],
  enabledWorlds: withWorldDefaults(),
  enabledGames: withGameDefaults(),
  videoEnabled: false,
  videoMode: "corner",
  videoUrls: [],
  session: null,

  hydrate: async () => {
    requestPersistentStorage();
    await restoreBackupIfNeeded();
    const [profile, economy, progressRows, sessionRow, inventoryRows, badgeRows, settings, skillRows, couponRows] =
      await Promise.all([
        db.profile.get(1),
        db.economy.get(1),
        db.progress.toArray(),
        db.session.get(1),
        db.inventory.toArray(),
        db.badges.toArray(),
        db.settings.get(1),
        db.skillRatings.toArray(),
        db.coupons.toArray(),
      ]);

    const hasSave = Boolean(profile);
    if (!profile) {
      const now = Date.now();
      await db.profile.put({ id: 1, name: persona.name, createdAt: now, lastSeenAt: now });
      await db.economy.put({ id: 1, starDust: 0, melodyShards: 0 });
      await db.settings.put({ id: 1, soundOn: true });
      logEvent("profile.created", { name: persona.name });
    } else {
      void db.profile.update(1, { lastSeenAt: Date.now() });
    }

    const progress: Record<string, ProgressRow> = {};
    for (const row of progressRows) progress[row.stageId] = row;
    const skillRatings: Record<string, number> = {};
    for (const row of skillRows) skillRatings[row.skill] = row.rating;

    const soundOn = settings?.soundOn ?? true;
    const musicOn = settings?.musicOn ?? true;
    setMuted(!soundOn);

    set({
      loaded: true,
      hasSave,
      starDust: economy?.starDust ?? 0,
      progress,
      inventory: inventoryRows.map((r) => r.itemId),
      badges: badgeRows,
      skillRatings,
      soundOn,
      musicOn,
      lastStageId: settings?.lastStageId ?? null,
      coupons: couponRows,
      enabledWorlds: withWorldDefaults(settings?.enabledWorlds),
      enabledGames: withGameDefaults(settings?.enabledGames),
      videoEnabled: settings?.videoEnabled ?? false,
      videoMode: settings?.videoMode ?? "corner",
      videoUrls: settings?.videoUrls ?? [],
      session: sessionRow
        ? {
            ...sessionRow,
            wrongStamps: sessionRow.wrongStamps ?? [],
            proveLeft: sessionRow.proveLeft ?? 0,
            lastAnswer: null,
            showHint: false,
            workedExample: null,
            companionLine: null,
            result: null,
          }
        : null,
    });
  },

  startStage: (stageId) => {
    const stage = stageById(stageId);
    if (!stage) return false;
    const skill = stage.skill ?? stage.generator;
    const rating = get().skillRatings[skill] ?? DEFAULT_RATING;
    const seed = newSeed();
    const world = worldOfStage(stageId);
    const stageProgress = world ? stageIndexInWorld(stageId) / Math.max(1, world.stages.length - 1) : 0.5;
    const questions = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, {
      difficulty: stageDifficulty(stageProgress, rating),
      easier: false,
    });
    const session: Session = {
      id: 1,
      stageId,
      seed,
      questions,
      index: 0,
      correctCount: 0,
      firstTryMisses: 0,
      missStreak: 0,
      attemptMissed: false,
      wrongStamps: [],
      proveLeft: 0,
      lastAnswer: null,
      showHint: false,
      workedExample: null,
      companionLine: null,
      result: null,
    };
    set({ session, lastStageId: stageId });
    persistSession(session);
    persistSettings(get);
    logEvent("stage.start", { stageId, seed });
    return true;
  },

  answer: (typed) => {
    const s = get().session;
    if (!s || s.result || s.lastAnswer === "correct") return null;
    const stage = stageById(s.stageId);
    if (!stage) return null;
    const skill = stage.skill ?? stage.generator;
    const q = s.questions[s.index];
    const correct = typed === q.answer;
    const ratings = { ...get().skillRatings };
    const firstAttemptInSlot = !s.attemptMissed;

    if (firstAttemptInSlot) {
      const r = ratings[skill] ?? DEFAULT_RATING;
      ratings[skill] = updateRating(r, correct);
      void db.skillRatings.put({ skill, rating: ratings[skill] });
    }

    let next: Session;
    let verdict: "correct" | "wrong" | "again";
    if (correct && (s.proveLeft ?? 0) > 1) {
      // Anti-guessing: a missed CHOICE slot demands consecutive proof —
      // each owed proof is a fresh question, so lucky taps can't convert.
      const difficulty = difficultyFromRating(ratings[skill] ?? DEFAULT_RATING);
      next = {
        ...s,
        questions: withReplacedQuestion(s, stage.generator, stage.params, difficulty, false),
        proveLeft: (s.proveLeft ?? 0) - 1,
        lastAnswer: null,
        showHint: false,
        workedExample: null,
        missStreak: 0,
      };
      verdict = "again";
    } else if (correct) {
      next = {
        ...s,
        lastAnswer: "correct",
        correctCount: s.correctCount + 1,
        missStreak: 0,
        showHint: false,
        workedExample: null,
        proveLeft: 0,
      };
      verdict = "correct";
    } else {
      next = missTransition(s, stage, skill, ratings, q, firstAttemptInSlot);
      verdict = "wrong";
    }
    set({ skillRatings: ratings, session: next });
    persistSession(next);
    return verdict;
  },

  advance: () => {
    const state = get();
    const s = state.session;
    if (!s || s.result) return;

    if (s.index + 1 < s.questions.length) {
      const next: Session = {
        ...s,
        index: s.index + 1,
        lastAnswer: null,
        showHint: false,
        attemptMissed: false,
        workedExample: null,
        companionLine: null,
      };
      set({ session: next });
      persistSession(next);
      return;
    }

    // Stage finished — compute result, pay out, persist everything.
    const stage = stageById(s.stageId);
    if (!stage) return;
    const prev = state.progress[s.stageId];
    const firstTime = !prev?.completed;
    // Rule 4: stars from first-try accuracy; payout weighted by it.
    const stars = starsForResult(s.questions.length, s.firstTryMisses);
    const { amount: payout, perfect } = weightedPayout(
      stage.payout,
      s.questions.length,
      s.firstTryMisses,
      firstTime,
    );
    const bestStars = Math.max(prev?.bestStars ?? 0, stars);
    const progressRow: ProgressRow = {
      stageId: s.stageId,
      bestStars,
      attempts: (prev?.attempts ?? 0) + 1,
      completed: true,
    };

    let newBadge: BadgeDef | null = null;
    const badgeDef = BADGES.find((b) => b.stageId === s.stageId);
    if (firstTime && badgeDef && !state.badges.some((b) => b.badgeId === badgeDef.id)) {
      newBadge = badgeDef;
      const row: BadgeRow = { badgeId: badgeDef.id, name: badgeDef.name, icon: badgeDef.icon, earnedAt: Date.now() };
      void db.badges.put(row);
      set({ badges: [...state.badges, row] });
    }

    const starDust = state.starDust + payout;
    void db.progress.put(progressRow);
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    logEvent("stage.complete", { stageId: s.stageId, stars, payout, firstTime, perfect });

    const finished: Session = { ...s, result: { stars, payout, firstTime, newBadge, perfect } };
    set({
      starDust,
      progress: { ...state.progress, [s.stageId]: progressRow },
      session: finished,
      hasSave: true,
    });
    persistSession(finished); // result set → deletes the in-progress row
  },

  clearSession: () => {
    set({ session: null });
    void db.session.delete(1);
  },

  buyItem: (itemId) => {
    const state = get();
    const item = itemById(itemId);
    if (!item || state.starDust < item.cost) return false;
    const starDust = state.starDust - item.cost;
    const row: CouponRow = { itemId, purchasedAt: Date.now(), redeemedAt: null };
    set({ starDust });
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    void db.coupons.add(row).then((id) => {
      set({ coupons: [...get().coupons, { ...row, id }] });
    });
    logEvent("shop.coupon", { itemId, cost: item.cost });
    return true;
  },

  redeemCoupon: (couponId) => {
    const redeemedAt = Date.now();
    set({ coupons: get().coupons.map((c) => (c.id === couponId ? { ...c, redeemedAt } : c)) });
    void db.coupons.update(couponId, { redeemedAt });
    logEvent("coupon.redeem", { couponId });
  },

  earnDust: (amount, reason) => {
    if (amount <= 0) return;
    const starDust = get().starDust + amount;
    set({ starDust, hasSave: true });
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    logEvent("dust.earn", { amount, reason });
  },

  toggleSound: () => {
    const soundOn = !get().soundOn;
    setMuted(!soundOn);
    set({ soundOn });
    persistSettings(get);
  },

  toggleMusic: () => {
    const musicOn = !get().musicOn;
    if (musicOn) startMusic();
    else stopMusic();
    set({ musicOn });
    persistSettings(get);
  },

  setStarDust: (amount) => {
    const starDust = Math.max(0, Math.round(amount));
    set({ starDust });
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    logEvent("parent.setDust", { starDust });
  },

  setWorldProgress: (worldId, completedCount) => {
    const world = worldById(worldId);
    if (!world) return;
    const n = Math.max(0, Math.min(world.stages.length, Math.round(completedCount)));
    const progress = { ...get().progress };
    const puts: ProgressRow[] = [];
    const deletes: string[] = [];
    world.stages.forEach((stage, i) => {
      if (i < n) {
        const row: ProgressRow = progress[stage.id]?.completed
          ? progress[stage.id]
          : { stageId: stage.id, bestStars: 1, attempts: 1, completed: true };
        progress[stage.id] = row;
        puts.push(row);
      } else if (progress[stage.id]) {
        delete progress[stage.id];
        deletes.push(stage.id);
      }
    });
    void db.progress.bulkPut(puts);
    void db.progress.bulkDelete(deletes);
    // drop an in-flight session that now points past the new frontier
    const s = get().session;
    if (s && deletes.includes(s.stageId)) {
      set({ session: null });
      void db.session.delete(1);
    }
    set({ progress });
    logEvent("parent.setWorldProgress", { worldId, completedCount: n });
  },

  setWorldEnabled: (worldId, on) => {
    set({ enabledWorlds: { ...get().enabledWorlds, [worldId]: on } });
    persistSettings(get);
    logEvent("parent.worldGate", { worldId, on });
  },

  setGameEnabled: (gameId, on) => {
    set({ enabledGames: { ...get().enabledGames, [gameId]: on } });
    persistSettings(get);
    logEvent("parent.gameGate", { gameId, on });
  },

  setVideoEnabled: (on) => {
    set({ videoEnabled: on });
    persistSettings(get);
    logEvent("parent.videoEnabled", { on });
  },

  setVideoMode: (mode) => {
    set({ videoMode: mode });
    persistSettings(get);
  },

  addVideoUrl: (url) => {
    const u = url.trim();
    if (!u || get().videoUrls.includes(u)) return;
    set({ videoUrls: [...get().videoUrls, u] });
    persistSettings(get);
  },

  removeVideoUrl: (url) => {
    set({ videoUrls: get().videoUrls.filter((u) => u !== url) });
    persistSettings(get);
  },

  resetAll: async () => {
    await Promise.all([
      db.profile.clear(),
      db.economy.clear(),
      db.progress.clear(),
      db.session.clear(),
      db.inventory.clear(),
      db.badges.clear(),
      db.settings.clear(),
      db.skillRatings.clear(),
      db.eventLog.clear(),
      db.coupons.clear(),
    ]);
    clearBackup();
    location.reload();
  },
}));
