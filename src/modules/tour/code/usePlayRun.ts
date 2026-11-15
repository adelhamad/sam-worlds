// RUN for the self-submitting widgets: lock input, play the program for real
// (with sounds), let the ending land, then submit the verdict — exactly once,
// win or not. The verdict is the engine's serialisation, computed at RUN time.
import { useEffect, useRef, useState } from "react";
import type { CodeBlock, CodeGrid } from "../../../engine/code/types";
import { useTimers } from "../exercises/shared";
import type { RunStep } from "./codeRun";
import { codeSound } from "./codeSound";
import { useRun, type PlayOpts, type Runner } from "./useRun";

export type WidgetPhase = "build" | "running" | "done";

/** The ending needs a moment to read before the shell's sheet slides up. */
const END_BEAT_MS = 700;

/** Sounds for one step of a run. */
export function stepSounds(quiet = false): NonNullable<PlayOpts["onStep"]> {
  let held = 0;
  return (step: RunStep, k: number) => {
    if (step.to === null) {
      codeSound.bonk();
      return;
    }
    if (!quiet) codeSound.step(k);
    if (step.collected.length > held) codeSound.star(step.collected.length);
    held = step.collected.length;
    if (step.won) codeSound.win();
  };
}

export interface PlayRun {
  runner: Runner;
  phase: WidgetPhase;
  start: (program: CodeBlock[], verdict: string) => void;
}

export function usePlayRun(grid: CodeGrid, onSubmit: (value: string) => void): PlayRun {
  const runner = useRun();
  const later = useTimers();
  const [phase, setPhase] = useState<WidgetPhase>("build");
  const sent = useRef(false);
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });

  const start = (program: CodeBlock[], verdict: string) => {
    if (phase !== "build" || sent.current) return;
    codeSound.run();
    setPhase("running");
    runner.play(grid, program, {
      lead: 220,
      onStep: stepSounds(),
      onEnd: () => {
        setPhase("done");
        later(() => {
          if (sent.current) return;
          sent.current = true;
          submit.current(verdict);
        }, END_BEAT_MS);
      },
    });
  };

  return { runner, phase, start };
}
