// Main-thread client for the 3×3 Kociemba worker. Owns the worker, lets the UI
// warm it up early, and turns a facelet string into our quarter-turn moves.
import { parseSolution } from "./cubesolve";
import type { Move } from "./cube";

export type SolveResult = { ok: true; moves: Move[] } | { ok: false };

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

  destroy(): void {
    this.worker.terminate();
  }
}
