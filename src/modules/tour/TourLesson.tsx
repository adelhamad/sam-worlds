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

/** How long Pogo stays sad after a miss before leaning in to look at the answer. */
const SAD_MS = 1700;

/** Pogo's reaction to the last answer: glad, extra glad on a combo and at the
    end of the lesson — and after a miss, sad for a moment, then curious. */
function usePogoReaction(sheet: LessonSheet | null, finale: boolean): PogoMood | null {
  const missId = sheet?.kind === "almost" ? sheet.id : null;
  const [lookingAt, setLookingAt] = useState<number | null>(null);
  useEffect(() => {
    if (missId === null) return;
    const timer = setTimeout(() => setLookingAt(missId), SAD_MS);
    return () => clearTimeout(timer);
  }, [missId]);
  if (finale) return "cheer";
  if (!sheet) return null;
  if (missId !== null) return lookingAt === missId ? "think" : "sad";
  return sheet.comboCount === null ? "happy" : "cheer";
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
          question={question} locked={held !== null || quitOpen} reaction={reaction} reactionKey={sheet?.id}
          aside={sheet?.slowDown ? TOUR.lesson.slowDown : null} dimmed={sheet?.kind === "almost"}
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
