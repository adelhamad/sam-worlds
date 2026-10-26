import { create } from "zustand";
import { db, logEvent, type BadgeRow, type CouponRow, type ProgressRow, type SessionRow } from "../engine/save/db";
import { clearBackup, requestPersistentStorage, restoreBackupIfNeeded } from "../engine/save/backup";
import { generateQuestionSet, questionKeys } from "../engine/generators";
import { DEFAULT_RATING, stageDifficulty } from "../engine/difficulty/skillRating";
import { starsForResult } from "../engine/progress/stars";
import { weightedPayout } from "../engine/answers/answerEngine";
import { BADGES, stageById, stageIndexInWorld, worldOfStage, type BadgeDef } from "../content/worlds";
import { withWorldDefaults } from "./gates";
import { answerTransition, type AnswerVerdict } from "./questionFlow";
import { recordSeenQuestion } from "./seenQuestions";
import { persistSettings, settingsState } from "./settings";
import { giftActions } from "./gifts";
import { petActions, petInitial, type PetSlice } from "./pet";
import { videoActions } from "./video";
import { worldAdminActions } from "./worldAdmin";
import { couponActions } from "./coupons";
import { drawTreasure, type DailyGift, type Treasure, treasureById } from "../engine/economy/gifts";
import { persona } from "../persona.config";
import { newSeed } from "../engine/rng";
import { setMuted } from "../engine/feedback/audio";
import { startMusic, stopMusic } from "../engine/feedback/music";
import { armReminders, disarmReminders, requestReminderPermission } from "../engine/notify/reminders";

export interface SessionResult {
  stars: 1 | 2 | 3;
  payout: number;
  firstTime: boolean;
  newBadge: BadgeDef | null;
  perfect: boolean;
  noQuestions: boolean;
  /** Bonus collectible dropped at a stage milestone (every 5th new stage). */
  surprise: Treasure | null;
}

export interface Session extends SessionRow {
  lastAnswer: "correct" | "wrong" | null;
  showHint: boolean;
  workedExample: string | null;
  companionLine: string | null;
  /** Transient: the parent/child spent dust to reveal this slot's answer. */
  revealed?: boolean;
  result: SessionResult | null;
}

/** Star Dust it costs to reveal an answer and skip a question. */
export const REVEAL_COST = 15;

export interface GameStore extends PetSlice {
  loaded: boolean;
  hasSave: boolean;
  starDust: number;
  progress: Record<string, ProgressRow>;
  inventory: string[];
  badges: BadgeRow[];
  skillRatings: Record<string, number>;
  seenQuestionKeys: string[];
  soundOn: boolean;
  musicOn: boolean;
  remindersOn: boolean;
  lastStageId: string | null;
  coupons: CouponRow[];
  /** Parent gates: which worlds Sam may open right now. */
  enabledWorlds: Record<string, boolean>;
  /** Worlds hidden from the hub entirely (missing/false = shown). */
  hiddenWorlds: Record<string, boolean>;
  /** Most-recently-played world ids, newest first (for the hub's Recent row). */
  recentWorlds: string[];
  /** Worlds the child has starred, newest first (hub Favorites row). */
  favoriteWorlds: string[];
  videoEnabled: boolean;
  videoMode: "corner" | "background";
  videoOpacity: number;
  videoUrls: string[];
  videoAudioOnly: boolean;
  videoSize: number;
  // Daily Gift + Treasure Vault
  gifts: string[];
  lastGiftDay: string | null;
  giftStreak: number;
  giftBestStreak: number;
  session: Session | null;

  hydrate: () => Promise<void>;
  startStage: (stageId: string) => boolean;
  answer: (choice: string) => AnswerVerdict | null;
  revealAnswer: () => "revealed" | "poor" | null;
  advance: () => void;
  clearSession: () => void;
  buyItem: (itemId: string) => boolean;
  redeemCoupon: (couponId: number) => void;
  clearRedeemedCoupons: () => void;
  earnDust: (amount: number, reason: string) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  setReminders: (on: boolean) => Promise<boolean>;
  // Parent Section controls
  setStarDust: (amount: number) => void;
  setWorldProgress: (worldId: string, completedCount: number) => void;
  setWorldEnabled: (worldId: string, on: boolean) => void;
  setWorldHidden: (worldId: string, hidden: boolean) => void;
  showAllWorlds: () => void;
  toggleFavorite: (worldId: string) => void;
  setFavoriteOrder: (ids: string[]) => void;
  setVideoEnabled: (on: boolean) => void;
  toggleVideo: () => void;
  setVideoMode: (mode: "corner" | "background") => void;
  setVideoOpacity: (pct: number) => void;
  setVideoAudioOnly: (on: boolean) => void;
  setVideoSize: (px: number) => void;
  claimDailyGift: () => DailyGift | null;
  resetGifts: () => void;
  addVideoUrl: (url: string) => void;
  removeVideoUrl: (url: string) => void;
  resetAll: () => Promise<void>;
  clearSeenQuestions: () => void;
}



