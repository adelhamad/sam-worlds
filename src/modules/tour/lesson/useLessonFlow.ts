// The lesson's answer loop. Judging, regenerate-on-miss, payouts and restore all
// live in the store (answer / advance / revealAnswer) — this hook only decides
// what the child SEES after each verdict: which feedback sheet, the combo, the
// passport stamps, the tour day, and the interludes that show between a sheet
// and the next question (the mid-lesson gift, Pogo's cheer and — in language
// lessons with speaking practice on — one unjudged speaking break).
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { REVEAL_COST, useGame, type Session } from "../../../state/store";
import type { Question } from "../../../engine/generators/types";
import type { LangCard, LangCode } from "../../../engine/lang/types";
import { giftDust, lessonBreaks, type SlotTally } from "../../../engine/answers/lessonRewards";
import { tourPayload } from "../../../engine/tour/types";
import { unlockAudio } from "../../../engine/feedback/audio";
import { TOUR } from "../../../strings/tour";
import { claimLessonGift } from "./giftGuard";
import { lessonSound } from "./lessonSound";
import { speakDue } from "./speakSlot";

export type SheetKind = "correct" | "again" | "almost";

export interface LessonSheet {
  /** Unique per sheet — restarts animations and the miss lock. */
  id: number;
  kind: SheetKind;
  /** The question that was answered. Frozen: the store has already moved on. */
  question: Question;
  submitted: string;
  title: string;
  /** Countries whose passport stamp landed with this answer. */
  stamps: string[];
  /** 3, 5 or 8 when this answer hit a combo milestone. */
  comboCount: number | null;
  /** Second miss in the slot and the dust is there: offer the quiet skip. */
  canSkip: boolean;
  /** The store noticed rapid guessing: Pogo says one warm line. */
  slowDown: boolean;
}

/** A moment between two questions. The gift's Star Dust is already paid. */
export type Interlude =
  | { id: number; kind: "gift"; dust: number }
  | { id: number; kind: "cheer"; left: number }
  | { id: number; kind: "speak"; lang: LangCode; card: LangCard };

/** What the speaking break would ask for right now, or null (practice off, mic unusable, nothing to say). */
export type SpeakOffer = () => { lang: LangCode; card: LangCard } | null;

export interface LessonFlow {
  sheet: LessonSheet | null;
  /** The last answer was right and the lesson is over: its solved puzzle holds
      the screen for one beat (no sheet) before the celebration takes over. */
  finale: Question | null;
  /** Showing instead of the next question — never over a sheet. */
  interlude: Interlude | null;
  /** First-try correct answers in a row. */
  combo: number;
  /** Stamps earned during this lesson (for the completion screen). */
  newStamps: string[];
  /** Set when this lesson was the first one finished today. */
  dayNumber: number | null;
  /** The lesson had never been finished when this session began. */
  firstCompletion: boolean;
  /** Star Dust from the gift opened in this sitting (0 = none). */
  giftCollected: number;
  submit: (value: string) => void;
  /** CONTINUE / GOT IT. */
  dismiss: () => void;
  /** Spend Star Dust to skip the slot (from the miss sheet). */
  skip: () => void;
  /** The child opened the gift box. */
  collectGift: () => void;
  /** Interlude `id` is over: on to the next one, or the next question. */
  endInterlude: (id: number) => void;
}

export const COMBO_MILESTONES = [3, 5, 8];
/** CONTINUE lands exactly where CHECK was: a double tap must not skip the feedback. */
const TAP_THROUGH_MS = 400;
/** How long the last solved puzzle stays up before Pogo's celebration. */
const FINALE_BEAT_MS = 650;

function pickPraise(): string {
  const lines = TOUR.lesson.praise;
  return lines[Math.floor(Math.random() * lines.length)];
}

/** The lesson has just finished: the celebration screen (and its fanfare) is next. */
function lessonOver(): boolean {
  const result = useGame.getState().session?.result;
  return Boolean(result && !result.noQuestions);
}

function tallyOf(s: Session): SlotTally {
  return { done: s.result ? s.questions.length : s.index, total: s.questions.length };
}

/** The gift and the cheer: a queue filled when a slot is committed and shown
    one at a time once the feedback sheet is gone. */
