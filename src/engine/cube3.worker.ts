/// <reference lib="webworker" />
// Runs the Kociemba two-phase solver (cubejs) off the main thread. Its one-time
// table build (~4s) would otherwise freeze the screen, so we warm it up while
// the player is still entering colors. The 4×4 reduction solver also lives
// here: it calls the same Kociemba tables for its final phase.
import Cube from "cubejs";
import { solveBigCube } from "./cubebig";
import type { Face } from "./cube";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ready = false;

function ensure(): void {
  if (!ready) {
    Cube.initSolver();
    ready = true;
  }
}

/** Facelets → solution string, null when the state isn't a real cube. */
function solve3(facelets: string): string | null {
  try {
    return Cube.fromString(facelets).solve();
  } catch {
    return null;
  }
}

type Msg =
  | { type: "warm" }
  | { type: "solve"; facelets: string }
  | { type: "solveBig"; n: number; grids: Record<Face, Face[][]> };

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data as Msg;
  if (msg.type === "warm") {
    ensure();
    ctx.postMessage({ type: "ready" });
    return;
  }
  if (msg.type === "solveBig") {
    ensure();
    const res = solveBigCube(msg.n, msg.grids, solve3);
    ctx.postMessage({ type: "bigSolved", ...res });
    return;
  }
  try {
    ensure();
    const solution = Cube.fromString(msg.facelets).solve();
    ctx.postMessage({ type: "solved", solution });
  } catch (err) {
    ctx.postMessage({ type: "invalid", message: String(err) });
  }
};
