// The opening demo's brain: replays the intro's program on a loop (a bug demo
// first bonks, then the bad arrow turns and it works), and — for "sequence" —
// lets the child take over and steer Pogo with arrow taps (a toy).
import { useEffect, useState } from "react";
import { stepFrom } from "../../../engine/code/judge";
import type { CodeBlock, Dir } from "../../../engine/code/types";
import type { CodeIntro } from "../../../content/code/intros";
import { withArrow } from "./codeRun";
import { codeSound } from "./codeSound";
import { poseOf, useLoopRun, useRun, type PogoPose, type RunState } from "./useRun";

/** The bug story on a loop: buggy run → the arrow turns → the fixed run. */
function useBugStory(intro: CodeIntro, on: boolean): { run: RunState; turned: boolean } {
  const { run, play, stop } = useRun();
  const [turned, setTurned] = useState(false);
  useEffect(() => {
    if (!on || !intro.bug) return undefined;
    const { key, dir } = intro.bug;
    const ids: number[] = [];
    let alive = true;
    const later = (fn: () => void, ms: number) => {
      ids.push(window.setTimeout(() => alive && fn(), ms));
    };
    const cycle = () => {
      setTurned(false);
      play(intro.grid, withArrow(intro.program, key, dir), {
        lead: 700,
        onEnd: () => later(() => {
          setTurned(true);
          later(() => play(intro.grid, intro.program, { lead: 200, onEnd: () => later(cycle, 1700) }), 1000);
        }, 1100),
      });
    };
    cycle();
    return () => {
      alive = false;
      ids.forEach((id) => window.clearTimeout(id));
      stop();
    };
  }, [intro, on, play, stop]);
  return { run, turned };
}

interface Toy {
  pose: PogoPose;
  /** The arrows tapped so far (the child's own little program). */
  program: Dir[];
  won: boolean;
}

const TOY_MAX = 6;

export interface MeetDemo {
  run: RunState;
  /** The program shown on the track right now. */
  program: CodeBlock[];
  pogo: PogoPose;
  ghost: PogoPose | null;
  pin: number | null;
  won: boolean;
  /** bug: the arrow has been turned (a "fixed" mark + shuffle). */
  turned: boolean;
  /** The child is steering (sequence toy). */
  toying: boolean;
  tap: (dir: Dir) => void;
}

export function useMeetDemo(intro: CodeIntro): MeetDemo {
  const [toy, setToy] = useState<Toy | null>(null);
  const loop = useLoopRun(intro.grid, intro.program, { on: toy === null && intro.show !== "bug", lead: 700, pause: 1600 });
  const bug = useBugStory(intro, intro.show === "bug");
  const run = intro.show === "bug" ? bug.run : loop;
  const { grid } = intro;

  const tap = (dir: Dir) => {
    if (!intro.toy) return;
    const now: Toy = toy ?? { pose: { at: grid.start, dir: null, hop: 0, bonk: false, mood: "idle" }, program: [], won: false };
    const from = now.won ? grid.start : now.pose.at;
    const kept = now.won || now.program.length >= TOY_MAX ? [] : now.program;
    const next = stepFrom(grid, from, dir);
    const hop = now.pose.hop + 1;
    const won = next === grid.goal;
    if (next === null) codeSound.bonk();
    else codeSound.step(kept.length);
    if (won) codeSound.win();
    setToy({
      pose: { at: next ?? from, dir, hop, bonk: next === null, mood: won ? "happy" : "idle" },
      program: [...kept, dir],
      won,
    });
  };

  if (toy) {
    return { run, program: toy.program, pogo: toy.pose, ghost: null, pin: null, won: toy.won, turned: false, toying: true, tap };
  }
  const pose = poseOf(run, grid.start);
  const finished = run.status === "done";
  const program = intro.bug && !bug.turned ? withArrow(intro.program, intro.bug.key, intro.bug.dir) : intro.program;
  if (intro.show === "ghost") {
    return {
      run, program, pogo: { at: grid.start, dir: null, hop: 0, bonk: false, mood: "idle" },
      ghost: run.k > 0 ? { ...pose, mood: "idle" } : null, pin: finished ? pose.at : null,
      won: false, turned: false, toying: false, tap,
    };
  }
  const won = finished && pose.mood === "happy";
  return { run, program, pogo: pose, ghost: null, pin: null, won, turned: bug.turned, toying: false, tap };
}
