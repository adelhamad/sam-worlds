// The course lesson player (/tour/lesson/:stageId, /chess/lesson/:stageId) — the
// Duolingo-style sibling of PlayStage. Course lessons are ordinary stages, so
// the session, judging, regenerate-on-miss, payouts and restore all come from
// the store; this screen adds the rhythm: Pogo asks → CHECK → feedback sheet →
// CONTINUE, with Star Dust banking live, a gift halfway and a cheer near the end.
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useGame, type Session } from "../../state/store";
import { COURSES, courseOfStage, lessonPlayable, type Course } from "../../content/courses";
import type { StageDef } from "../../content/types";
import { chessParams } from "../../content/chess/units";
import { codeParams } from "../../content/code/units";
import { kitParams } from "../../content/kitCourse";
import { tickParams } from "../../content/tick/units";
import { tourParams } from "../../content/tour/units";
import { missedDoneSlots, runningPayout } from "../../engine/answers/lessonRewards";
import type { ChessIntroKey } from "../../engine/chess/types";
import type { CodeIntroKey } from "../../engine/code/types";
import type { KitSlide } from "../../engine/kit/types";
import type { TickIntroKey } from "../../engine/tick/types";
import { unlockAudio } from "../../engine/feedback/audio";
import { LockedScreen } from "../../ui/LockedScreen";
import { Pogo, type PogoMood } from "../../ui/tour/Pogo";
import { TOUR } from "../../strings/tour";
import { ChessMeet } from "./chess/ChessMeet";
import { CodeMeet } from "./code/CodeMeet";
import { KitMeet } from "./kit/KitMeet";
import { TickMeet } from "./tick/TickMeet";
import { CheerBreak } from "./lesson/CheerBreak";
import { DustToken } from "./lesson/DustMeter";
import { FeedbackSheet } from "./lesson/FeedbackSheet";
import { GiftBreak } from "./lesson/GiftBreak";
import { LessonComplete } from "./lesson/LessonComplete";
import { LessonTopBar, QuitSheet } from "./lesson/LessonTopBar";
import { MeetIntro } from "./lesson/MeetIntro";
import { QuestionView } from "./lesson/QuestionView";
import { lessonSound } from "./lesson/lessonSound";
import { useDustMeter, type DustMeterState } from "./lesson/useDustMeter";
import { useLessonFlow, type LessonFlow, type LessonSheet } from "./lesson/useLessonFlow";
import "../../ui/tour/tour-base.css";
import "./lesson.css";
import "./lesson/rewards.css";

const MEET_MAX = 4;
const DEFAULT_PATH = COURSES[0].path;

/** Nothing answered yet — the only moment the opening demo may show. */
function isPristine(s: Session): boolean {
  return s.index === 0 && s.correctCount === 0 && s.firstTryMisses === 0 && !s.attemptMissed && s.wrongStamps.length === 0;
}

/** What a lesson opens with: a teach-first demo of its course family, or nothing. */
type Opening =
  | { kind: "countries"; codes: string[] }
  | { kind: "chess"; intro: ChessIntroKey }
  | { kind: "code"; intro: CodeIntroKey }
  | { kind: "tick"; intro: TickIntroKey }
  | { kind: "kit"; slides: KitSlide[] }
  | null;

function openingOf(course: Course, stage: StageDef): Opening {
  if (stage.generator === "kit") {
    const slides = kitParams(stage).intro;
    return slides?.length ? { kind: "kit", slides } : null;
  }
  if (stage.generator === "code") {
    const intro = codeParams(stage).intro;
    return intro ? { kind: "code", intro } : null;
  }
  if (stage.generator === "tick") {
    const intro = tickParams(stage).intro;
    return intro ? { kind: "tick", intro } : null;
  }
  if (course.id === "tour") {
    const codes = tourParams(stage).focus;
    return codes.length <= MEET_MAX ? { kind: "countries", codes } : null;
  }
  const intro = chessParams(stage).intro;
  return intro ? { kind: "chess", intro } : null;
}

