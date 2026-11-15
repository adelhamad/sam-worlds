// code-debug — a program with a bug. "Watch" plays the given program as a
// ghost run (no submit, replayable); tapping an arrow opens a picker to turn
// it. At most `edits` arrows may differ at once: turning one more snaps the
// oldest change back (felt, not explained). RUN plays the edited program for
// real, then reports debugVerdict(payload, program). The engine judges.
import { useState } from "react";
import { debugVerdict } from "../../../engine/code/judge";
import type { CodeBlock, DebugPayload, Dir } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import type { WidgetProps } from "../exercises/shared";
import { DirPicker } from "./BlockPalette";
import { HelpBar, RunButton } from "./CodeBits";
import { CodeGridView } from "./CodeGridView";
import { arrowAt, changedKeys, withArrow } from "./codeRun";
import { codeSound } from "./codeSound";
import { ProgramTrack, type ArrowMark } from "./ProgramTrack";
import { stepSounds, usePlayRun, type WidgetPhase } from "./usePlayRun";
import { activeRef, currentStep, poseOf, starsLeft, useRun, type RunState } from "./useRun";
import "./codeWidgets.css";

const S = CODE.exercise;

interface Fix {
  program: CodeBlock[];
  /** Keys of changed arrows, oldest first. */
  order: string[];
  picked: string | null;
  shuffle: { key: string; n: number } | null;
}

/** Turn arrow `key` to `dir`, keeping at most `edits` changes (the oldest snaps back). */
function turnArrow(fix: Fix, original: CodeBlock[], key: string, dir: Dir, edits: number): Fix {
  let program = withArrow(fix.program, key, dir);
  let order = fix.order.filter((k) => k !== key);
  if (arrowAt(original, key) !== dir) order = [...order, key];
  let shuffle = fix.shuffle;
  while (order.length > Math.max(1, edits)) {
    const oldest = order[0];
    program = withArrow(program, oldest, arrowAt(original, oldest) ?? dir);
    order = order.slice(1);
    shuffle = { key: oldest, n: (shuffle?.n ?? 0) + 1 };
  }
  return { program, order, picked: null, shuffle };
}

function helpText(phase: WidgetPhase, run: RunState, picked: boolean, watching: boolean): string {
  if (phase === "running") return S.running;
  if (phase === "done") {
    const last = currentStep(run);
    if (last?.won) return S.won;
    return last?.to === null ? S.bumped : S.short;
  }
  if (watching) return S.watching;
  return picked ? S.help.debugPick : S.help.debug;
}

export function DebugExercise({ payload, disabled, onSubmit }: WidgetProps<DebugPayload>) {
  const { grid } = payload;
  const [fix, setFix] = useState<Fix>({ program: payload.program, order: [], picked: null, shuffle: null });
  const { runner, phase, start } = usePlayRun(grid, onSubmit);
  const ghost = useRun();
  const locked = disabled || phase !== "build";
  const watching = ghost.run.status === "running";
  // the ghost lights its blocks only while it walks; it then rests where the bug left it
  let live: RunState | null = runner.run;
  if (phase === "build") live = watching ? ghost.run : null;
  const marks: Record<string, ArrowMark> = {};
  for (const key of changedKeys(payload.program, fix.program)) marks[key] = "edit";
  const won = phase === "done" && Boolean(currentStep(runner.run)?.won);

  const tapArrow = (key: string) => {
    if (locked) return;
    codeSound.pop();
    setFix({ ...fix, picked: fix.picked === key ? null : key });
  };
  const pick = (dir: Dir) => {
    if (locked || fix.picked === null) return;
    const next = turnArrow(fix, payload.program, fix.picked, dir, payload.edits);
    if (next.shuffle !== fix.shuffle) codeSound.nudge();
    else codeSound.add();
    setFix(next);
  };
  const watch = () => {
    if (locked) return;
    codeSound.pop();
    setFix({ ...fix, picked: null });
    ghost.play(grid, payload.program, { lead: 150, onStep: stepSounds(true) });
  };
  const go = () => {
    if (locked) return;
    ghost.stop();
    setFix({ ...fix, picked: null });
    start(fix.program, debugVerdict(payload, fix.program));
  };

  const ghostPose = phase === "build" && ghost.run.status !== "idle" ? poseOf(ghost.run, grid.start) : null;
  return (
    <div className={`cw cw-debug is-${phase}`} data-testid="code-debug-widget" data-phase={phase}>
      <HelpBar text={helpText(phase, runner.run, fix.picked !== null, watching)} stars={grid.stars.length} got={grid.stars.length - starsLeft(grid, runner.run).length} />
      <CodeGridView
        grid={grid} pogo={poseOf(runner.run, grid.start)} stars={starsLeft(grid, runner.run)} won={won}
        ghost={ghostPose && { ...ghostPose, mood: "idle" }}
      />
      <ProgramTrack
        program={fix.program} mode="edit" active={live && activeRef(live)} marks={marks} picked={fix.picked}
        shuffle={fix.shuffle} disabled={locked} onArrow={tapArrow} onTrack={() => !locked && setFix({ ...fix, picked: null })}
      />
      {fix.picked !== null && !locked ? (
        <DirPicker value={arrowAt(fix.program, fix.picked)} onPick={pick} disabled={locked} />
      ) : (
        <div className="cw-actions">
          <button type="button" className="tbtn tbtn-ghost cw-watch" data-testid="code-watch" disabled={locked || watching} onClick={watch}>
            <span className="cw-eye" aria-hidden="true" />
            {S.watch}
          </button>
          <RunButton onRun={go} disabled={locked} />
        </div>
      )}
    </div>
  );
}
