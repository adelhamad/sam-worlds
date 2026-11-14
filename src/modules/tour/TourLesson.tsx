// World Tour lesson player (/tour/lesson/:stageId) — the Duolingo-style sibling
// of PlayStage. Tour lessons are ordinary stages, so the session, judging,
// regenerate-on-miss, payouts and restore all come from the store; this screen
// adds the rhythm: Pogo asks → CHECK → feedback sheet → CONTINUE.
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useGame, type Session } from "../../state/store";
import { stageById } from "../../content/worlds";
import type { StageDef } from "../../content/types";
import { TOUR_WORLD, TOUR_WORLD_ID, isTourStage, tourParams } from "../../content/tour/units";
import { LockedScreen } from "../../ui/LockedScreen";
import { Pogo, type PogoMood } from "../../ui/tour/Pogo";
import { TOUR } from "../../strings/tour";
import { FeedbackSheet } from "./lesson/FeedbackSheet";
import { LessonComplete } from "./lesson/LessonComplete";
import { LessonTopBar, QuitSheet } from "./lesson/LessonTopBar";
import { MeetIntro } from "./lesson/MeetIntro";
import { QuestionView } from "./lesson/QuestionView";
import { lessonSound } from "./lesson/lessonSound";
import { useLessonFlow, type LessonFlow, type LessonSheet } from "./lesson/useLessonFlow";
import "../../ui/tour/tour-base.css";
import "./lesson.css";

const MEET_MAX = 4;
const PATH = "/tour";

/** Lessons unlock in order: the first one, a finished one, or the next in line. */
function lessonPlayable(stageId: string, progress: Record<string, { completed: boolean }>): boolean {
  const stages = TOUR_WORLD.stages;
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index <= 0) return index === 0;
  return Boolean(progress[stageId]?.completed || progress[stages[index - 1].id]?.completed);
}

/** Nothing answered yet — the only moment the meet intro may show. */
function isPristine(s: Session): boolean {
  return s.index === 0 && s.correctCount === 0 && s.firstTryMisses === 0 && !s.attemptMissed && s.wrongStamps.length === 0;
}

function reactionFor(sheet: LessonSheet | null): PogoMood | null {
  if (!sheet) return null;
  if (sheet.kind === "almost") return "think";
  return sheet.comboCount === null ? "happy" : "cheer";
}

function UnknownLesson() {
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-lost">
        <Pogo mood="think" size={120} />
        <p className="tl-lost-text">{TOUR.lesson.unknown}</p>
        <Link to={PATH} className="tbtn tbtn-go">{TOUR.lesson.backToPath}</Link>
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

function LessonBody({ stage, session }: { stage: StageDef; session: Session }) {
  const navigate = useNavigate();
  const clearSession = useGame((s) => s.clearSession);
  const flow = useLessonFlow(stage.id);
  const [introDone, setIntroDone] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  useDevHandle(flow);

  const { sheet } = flow;
  const { result } = session;
  const focus = tourParams(stage).focus;
  const total = session.questions.length;

  if (result && !sheet) {
    return (
      <LessonComplete
        stageId={stage.id} seed={session.seed} result={result} total={total} misses={session.firstTryMisses}
        focus={focus} newStamps={flow.newStamps} dayNumber={flow.dayNumber}
        onContinue={() => {
          lessonSound.tap();
          clearSession(); // clean ending: back to the path, no auto-chaining
          navigate(PATH);
        }}
      />
    );
  }

  // While a sheet is open the answered question stays on screen; the store
  // already holds the next one, revealed when the sheet closes.
  const question = sheet?.question ?? (result ? null : session.questions[session.index] ?? null);
  const showIntro = !sheet && !introDone && focus.length <= MEET_MAX && isPristine(session);

  return (
    <>
      <LessonTopBar
        done={result ? total : session.index} total={total} combo={flow.combo}
        onQuit={() => { lessonSound.tap(); setQuitOpen(true); }}
      />
      {showIntro && <MeetIntro codes={focus} onStart={() => setIntroDone(true)} />}
      {!showIntro && question && (
        <QuestionView
          question={question} locked={sheet !== null || quitOpen} reaction={reactionFor(sheet)} reactionKey={sheet?.id}
          aside={sheet?.slowDown ? TOUR.lesson.slowDown : null} dimmed={sheet?.kind === "almost"}
          onSubmit={flow.submit}
        />
      )}
      {sheet && <FeedbackSheet key={sheet.id} sheet={sheet} onContinue={flow.dismiss} onSkip={flow.skip} />}
      {quitOpen && (
        <QuitSheet
          onStay={() => { lessonSound.tap(); setQuitOpen(false); }}
          onLeave={() => { lessonSound.tap(); navigate(PATH); }} // the session stays saved
        />
      )}
    </>
  );
}

export function TourLesson() {
  const { stageId = "" } = useParams();
  const stage = isTourStage(stageId) ? stageById(stageId) : undefined;
  const worldEnabled = useGame((s) => Boolean(s.enabledWorlds[TOUR_WORLD_ID]));
  const playable = useGame((s) => lessonPlayable(stageId, s.progress));
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

  if (!stage) return <UnknownLesson />;
  if (!worldEnabled) return <LockedScreen />;
  if (!playable) return <Navigate to={PATH} replace />;

  return (
    <div className="screen tour tour-lesson">
      {session && <LessonBody key={session.seed} stage={stage} session={session} />}
    </div>
  );
}