let saveTimer: ReturnType<typeof setTimeout> | null = null;
let hydrationStarted = false;
function persistSession(session: Session | null): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (session && !session.result) {
      void db.session.put({
        id: session.id,
        stageId: session.stageId,
        seed: session.seed,
        questions: session.questions,
        seenQuestionKeys: session.seenQuestionKeys,
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

function sessionScore(s: Session, base: number, firstTime: boolean, previousStars: number) {
  if (s.questions.length === 0) {
    return { stars: 1 as const, payout: 0, perfect: false, bestStars: previousStars };
  }
  const stars = starsForResult(s.questions.length, s.firstTryMisses);
  const { amount: payout, perfect } = weightedPayout(base, s.questions.length, s.firstTryMisses, firstTime);
  return { stars, payout, perfect, bestStars: Math.max(previousStars, stars) };
}

export const useGame = create<GameStore>((set, get) => ({
  loaded: false,
  hasSave: false,
  starDust: 0,
  progress: {},
  inventory: [],
  badges: [],
  skillRatings: {},
  seenQuestionKeys: [],
  soundOn: true,
  musicOn: true,
  remindersOn: false,
  lastStageId: null,
  coupons: [],
  enabledWorlds: withWorldDefaults(),
  hiddenWorlds: {},
  recentWorlds: [], favoriteWorlds: [],
  videoEnabled: false, videoMode: "corner", videoOpacity: 80, videoUrls: [], videoAudioOnly: false, videoSize: 280,
  gifts: [], lastGiftDay: null, giftStreak: 0, giftBestStreak: 0,
  ...petInitial,
  session: null,

  hydrate: async () => {
    if (hydrationStarted || get().loaded) return;
    hydrationStarted = true;
    try {
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

      const fromSettings = settingsState(settings);
      setMuted(!fromSettings.soundOn);

      set({
        loaded: true,
        hasSave,
        starDust: economy?.starDust ?? 0,
        progress,
        inventory: inventoryRows.map((r) => r.itemId),
        badges: badgeRows,
        skillRatings,
        seenQuestionKeys: recordSeenQuestion(profile?.seenQuestionKeys ?? [], sessionRow?.questions[sessionRow.index]),
        coupons: couponRows,
        ...fromSettings,
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
    } finally {
      hydrationStarted = false;
    }
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
    }, get().seenQuestionKeys);
    const session: Session = {
      id: 1,
      stageId,
      seed,
      questions,
      seenQuestionKeys: questions.flatMap(questionKeys),
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
    const wid = worldOfStage(stageId)?.id;
    const recentWorlds = wid ? [wid, ...get().recentWorlds.filter((w) => w !== wid)].slice(0, 8) : get().recentWorlds;
    set({ session, lastStageId: stageId, recentWorlds,
      seenQuestionKeys: recordSeenQuestion(get().seenQuestionKeys, questions[0]) });
    persistSession(session);
    persistSettings(get);
    logEvent("stage.start", { stageId, seed });
    if (questions.length === 0) get().advance();
    return true;
  },

  answer: (typed) => {
    const s = get().session;
    if (!s || s.result || s.lastAnswer === "correct") return null;
    const stage = stageById(s.stageId);
    if (!stage || !s.questions[s.index]) return null;
    const ratings = { ...get().skillRatings };
    const { next, verdict } = answerTransition(s, stage, typed, ratings, get().seenQuestionKeys);
    const shown = verdict === "wrong" || verdict === "again" || verdict === "exhausted";
    set({ skillRatings: ratings, session: next,
      seenQuestionKeys: shown ? recordSeenQuestion(get().seenQuestionKeys, next.questions[next.index]) : get().seenQuestionKeys });
    persistSession(next);
    if (verdict === "exhausted") {
      logEvent("question.exhausted", { stageId: s.stageId, index: s.index });
      if (next.index >= next.questions.length) get().advance();
    }
    return verdict;
  },

  // Spend Star Dust to reveal the answer and skip the slot. It counts as a
  // missed slot (not first-try), so stars/payout reflect the help — nothing is
  // ever deducted beyond the dust cost.
  revealAnswer: () => {
    const s = get().session;
    if (!s || s.result || s.lastAnswer === "correct") return null;
    if (get().starDust < REVEAL_COST) return "poor";
    const starDust = get().starDust - REVEAL_COST;
    const next: Session = {
      ...s,
      lastAnswer: "correct",
      revealed: true,
      correctCount: s.correctCount + 1,
      firstTryMisses: s.firstTryMisses + (s.attemptMissed ? 0 : 1),
      attemptMissed: true,
      showHint: false,
      workedExample: null,
      proveLeft: 0,
    };
    set({ starDust, session: next });
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    persistSession(next);
    logEvent("reveal", { stageId: s.stageId, index: s.index, cost: REVEAL_COST });
    return "revealed";
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
      set({ session: next,
        seenQuestionKeys: recordSeenQuestion(state.seenQuestionKeys, next.questions[next.index]) });
      persistSession(next);
      return;
    }

    // Stage finished — compute result, pay out, persist everything.
    const stage = stageById(s.stageId);
    if (!stage) return;
    const prev = state.progress[s.stageId];
    const firstTime = !prev?.completed;
    // Rule 4: stars from first-try accuracy; payout weighted by it.
    const { stars, payout, perfect, bestStars } = sessionScore(s, stage.payout, firstTime, prev?.bestStars ?? 0);
    const progressRow: ProgressRow = {
      stageId: s.stageId,
      bestStars,
      attempts: (prev?.attempts ?? 0) + 1,
      completed: true,
    };

    let newBadge: BadgeDef | null = null;
    const badgeDef = BADGES.find((b) => b.stageId === s.stageId);
    if (firstTime && s.questions.length > 0 && badgeDef && !state.badges.some((b) => b.badgeId === badgeDef.id)) {
      newBadge = badgeDef;
      const row: BadgeRow = { badgeId: badgeDef.id, name: badgeDef.name, icon: badgeDef.icon, earnedAt: Date.now() };
      void db.badges.put(row);
      set({ badges: [...state.badges, row] });
    }

    const starDust = state.starDust + payout;
    void db.progress.put(progressRow);
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    logEvent("stage.complete", { stageId: s.stageId, stars, payout, firstTime, perfect });

    // Surprise treasure every 5th NEW stage cleared — a steady ownership drip.
    let surprise: Treasure | null = null;
    let gifts = state.gifts;
    if (firstTime && s.questions.length > 0) {
      const totalCompleted = Object.values(state.progress).filter((p) => p.completed).length + 1;
      if (totalCompleted % 5 === 0) {
        const tid = drawTreasure(state.gifts, (s.seed ^ (totalCompleted * 2654435761)) >>> 0);
        if (tid) {
          surprise = treasureById(tid) ?? null;
          gifts = [...state.gifts, tid];
        }
      }
    }

    const finished: Session = { ...s, result: { stars, payout, firstTime, newBadge, perfect, surprise, noQuestions: s.questions.length === 0 } };
    set({
      starDust,
      gifts,
      progress: { ...state.progress, [s.stageId]: progressRow },
      session: finished,
      hasSave: true,
    });
    if (surprise) persistSettings(get);
    persistSession(finished); // result set → deletes the in-progress row
    if (s.questions.length > 0) get().feedStage(s.correctCount, perfect, firstTime);
  },

  clearSession: () => {
    set({ session: null });
    void db.session.delete(1);
  },

  clearSeenQuestions: () => {
    set({ seenQuestionKeys: [] });
    void db.profile.update(1, { seenQuestionKeys: [] });
    logEvent("questions.historyCleared", {});
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

  // Parent opt-in for timed encouragement notifications. Returns whether they
  // are actually armed (needs permission + a platform that can schedule them).
  setReminders: async (on) => {
    if (!on) {
      set({ remindersOn: false });
      persistSettings(get);
      await disarmReminders();
      logEvent("reminders.off", {});
      return false;
    }
    const perm = await requestReminderPermission();
    const armed = perm === "granted" ? await armReminders(Date.now()) : false;
    set({ remindersOn: armed });
    persistSettings(get);
    logEvent("reminders.on", { armed, perm });
    return armed;
  },

  ...worldAdminActions(set, get),

  ...giftActions(set, get),
  ...petActions(set, get),
  ...videoActions(set, get),
  ...worldAdminActions(set, get),
  ...couponActions(set, get),

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
