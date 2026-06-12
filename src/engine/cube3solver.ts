// Main-thread client for the cube solver worker (3×3 Kociemba + the 4×4
// reduction solver built on top of it). Owns the worker, lets the UI warm it
// up early, and turns a facelet string into our quarter-turn moves.
import { parseSolution } from "./cubesolve";
import type { Face, Move } from "./cube";

export type SolveResult = { ok: true; moves: Move[] } | { ok: false; reason?: string };

export class Cube3Solver {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("./cube3.worker.ts", import.meta.url), { type: "module" });
  }

  /** Kick off the heavy table build now, while the player keeps painting. */
  warmUp(): void {
    this.worker.postMessage({ type: "warm" });
  }

  solve(facelets: string): Promise<SolveResult> {
    return new Promise((resolve) => {
      const onMsg = (e: MessageEvent) => {
        const msg = e.data as { type: string; solution?: string };
        if (msg.type === "solved") {
          this.worker.removeEventListener("message", onMsg);
          resolve({ ok: true, moves: parseSolution(msg.solution ?? "") });
        } else if (msg.type === "invalid") {
          this.worker.removeEventListener("message", onMsg);
          resolve({ ok: false });
        }
      };
      this.worker.addEventListener("message", onMsg);
      this.worker.postMessage({ type: "solve", facelets });
    });
  }

  /** Solve a painted 4×4 by reduction (runs fully inside the worker). */
  solveBig(n: number, grids: Record<Face, Face[][]>): Promise<SolveResult> {
    return new Promise((resolve) => {
      const onMsg = (e: MessageEvent) => {
        const msg = e.data as { type: string; ok?: boolean; moves?: Move[]; reason?: string };
        if (msg.type !== "bigSolved") return;
        this.worker.removeEventListener("message", onMsg);
        if (msg.ok && msg.moves) resolve({ ok: true, moves: msg.moves });
        else resolve({ ok: false, reason: msg.reason });
      };
      this.worker.addEventListener("message", onMsg);
      this.worker.postMessage({ type: "solveBig", n, grids });
    });
  }

  destroy(): void {
    this.worker.terminate();
  }
}
