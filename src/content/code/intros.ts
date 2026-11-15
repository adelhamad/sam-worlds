// Code Lab opening demos — DATA. Each lesson that introduces an idea opens
// with one of these (CodeParams.intro): Pogo says the title, a small grid and
// program play on a loop, two short lines teach the idea. Strings live in
// strings/code.ts (CODE.meet.intros). Grids are 4×4: square = row * 4 + col.
import type { CodeBlock, CodeGrid, CodeIntroKey, Dir } from "../../engine/code/types";
import { CODE } from "../../strings/code";

export interface CodeIntro {
  title: string;
  /** Two lines, ≤ 8 words each. */
  lines: string[];
  grid: CodeGrid;
  /** The program the demo plays (for "bug": the FIXED program). */
  program: CodeBlock[];
  /** How the demo plays: walk it, a ghost reads it, or a bug gets fixed. */
  show: "walk" | "ghost" | "bug";
  /** bug: the arrow that starts off pointing the other way (key "i" / "i-j"). */
  bug?: { key: string; dir: Dir };
  /** sequence: the child may tap arrows to move Pogo (a toy) before starting. */
  toy?: boolean;
}

const M = CODE.meet.intros;

export const CODE_INTROS: Record<CodeIntroKey, CodeIntro> = {
  sequence: {
    ...M.sequence,
    grid: { size: 4, start: 13, goal: 6, walls: [10, 3], stars: [] },
    program: ["N", "N", "E"],
    show: "walk",
    toy: true,
  },
  stars: {
    ...M.stars,
    grid: { size: 4, start: 12, goal: 6, walls: [9, 3], stars: [14] },
    program: ["E", "E", "N", "N"],
    show: "walk",
  },
  trace: {
    ...M.trace,
    grid: { size: 4, start: 12, goal: -1, walls: [5, 15], stars: [] },
    program: ["N", "E", "E", "N"],
    show: "ghost",
  },
  bug: {
    ...M.bug,
    grid: { size: 4, start: 12, goal: 6, walls: [9, 2], stars: [] },
    program: ["N", "N", "E", "E"],
    show: "bug",
    bug: { key: "1", dir: "E" },
  },
  loop: {
    ...M.loop,
    grid: { size: 4, start: 12, goal: 3, walls: [8, 14], stars: [] },
    program: [{ times: 3, body: ["E", "N"] }],
    show: "walk",
  },
};