/** Pogo's acting after an answer, in beats from the moment the sheet opens. A
    miss: the "oops" jolt, then it sinks in, then he focuses on the worked answer.
    The first right answer after a miss: "phew", then proud. */
const OOPS_MS = 600;
const SAD_MS = 1200;
const PHEW_MS = 1000;
/** After the right-answer chirp, so the two never talk over each other. */
const PHEW_VOICE_MS = 380;
const COMBO_MOODS: Record<number, PogoMood> = { 3: "cheer", 5: "twirl", 8: "flip" };

interface PogoReaction {
  mood: PogoMood | null;
  /** Pogo's bubble line instead of the prompt (miss sheet only). */
  line: string | null;
}

/** What Pogo remembers about the slot being played: misses so far, and which
    sheet (if any) was the fix. Sheets only ever arrive one at a time. */
interface SlotMemory {
  seen: number;
  slot: number;
  misses: number;
  fixedId: number;
}

function rememberSheet(memory: SlotMemory, sheet: LessonSheet, slot: number): SlotMemory {
  if (sheet.kind === "almost") {
    return { ...memory, seen: sheet.id, slot, misses: memory.slot === slot ? memory.misses + 1 : 1 };
  }
  // A "correct" sheet arrives after the store moved on; "again" stays in the slot.
  const answered = sheet.kind === "correct" ? slot - 1 : slot;
  const fixed = memory.misses > 0 && memory.slot === answered;
  return { seen: sheet.id, slot: answered, misses: 0, fixedId: fixed ? sheet.id : memory.fixedId };
}

/** Which beat of the current sheet's little scene is showing (0, 1, 2). */
function usePogoBeat(sheet: LessonSheet | null, fixed: boolean, tricky: boolean): number {
  const [beat, setBeat] = useState({ id: -1, n: 0 });
  const id = sheet?.id ?? -1;
  const missed = sheet?.kind === "almost";
  const calm = Boolean(sheet?.slowDown);
  useEffect(() => {
    if (id < 0 || (!missed && !fixed)) return;
    const at = (ms: number, n: number, sound?: () => void) => setTimeout(() => {
      setBeat({ id, n });
      sound?.();
    }, ms);
    const timers = missed
      ? [at(OOPS_MS, 1, tricky && !calm ? lessonSound.sinks : undefined), at(OOPS_MS + SAD_MS, 2, calm ? undefined : lessonSound.focus)]
      : [setTimeout(lessonSound.relieved, PHEW_VOICE_MS), at(PHEW_MS, 1)];
    return () => timers.forEach(clearTimeout);
  }, [id, missed, fixed, tricky, calm]);
  return beat.id === id ? beat.n : 0;
}

function reactionMood(sheet: LessonSheet, beat: number, fixed: boolean, tricky: boolean): PogoMood {
  if (sheet.kind === "almost") {
    if (beat === 0) return "oops";
    if (sheet.slowDown) return "whoa";
    if (beat === 1) return tricky ? "worried" : "sad";
    return "focus";
  }
  if (fixed) return beat === 0 ? "relieved" : "proud";
  return sheet.comboCount === null ? "happy" : COMBO_MOODS[sheet.comboCount] ?? "cheer";
}

function reactionLine(sheet: LessonSheet | null, tricky: boolean): string | null {
  if (sheet?.kind !== "almost") return null;
  if (sheet.slowDown) return TOUR.lesson.slowDown;
  if (tricky) return TOUR.lesson.focusTricky;
  const lines = TOUR.lesson.focusLines;
  return lines[sheet.id % lines.length];
}

/** Pogo's reaction to the last answer: glad (bigger on a combo, at the end);
    after a miss the mistake registers — oops, sad (worried on a second miss),
    then focused on the worked answer — and the fix is a "phew" and proud. */
