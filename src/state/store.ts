import { create } from "zustand";
import { db, logEvent, type BadgeRow, type CouponRow, type ProgressRow, type SessionRow } from "../engine/save/db";
import { generateQuestionSet } from "../engine/generators";
import { DEFAULT_RATING, difficultyFromRating, updateRating } from "../engine/difficulty/skillRating";
import { starsForResult } from "../engine/progress/stars";
import { isRapidGuessing, weightedPayout, workedExample } from "../engine/answers/answerEngine";
import { STR } from "../strings/en";
import { itemById } from "../engine/economy/catalog";
import { BADGES, stageById, type BadgeDef } from "../content/worlds";
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
}

function persistSettings(get: () => GameStore): void {
  const { soundOn, musicOn, lastStageId } = get();
  void db.settings.put({ id: 1, soundOn, musicOn, lastStageId: lastStageId ?? undefined });
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
  session: null,

  hydrate: async () => {
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
    const questions = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, {
      difficulty: difficultyFromRating(rating),
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
    if (correct) {
      // Anti-guessing: a missed CHOICE slot demands consecutive proof —
      // each owed proof is a fresh question, so lucky taps can't convert.
      if ((s.proveLeft ?? 0) > 1) {
        const [replacement] = generateQuestionSet(stage.generator, stage.params, 1, newSeed(), {
          difficulty: difficultyFromRating(ratings[skill] ?? DEFAULT_RATING),
          easier: false,
        });
        const questions = [...s.questions];
        questions[s.index] = replacement;
        next = {
          ...s,
          questions,
          proveLeft: (s.proveLeft ?? 0) - 1,
          lastAnswer: null,
          showHint: false,
          workedExample: null,
          missStreak: 0,
        };
        set({ skillRatings: ratings, session: next });
        persistSession(next);
        return "again";
      }
      next = {
        ...s,
        lastAnswer: "correct",
        correctCount: s.correctCount + 1,
        missStreak: 0,
        showHint: false,
        workedExample: null,
        proveLeft: 0,
      };
    } else {
      // Rule 1: discard the question, regenerate fresh at the same difficulty
      // (gentler after two consecutive misses or rapid guessing).
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
      const [replacement] = generateQuestionSet(stage.generator, stage.params, 1, newSeed(), {
        difficulty: easier ? 0 : difficultyFromRating(ratings[skill] ?? DEFAULT_RATING),
        easier,
      });
      const questions = [...s.questions];
      questions[s.index] = replacement;
      next = {
        ...s,
        questions,
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
    set({ skillRatings: ratings, session: next });
    persistSession(next);
    return correct ? "correct" : "wrong";
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

    if (item.kind === "coupon") {
      const starDust = state.starDust - item.cost;
      const row: CouponRow = { itemId, purchasedAt: Date.now(), redeemedAt: null };
      set({ starDust });
      void db.economy.put({ id: 1, starDust, melodyShards: 0 });
      void db.coupons.add(row).then((id) => {
        set({ coupons: [...get().coupons, { ...row, id }] });
      });
      logEvent("shop.coupon", { itemId, cost: item.cost });
      return true;
    }

    if (state.inventory.includes(itemId)) return false;
    const starDust = state.starDust - item.cost;
    set({ starDust, inventory: [...state.inventory, itemId] });
    void db.economy.put({ id: 1, starDust, melodyShards: 0 });
    void db.inventory.put({ itemId, purchasedAt: Date.now() });
    logEvent("shop.buy", { itemId, cost: item.cost });
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
}));
