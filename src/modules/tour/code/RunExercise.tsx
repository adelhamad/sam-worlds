// code-run — build a program from arrow (and loop) blocks, then RUN: Pogo
// follows it for real. Self-submitting: after the run lands, the widget
// reports codeVerdict(payload, program) — win or not; the engine judges.
import { flatten, codeVerdict, runProgram } from "../../../engine/code/judge";
import type { Dir, RunPayload } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import type { WidgetProps } from "../exercises/shared";
import { HelpBar, RunButton } from "./CodeBits";
import { CodeGridView } from "./CodeGridView";
import { BlockPalette } from "./BlockPalette";
import { hasSteps } from "./codeRun";
import { codeSound } from "./codeSound";
import { ProgramTrack } from "./ProgramTrack";
import { addArrow, addLoop, removeArrow, removeBlock, useProgram, type Build, type BuildResult } from "./useProgram";
import { usePlayRun, type WidgetPhase } from "./usePlayRun";
import { activeRef, currentStep, poseOf, starsLeft, type RunState } from "./useRun";
import "./codeWidgets.css";

const S = CODE.exercise;

function helpText(payload: RunPayload, phase: WidgetPhase, run: RunState): string {
  if (phase === "running") return S.running;
  if (phase === "done") {
    const last = currentStep(run);
    if (last?.won) return S.won;
    return last?.to === null ? S.bumped : S.short;
  }
  if (payload.task === "stars") return S.help.stars;
  return payload.loops.length > 0 ? S.help.loop : S.help.run;
}

/** The live preview: where the program would take Pogo (stopping at a bump). */
function previewOf(payload: RunPayload, build: Build, on: boolean) {
  if (!on || build.program.length === 0) return null;
  const run = runProgram(payload.grid, build.program);
  const dirs = flatten(build.program);
  const bumpDir: Dir | undefined = run.bumped ? dirs[run.path.length - 1] : undefined;
  return { path: run.path, end: run.end, bumpAt: bumpDir ? { sq: run.end, dir: bumpDir } : null };
}

export function RunExercise({ payload, disabled, onSubmit }: WidgetProps<RunPayload>) {
  const { grid } = payload;
  const { build, setBuild } = useProgram();
  const { runner, phase, start } = usePlayRun(grid, onSubmit);
  const { run } = runner;
  const locked = disabled || phase !== "build";
  const preview = previewOf(payload, build, payload.preview && phase === "build");
  const pose = poseOf(run, grid.start);
  const left = starsLeft(grid, run);
  const won = phase === "done" && Boolean(currentStep(run)?.won);

  const edit = (change: (now: Build) => [Build, BuildResult]) => {
    if (locked) return;
    const [next, result] = change(build);
    if (result === "full") codeSound.nudge();
    else codeSound.add();
    setBuild(next);
  };
  const tapArrow = (key: string) => {
    if (locked) return;
    codeSound.pop();
    setBuild(removeArrow(build, key));
  };
  const tapLoop = (i: number) => {
    if (locked) return;
    codeSound.pop();
    setBuild({ ...build, open: build.open === i ? null : i });
  };
  const dropLoop = (i: number) => {
    if (locked) return;
    codeSound.pop();
    setBuild(removeBlock(build, i));
  };
  const closeLoop = () => {
    if (!locked && build.open !== null) setBuild({ ...build, open: null });
  };
  const go = () => {
    if (locked || !hasSteps(build.program)) return;
    setBuild({ ...build, open: null });
    start(build.program, codeVerdict(payload, build.program));
  };

  return (
    <div className={`cw cw-run is-${phase} ${payload.loops.length > 0 ? "has-loops" : ""}`} data-testid="code-run-widget" data-phase={phase}>
      <HelpBar text={helpText(payload, phase, run)} stars={grid.stars.length} got={grid.stars.length - left.length} />
      <CodeGridView
        grid={grid} pogo={pose} stars={left} won={won}
        path={preview?.path} bumpAt={preview?.bumpAt}
        ghost={preview && preview.path.length > 1 ? { at: preview.end, dir: null, hop: 0, bonk: false, mood: "idle" } : null}
      />
      <ProgramTrack
        program={build.program} mode="build" max={payload.maxBlocks} open={build.open} active={activeRef(run)}
        wobble={build.wobble} disabled={locked} onArrow={tapArrow} onLoop={tapLoop} onRemoveLoop={dropLoop}
        onCloseLoop={closeLoop} onTrack={closeLoop}
      />
      <BlockPalette
        loops={payload.loops} into={build.open !== null} disabled={locked}
        onArrow={(dir) => edit((now) => addArrow(now, dir, payload.maxBlocks))}
        onLoop={(times) => edit((now) => addLoop(now, times, payload.maxBlocks))}
      />
      <RunButton onRun={go} disabled={locked || !hasSteps(build.program)} />
    </div>
  );
}