function useInterludes(firstCompletion: boolean, speakOffer: SpeakOffer | undefined) {
  const [interlude, setInterlude] = useState<Interlude | null>(null);
  const [giftCollected, setGiftCollected] = useState(0);
  const queueRef = useRef<Interlude[]>([]);
  const currentRef = useRef<Interlude | null>(null);
  const idRef = useRef(0);
  const offerRef = useRef(speakOffer);
  useEffect(() => {
    offerRef.current = speakOffer;
  }, [speakOffer]);

  /** A slot was just committed (answered or skipped): line up what it set off.
      Only the step that reaches a slot fires, so a restored session never
      replays a gift — and the gift is paid right here, not when it is tapped. */
  const settleSlot = useCallback((before: Session) => {
    const game = useGame.getState();
    const s = game.session;
    if (!s) return;
    const after = tallyOf(s);
    const due = lessonBreaks(tallyOf(before), after);
    const speak = speakDue(tallyOf(before), after) ? offerRef.current?.() : null;
    if (speak) {
      idRef.current += 1;
      queueRef.current.push({ id: idRef.current, kind: "speak", ...speak });
    }
    if (due.gift && claimLessonGift(s.seed)) {
      const dust = giftDust(firstCompletion);
      game.earnDust(dust, "lesson.gift");
      idRef.current += 1;
      queueRef.current.push({ id: idRef.current, kind: "gift", dust });
    }
    if (due.cheer) {
      idRef.current += 1;
      queueRef.current.push({ id: idRef.current, kind: "cheer", left: after.total - after.done });
    }
  }, [firstCompletion]);

  /** Shows the next queued interlude; false when there is none (or the lesson is over). */
  const showNext = useCallback((): boolean => {
    if (useGame.getState().session?.result) queueRef.current = [];
    const next = queueRef.current.shift() ?? null;
    currentRef.current = next;
    setInterlude(next);
    if (next?.kind === "gift") lessonSound.giftShow();
    if (next?.kind === "cheer") lessonSound.cheer();
    return next !== null;
  }, []);

  const collectGift = useCallback(() => {
    const current = currentRef.current;
    if (current?.kind === "gift") setGiftCollected(current.dust);
  }, []);

  const endInterlude = useCallback((id: number) => {
    if (currentRef.current?.id !== id) return; // the timer and a tap can both call
    if (!showNext()) lessonSound.next();
  }, [showNext]);

  const isShowing = useCallback(() => currentRef.current !== null, []);

  return { interlude, giftCollected, settleSlot, showNext, collectGift, endInterlude, isShowing };
}

