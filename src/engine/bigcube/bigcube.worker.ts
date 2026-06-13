/// <reference lib="webworker" />
// Runs the 4×4/5×5 reduction solver off the main thread. The reduction itself
// is fast, but it calls the 3×3 Kociemba solver (cubejs) to finish, whose
// one-time table build (~4s) would otherwise freeze the screen — so we warm it
// up while the player is still entering colors.
import Cube3 from "cubejs";
import { solveBigCube, type BigSolveResult } from "./index";
import { moveKey } from "./tables";
import type { Face } from "../cube";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ready = false;

function ensure(): void {
  if (!ready) {
    Cube3.initSolver();
    ready = true;
  }
}

const solve3 = (facelets: string): string | null => {
  try {
    return Cube3.fromString(facelets).solve() as string;
  } catch {
    return null;
  }
};

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: "warm" } | { type: "solve"; n: number; grids: Record<Face, Face[][]>; seed: number };
  if (msg.type === "warm") {
    ensure();
    ctx.postMessage({ type: "ready" });
    return;
  }
  ensure();
  const res: BigSolveResult = solveBigCube(msg.n, msg.grids, msg.seed, solve3);
  if (res.ok) {
    // Moves carry optional depth/slice flags — send a serialisable form.
    ctx.postMessage({ type: "solved", moves: res.moves, keys: res.moves.map(moveKey) });
  } else {
    ctx.postMessage({ type: "invalid", reason: res.reason });
  }
};
