// The SOLVED view inside the amber "Almost — look at this." sheet: a small
// grid where Pogo replays the right program on a gentle loop over a numbered
// trail, the program as mini blocks (the playing block lights up), and one
// teaching line. Compact: grid beside blocks, under half a phone screen.
import { runProgram } from "../../../engine/code/judge";
import { codePayload, type CodeBlock, type CodePayload } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import type { TeachProps } from "../exercises/contract";
import { CodeGridView } from "./CodeGridView";
import { changedKeys } from "./codeRun";
import { ProgramTrack, type ArrowMark } from "./ProgramTrack";
import { activeRef, currentStep, poseOf, starsLeft, useLoopRun } from "./useRun";
import "./codeWidgets.css";

const T = CODE.exercise.teach;

interface Lesson {
  program: CodeBlock[];
  line: string;
  marks?: Record<string, ArrowMark>;
}

function lessonOf(payload: CodePayload): Lesson {
  if (payload.tour === "code-debug") {
    const marks: Record<string, ArrowMark> = {};
    for (const key of changedKeys(payload.program, payload.solution)) marks[key] = "fixed";
    return { program: payload.solution, line: T.debug, marks };
  }
  if (payload.tour === "code-trace") {
    return { program: payload.program, line: payload.task === "loop-trace" ? T.loopTrace : T.trace };
  }
  if (payload.task === "loop") return { program: payload.solution, line: T.loop };
  return { program: payload.solution, line: payload.task === "stars" ? T.stars : T.run };
}

/** The square the child tapped, when a trace answer was submitted. */
function tapped(submitted: string | undefined, size: number): number | null {
  if (!submitted || !/^\d+$/.test(submitted)) return null;
  const sq = Number(submitted);
  return sq < size * size ? sq : null;
}

function Replay({ payload, submitted }: { payload: CodePayload; submitted?: string }) {
  const { grid } = payload;
  const lesson = lessonOf(payload);
  const run = useLoopRun(grid, lesson.program, { pause: 1500, lead: 700 });
  const full = runProgram(grid, lesson.program);
  const trace = payload.tour === "code-trace";
  const end = trace ? full.end : null;
  const ring = trace ? tapped(submitted, grid.size) : null;
  const shownRing = ring !== null && ring !== end ? ring : null;
  const done = run.status === "done" && Boolean(currentStep(run)?.won);
  const pose = poseOf(run, grid.start);
  return (
    <div className="ck" data-testid={`teach-${payload.tour}`}>
      <CodeGridView
        grid={trace ? { ...grid, goal: -1 } : grid} pogo={{ ...pose, mood: done ? "happy" : "idle" }}
        stars={starsLeft(grid, run)} trail={full.path} pin={end} ring={shownRing} won={done} className="ck-grid"
      />
      <div className="ck-side">
        <ProgramTrack program={lesson.program} mode="mini" active={activeRef(run)} marks={lesson.marks} />
        <strong className="ck-line">{lesson.line}</strong>
        {shownRing !== null && <span className="ck-note"><i className="ck-ring" aria-hidden="true" />{T.yourTap}</span>}
      </div>
    </div>
  );
}

/** The solved view shown in the "Almost — look at this." sheet after a miss. */
export function CodeTeach({ question, submitted }: TeachProps) {
  const payload = codePayload(question);
  if (!payload) return null;
  return <Replay key={question.id} payload={payload} submitted={submitted} />;
}
