// The lesson's answer loop. Judging, regenerate-on-miss, payouts and restore all
// live in the store (answer / advance / revealAnswer) — this hook only decides
// what the child SEES after each verdict: which feedback sheet, the combo, the
// passport stamps and the tour day.
import { useCallback, useRef, useState } from "react";
import { REVEAL_COST, useGame } from "../../../state/store";
import type { Question } from "../../../engine/generators/types";
import { tourPayload } from "../../../engine/tour/types";
import { unlockAudio } from "../../../engine/feedback/audio";
import { TOUR } from "../../../strings/tour";
import { lessonSound } from "./lessonSound";

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

export interface LessonFlow {
  sheet: LessonSheet | null;
  /** First-try correct answers in a row. */
  combo: number;
  /** Stamps earned during this lesson (for the completion screen). */
  newStamps: string[];
  /** Set when this lesson was the first one finished today. */
  dayNumber: number | null;
  submit: (value: string) => void;
  /** CONTINUE / GOT IT. */
  dismiss: () => void;
  /** Spend Star Dust to skip the slot (from the miss sheet). */
  skip: () => void;
}

export const COMBO_MILESTONES = [3, 5, 8];
/** CONTINUE lands exactly where CHECK was: a double tap must not skip the feedback. */
const TAP_THROUGH_MS = 400;

function pickPraise(): string {
  const lines = TOUR.lesson.praise;
  return lines[Math.floor(Math.random() * lines.length)];
}

/** Plays the fanfare when the lesson has just finished. */
function celebrateIfDone(): boolean {
  const result = useGame.getState().session?.result;
  if (!result || result.noQuestions) return false;
  lessonSound.done(result);
  return true;
}

export function useLessonFlow(stageId: string): LessonFlow {
  const [sheet, setSheet] = useState<LessonSheet | null>(null);
  const [combo, setCombo] = useState(0);
  const [newStamps, setNewStamps] = useState<string[]>([]);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  // Handler-only state: a sheet is open (blocks double submits), the running
  // combo, the sheet counter / open time and which session marked its tour day.
  const openRef = useRef(false);
  const comboRef = useRef(0);
  const sheetIdRef = useRef(0);
  const openedAtRef = useRef(0);
  const markedSeedRef = useRef<number | null>(null);

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

  const onCorrect = useCallback((question: Question, submitted: string, firstTry: boolean) => {
    const game = useGame.getState();
    const stamps = firstTry ? game.tourCredit(tourPayload(question)?.codes ?? []) : [];
    const streak = firstTry ? comboRef.current + 1 : 0;
    setStreak(streak);
    const level = COMBO_MILESTONES.indexOf(streak) + 1;
    // Commit the slot before the feedback shows: a reload during the sheet must
    // land on the next question, never score this one twice.
    game.advance();
    markDayIfDone();
    if (stamps.length) setNewStamps((prev) => [...prev, ...stamps]);
    lessonSound.correct();
    if (level > 0) lessonSound.combo(level);
    else if (stamps.length) lessonSound.stamp();
    show({
      kind: "correct", question, submitted, title: pickPraise(), stamps,
      comboCount: level > 0 ? streak : null, canSkip: false, slowDown: false,
    });
  }, [markDayIfDone, setStreak, show]);

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

  const submit = useCallback((value: string) => {
    if (openRef.current) return;
    const game = useGame.getState();
    const before = game.session;
    if (!before || before.stageId !== stageId || before.result) return;
    const question = before.questions[before.index];
    if (!question) return;
    unlockAudio();
    // Capture everything BEFORE answering: the store swaps the question at once.
    const firstTry = !before.attemptMissed;
    const verdict = game.answer(value);
    if (verdict === "correct") onCorrect(question, value, firstTry);
    else if (verdict === "wrong") onMiss(question, value, firstTry, Boolean(before.companionLine));
    else if (verdict === "again") {
      // Right, but one more is owed — the fresh question is already in place.
      lessonSound.correct();
      show({
        kind: "again", question, submitted: value, title: TOUR.lesson.proveAgain, stamps: [],
        comboCount: null, canSkip: false, slowDown: false,
      });
    } else if (verdict === "exhausted") {
      // The slot was dropped: carry on with whatever the session now shows.
      markDayIfDone();
      if (!celebrateIfDone()) lessonSound.next();
    }
  }, [markDayIfDone, onCorrect, onMiss, show, stageId]);

  const close = useCallback(() => {
    openRef.current = false;
    setSheet(null);
    if (!celebrateIfDone()) lessonSound.next();
  }, []);

  const dismiss = useCallback(() => {
    if (openRef.current && Date.now() - openedAtRef.current >= TAP_THROUGH_MS) close();
  }, [close]);

  const skip = useCallback(() => {
    if (!openRef.current) return;
    const game = useGame.getState();
    if (game.revealAnswer() !== "revealed") return;
    game.advance();
    markDayIfDone();
    close();
  }, [close, markDayIfDone]);

  return { sheet, combo, newStamps, dayNumber, submit, dismiss, skip };
}
