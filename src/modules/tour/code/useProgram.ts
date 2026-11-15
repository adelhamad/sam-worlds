// The program the child is building (RunExercise): append arrows and loops,
// put arrows into the open loop, take blocks out. Pure editing — the run and
// the verdict live elsewhere.
import { useState } from "react";
import type { CodeBlock, Dir } from "../../../engine/code/types";
import { isLoop, LOOP_SLOTS } from "./codeRun";

export interface Build {
  program: CodeBlock[];
  /** The loop arrows go into (index into program), or null. */
  open: number | null;
  /** Bumps when a tap had no room (the counter wobbles). */
  wobble: number;
}

export type BuildResult = "added" | "full";

/** Append an arrow: into the open loop when there is one, else at the end. */
export function addArrow(build: Build, dir: Dir, max: number): [Build, BuildResult] {
  const { program, open } = build;
  const loop = open === null ? null : program[open];
  if (loop && isLoop(loop) && loop.body.length < LOOP_SLOTS) {
    const body = [...loop.body, dir];
    const next = program.map((block, i) => (i === open ? { ...loop, body } : block));
    // a full loop closes by itself: the next arrow goes after it
    return [{ ...build, program: next, open: body.length >= LOOP_SLOTS ? null : open }, "added"];
  }
  if (program.length >= max) return [{ ...build, open: null, wobble: build.wobble + 1 }, "full"];
  return [{ ...build, program: [...program, dir], open: null }, "added"];
}

export function addLoop(build: Build, times: number, max: number): [Build, BuildResult] {
  if (build.program.length >= max) return [{ ...build, wobble: build.wobble + 1 }, "full"];
  const program = [...build.program, { times, body: [] }];
  return [{ ...build, program, open: program.length - 1 }, "added"];
}

/** Take out the arrow with key "i" (top level) or "i-j" (inside loop i). */
export function removeArrow(build: Build, key: string): Build {
  const [i, j] = key.split("-").map(Number);
  const block = build.program[i];
  if (block === undefined) return build;
  if (j !== undefined && isLoop(block)) {
    const program = build.program.map((b, at) => (at === i ? { ...block, body: block.body.filter((_, k) => k !== j) } : b));
    return { ...build, program };
  }
  return removeBlock(build, i);
}

export function removeBlock(build: Build, i: number): Build {
  const program = build.program.filter((_, at) => at !== i);
  let open = build.open;
  if (open === i) open = null;
  else if (open !== null && open > i) open -= 1;
  return { ...build, program, open };
}

export function useProgram() {
  const [build, setBuild] = useState<Build>({ program: [], open: null, wobble: 0 });
  return { build, setBuild };
}
