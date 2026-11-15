// Plays a program step by step: Pogo hops square to square, the block that
// made the step lights up, stars are picked up, a wall gets a soft bonk. Pure
// timing — what happens on each step comes from codeRun.runSteps.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CodeBlock, CodeGrid, Dir } from "../../../engine/code/types";
import { runSteps, stepDelay, type BlockRef, type RunStep } from "./codeRun";

export type RunStatus = "idle" | "running" | "done";

export interface RunState {
  steps: RunStep[];
  /** Steps played so far (0 … steps.length). */
  k: number;
  status: RunStatus;
}

/** Where Pogo stands and how he moves, for CodeGridView. */
export interface PogoPose {
  at: number;
  /** Direction of the last step (lean), or null. */
  dir: Dir | null;
  /** Changes on every hop (replays the arc). */
  hop: number;
  /** The last step was a bump: wobble toward `dir`. */
  bonk: boolean;
  mood: "idle" | "happy" | "think";
}

export interface PlayOpts {
  onStep?: (step: RunStep, k: number) => void;
  onEnd?: (steps: RunStep[]) => void;
  /** Pause before the first step. */
  lead?: number;
}

export interface Runner {
  run: RunState;
  play: (grid: CodeGrid, program: CodeBlock[], opts?: PlayOpts) => void;
  stop: () => void;
}

const IDLE: RunState = { steps: [], k: 0, status: "idle" };

export function useRun(): Runner {
  const [run, setRun] = useState<RunState>(IDLE);
  const timers = useRef<number[]>([]);

  const stop = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setRun(IDLE);
  }, []);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const play = useCallback((grid: CodeGrid, program: CodeBlock[], opts: PlayOpts = {}) => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    const steps = runSteps(grid, program);
    setRun({ steps, k: 0, status: "running" });
    let at = opts.lead ?? 0;
    steps.forEach((step, k) => {
      at += stepDelay(k, steps.length);
      timers.current.push(window.setTimeout(() => {
        opts.onStep?.(step, k);
        setRun({ steps, k: k + 1, status: k + 1 === steps.length ? "done" : "running" });
      }, at));
    });
    // an empty program ends at once (never expected: RUN is off without arrows)
    const end = steps.length === 0 ? 0 : at + 120;
    timers.current.push(window.setTimeout(() => {
      setRun({ steps, k: steps.length, status: "done" });
      opts.onEnd?.(steps);
    }, end));
  }, []);

  return { run, play, stop };
}

export interface LoopOpts {
  /** Rest on the ending before the next replay. */
  pause?: number;
  /** Rest on the start before each replay. */
  lead?: number;
  /** False holds the loop (e.g. the child took over the demo). */
  on?: boolean;
  onStep?: PlayOpts["onStep"];
}

/** Replay a program forever (teach cards, opening demos). */
export function useLoopRun(grid: CodeGrid, program: CodeBlock[], { pause = 1400, lead = 600, on = true, onStep }: LoopOpts = {}): RunState {
  const { run, play, stop } = useRun();
  const latest = useRef({ grid, program, onStep });
  useEffect(() => {
    latest.current = { grid, program, onStep };
  });
  const key = `${JSON.stringify(grid)}|${JSON.stringify(program)}`;
  useEffect(() => {
    if (!on) return undefined;
    let timer = 0;
    let alive = true;
    const loop = () => {
      const now = latest.current;
      play(now.grid, now.program, {
        lead,
        onStep: (step, k) => now.onStep?.(step, k),
        onEnd: () => {
          timer = window.setTimeout(() => {
            if (alive) loop();
          }, pause);
        },
      });
    };
    loop();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      stop();
    };
  }, [key, on, lead, pause, play, stop]);
  return run;
}

/** The step currently lit (the last one played), or null. */
export function currentStep(run: RunState): RunStep | null {
  return run.k > 0 ? run.steps[run.k - 1] : null;
}

/** The block lighting up on the track while a run plays. */
export function activeRef(run: RunState): BlockRef | null {
  return run.status === "idle" ? null : (currentStep(run)?.ref ?? null);
}

/** Stars still on the grid. */
export function starsLeft(grid: CodeGrid, run: RunState): number[] {
  const got = currentStep(run)?.collected ?? [];
  return grid.stars.filter((sq) => !got.includes(sq));
}

/** Pogo's pose for the run so far (`start` before the first step). */
export function poseOf(run: RunState, start: number): PogoPose {
  const step = currentStep(run);
  if (!step) return { at: start, dir: null, hop: 0, bonk: false, mood: "idle" };
  const finished = run.status === "done" && run.k === run.steps.length;
  let mood: PogoPose["mood"] = "idle";
  if (finished) mood = step.won ? "happy" : "think";
  return { at: step.to ?? step.from, dir: step.dir, hop: run.k, bonk: step.to === null, mood };
}