export function useLessonFlow(stageId: string, speakOffer?: SpeakOffer): LessonFlow {
  const [sheet, setSheet] = useState<LessonSheet | null>(null);
  const [finale, setFinale] = useState<Question | null>(null);
  const [combo, setCombo] = useState(0);
  const [newStamps, setNewStamps] = useState<string[]>([]);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  // Captured before the final advance() flips `progress` for this lesson.
  const [firstCompletion] = useState(() => !useGame.getState().progress[stageId]?.completed);
  const { interlude, giftCollected, settleSlot, showNext, collectGift, endInterlude, isShowing } = useInterludes(firstCompletion, speakOffer);
  // Handler-only state: a sheet is open (blocks double submits), the running
  // combo, the sheet counter / open time and which session marked its tour day.
  const openRef = useRef(false);
  const comboRef = useRef(0);
  const sheetIdRef = useRef(0);
  const openedAtRef = useRef(0);
  const markedSeedRef = useRef<number | null>(null);
  const finaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (finaleTimer.current) clearTimeout(finaleTimer.current);
  }, []);

  const show = useCallback((next: Omit<LessonSheet, "id">) => {
    sheetIdRef.current += 1;
    openRef.current = true;
    openedAtRef.current = Date.now();
    setSheet({ ...next, id: sheetIdRef.current });
  }, []);

  /** The lesson result exists the moment the last slot is committed. */
  const markDayIfDone = useCallback(() => {
    const s = useGame.getState().session;
    if (!s?.result || s.result.noQuestions || markedSeedRef.current === s.seed) return;
    markedSeedRef.current = s.seed;
    if (useGame.getState().tourMarkDay()) setDayNumber(useGame.getState().tourDays);
  }, []);

  const setStreak = useCallback((value: number) => {
    comboRef.current = value;
    setCombo(value);
  }, []);

  const onCorrect = useCallback((before: Session, question: Question, submitted: string) => {
    const game = useGame.getState();
    const firstTry = !before.attemptMissed;
    // Passport stamps are geography-only: chess questions carry no country codes.
    const stamps = firstTry ? game.tourCredit(tourPayload(question)?.codes ?? []) : [];
    const streak = firstTry ? comboRef.current + 1 : 0;
    setStreak(streak);
    const level = COMBO_MILESTONES.indexOf(streak) + 1;
    // Commit the slot before the feedback shows: a reload during the sheet must
    // land on the next question, never score this one twice.
    game.advance();
    settleSlot(before);
    markDayIfDone();
    if (stamps.length) setNewStamps((prev) => [...prev, ...stamps]);
    lessonSound.correct();
    if (level > 0) lessonSound.combo(level);
    else if (stamps.length) lessonSound.stamp();
    if (useGame.getState().session?.result) {
      // The lesson is over: no sheet over a puzzle that is finished. The solved
      // puzzle holds for a beat, then the celebration screen says it all.
      setFinale(question);
      finaleTimer.current = setTimeout(() => setFinale(null), FINALE_BEAT_MS);
      return;
    }
    show({
      kind: "correct", question, submitted, title: pickPraise(), stamps,
      comboCount: level > 0 ? streak : null, canSkip: false, slowDown: false,
    });
  }, [markDayIfDone, setStreak, settleSlot, show]);

  const onMiss = useCallback((question: Question, submitted: string, firstTry: boolean, hadLine: boolean) => {
    const game = useGame.getState();
    setStreak(0); // silently — never a "combo lost" message
    lessonSound.almost();
    show({
      kind: "almost", question, submitted, title: TOUR.lesson.almost, stamps: [], comboCount: null,
      canSkip: !firstTry && game.starDust >= REVEAL_COST,
      slowDown: !hadLine && Boolean(game.session?.companionLine),
    });
  }, [setStreak, show]);

  const judge = useCallback((value: string) => {
    if (openRef.current || isShowing()) return;
    const game = useGame.getState();
    const before = game.session;
    if (!before || before.stageId !== stageId || before.result) return;
    const question = before.questions[before.index];
    if (!question) return;
    unlockAudio();
    // `before` is captured BEFORE answering: the store swaps the question at once.
    const verdict = game.answer(value);
    if (verdict === "correct") onCorrect(before, question, value);
    else if (verdict === "wrong") onMiss(question, value, !before.attemptMissed, Boolean(before.companionLine));
    else if (verdict === "again") {
      // Right, but one more is owed — the fresh question is already in place.
      lessonSound.correct();
      show({
        kind: "again", question, submitted: value, title: TOUR.lesson.proveAgain, stamps: [],
        comboCount: null, canSkip: false, slowDown: false,
      });
    } else if (verdict === "exhausted") {
      // The slot was dropped: carry on with whatever the session now shows.
      settleSlot(before);
      markDayIfDone();
      if (!lessonOver() && !showNext()) lessonSound.next();
    }
  }, [isShowing, markDayIfDone, onCorrect, onMiss, settleSlot, show, showNext, stageId]);

  // Self-submitting puzzles (missions, pairs, code runs) report from a timer,
  // where React would paint the store's next question BEFORE the sheet state
  // lands — tearing down the solved puzzle and rebuilding it from scratch under
  // the "You got it!" sheet. One synchronous commit keeps what the child built.
  const submit = useCallback((value: string) => flushSync(() => judge(value)), [judge]);

  const close = useCallback(() => {
    openRef.current = false;
    setSheet(null);
    // The celebration screen comes first: nothing may sit on top of it.
    if (!lessonOver() && !showNext()) lessonSound.next();
  }, [showNext]);

  const dismiss = useCallback(() => {
    if (openRef.current && Date.now() - openedAtRef.current >= TAP_THROUGH_MS) close();
  }, [close]);

  const skip = useCallback(() => {
    if (!openRef.current) return;
    const game = useGame.getState();
    const before = game.session;
    if (!before || game.revealAnswer() !== "revealed") return;
    game.advance();
    settleSlot(before); // a skipped slot is a finished slot too
    markDayIfDone();
    close();
  }, [close, markDayIfDone, settleSlot]);

  return {
    sheet, finale, interlude, combo, newStamps, dayNumber, firstCompletion, giftCollected,
    submit, dismiss, skip, collectGift, endInterlude,
  };
}