function usePogoReaction(sheet: LessonSheet | null, finale: boolean): PogoReaction {
  const slot = useGame((s) => s.session?.index ?? 0);
  const [memory, setMemory] = useState<SlotMemory>(() => {
    const s = useGame.getState().session; // a restored retry already had its miss
    return { seen: -1, slot: s?.index ?? 0, misses: s?.attemptMissed ? 1 : 0, fixedId: -1 };
  });
  if (sheet && sheet.id !== memory.seen) setMemory(rememberSheet(memory, sheet, slot));
  const fixed = sheet !== null && memory.fixedId === sheet.id;
  const tricky = sheet?.kind === "almost" && memory.misses > 1;
  const beat = usePogoBeat(sheet, fixed, tricky);
  if (finale) return { mood: "cheer", line: null };
  return { mood: sheet ? reactionMood(sheet, beat, fixed, tricky) : null, line: reactionLine(sheet, tricky) };
}

function UnknownLesson() {
  // No such lesson: go back to the path of the course the address names.
  const { pathname } = useLocation();
  const path = COURSES.find((course) => pathname.startsWith(`${course.path}/`))?.path ?? DEFAULT_PATH;
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-lost">
        <Pogo mood="think" size={120} />
        <p className="tl-lost-text">{TOUR.lesson.unknown}</p>
        <Link to={path} className="tbtn tbtn-go">{TOUR.lesson.backToPath}</Link>
      </div>
    </div>
  );
}

/** DEV test bench: drive the answer loop from the console / screenshot steps. */
function useDevHandle(flow: LessonFlow): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const host = window as unknown as Record<string, unknown>;
    host.__game = useGame;
    host.__tourLesson = flow;
  }, [flow]);
}

/** The gift / the cheer, shown in place of the next question. */
function InterludeView({ flow }: { flow: LessonFlow }) {
  const { interlude } = flow;
  if (!interlude) return null;
  if (interlude.kind === "gift") {
    return <GiftBreak key={interlude.id} id={interlude.id} dust={interlude.dust} onOpen={flow.collectGift} onDone={flow.endInterlude} />;
  }
  return <CheerBreak key={interlude.id} id={interlude.id} left={interlude.left} onDone={flow.endInterlude} />;
}

function OpeningView({ opening, onStart }: { opening: NonNullable<Opening>; onStart: () => void }) {
  const start = () => { unlockAudio(); onStart(); };
  if (opening.kind === "countries") return <MeetIntro codes={opening.codes} onStart={onStart} />;
  if (opening.kind === "kit") return <KitMeet slides={opening.slides} onStart={start} />;
  if (opening.kind === "code") return <CodeMeet intro={opening.intro} onStart={start} />;
  if (opening.kind === "tick") return <TickMeet intro={opening.intro} onStart={start} />;
  return <ChessMeet intro={opening.intro} onStart={start} />;
}

interface LessonBodyProps {
  course: Course;
  stage: StageDef;
  session: Session;
}

/** The live Star Dust meter — derived from the session, so a reload restores it. */
function useSessionMeter(stage: StageDef, session: Session, flow: LessonFlow): DustMeterState {
  const { result } = session;
  const total = session.questions.length;
  const done = result ? total : session.index;
  const missed = missedDoneSlots(done, session.firstTryMisses, !result && session.attemptMissed);
  const banked = runningPayout(stage.payout, total, done, missed, result ? result.firstTime : flow.firstCompletion);
  return useDustMeter(banked, missed, flow.giftCollected);
}

/** Top bar · opening demo / question / interlude · feedback sheet. */
function LessonPlay({ course, stage, session, flow, meter }: LessonBodyProps & { flow: LessonFlow; meter: DustMeterState }) {
  const navigate = useNavigate();
  const [introDone, setIntroDone] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const { sheet, finale, interlude } = flow;
  const finished = session.result !== null;
  const total = session.questions.length;

  // While a sheet is open the answered question stays on screen; the store
  // already holds the next one, revealed when the sheet (and any interlude
  // queued behind it) is gone.
  const between = !sheet && interlude !== null;
  const next = finished || between ? null : session.questions[session.index] ?? null;
  // The answered question, held on screen by a sheet or by the lesson's last beat.
  const held = sheet?.question ?? finale;
  const question = held ?? next;
  const reaction = usePogoReaction(sheet, finale !== null);
  const opening = !sheet && !between && !introDone && isPristine(session) ? openingOf(course, stage) : null;

  return (
    <>
      <LessonTopBar
        done={finished ? total : session.index} total={total} combo={flow.combo}
        dust={meter.shown} dustBumps={meter.bumps} cheering={between && interlude.kind === "cheer"}
        onQuit={() => { lessonSound.tap(); setQuitOpen(true); }}
      />
      {opening && <OpeningView opening={opening} onStart={() => setIntroDone(true)} />}
      {!opening && question && (
        <QuestionView
          question={question} locked={held !== null || quitOpen} reaction={reaction.mood} reactionKey={sheet?.id}
          aside={reaction.line} dimmed={sheet?.kind === "almost"} retry={session.attemptMissed}
          onSubmit={flow.submit}
        />
      )}
      {between && <InterludeView flow={flow} />}
      {sheet && <FeedbackSheet key={sheet.id} sheet={sheet} onContinue={flow.dismiss} onSkip={flow.skip} />}
      {meter.tokens.map((token) => <DustToken key={token.id} token={token} onLand={meter.land} />)}
      {quitOpen && (
        <QuitSheet
          onStay={() => { lessonSound.tap(); setQuitOpen(false); }}
          onLeave={() => { lessonSound.tap(); navigate(course.path); }} // the session stays saved
        />
      )}
    </>
  );
}

function LessonBody({ course, stage, session }: LessonBodyProps) {
  const navigate = useNavigate();
  const clearSession = useGame((s) => s.clearSession);
  const flow = useLessonFlow(stage.id);
  const meter = useSessionMeter(stage, session, flow);
  useDevHandle(flow);

  const { result } = session;
  if (!result || flow.sheet || flow.finale) return <LessonPlay course={course} stage={stage} session={session} flow={flow} meter={meter} />;
  return (
    <LessonComplete
      course={course} stage={stage} seed={session.seed} result={result}
      total={session.questions.length} misses={session.firstTryMisses}
      focus={course.id === "tour" ? tourParams(stage).focus : null}
      newStamps={flow.newStamps} dayNumber={flow.dayNumber} giftDust={flow.giftCollected}
      onContinue={() => {
        lessonSound.tap();
        clearSession(); // clean ending: back to the path, no auto-chaining
        navigate(course.path);
      }}
    />
  );
}

export function TourLesson() {
  const { stageId = "" } = useParams();
  const course = courseOfStage(stageId);
  const stage = course?.world.stages.find((item) => item.id === stageId);
  const worldEnabled = useGame((s) => Boolean(course && s.enabledWorlds[course.worldId]));
  const playable = useGame((s) => Boolean(course && lessonPlayable(course, stageId, s.progress)));
  const session = useGame((s) => (s.session?.stageId === stageId ? s.session : null));
  const startStage = useGame((s) => s.startStage);
  const ready = Boolean(stage) && worldEnabled && playable;

  // Start a session unless an in-progress one for this lesson was restored.
  // (StrictMode runs this twice: the second pass finds the first one's session.)
  useEffect(() => {
    if (!ready) return;
    const s = useGame.getState().session;
    if (!s || s.stageId !== stageId || s.result) startStage(stageId);
  }, [ready, stageId, startStage]);

  if (!course || !stage) return <UnknownLesson />;
  if (!worldEnabled) return <LockedScreen />;
  if (!playable) return <Navigate to={course.path} replace />;

  return (
    <div className="screen tour tour-lesson">
      {session && <LessonBody key={session.seed} course={course} stage={stage} session={session} />}
    </div>
  );
}
