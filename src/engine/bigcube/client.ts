// Main-thread client for the 4×4/5×5 reduction worker. Owns the worker, lets
// the UI warm cubejs early, and relays the painted colors for solving.
import type { Face, Move } from "../cube";

export type BigSolve = { ok: true; moves: Move[] } | { ok: false; reason?: string };

export class BigCubeSolver {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("./bigcube.worker.ts", import.meta.url), { type: "module" });
  }

  /** Kick off the heavy cubejs table build now, while the player paints. */
  warmUp(): void {
    this.worker.postMessage({ type: "warm" });
  }

  solve(n: number, grids: Record<Face, Face[][]>, seed: number): Promise<BigSolve> {
    return new Promise((resolve) => {
      const onMsg = (e: MessageEvent) => {
        const msg = e.data as { type: string; moves?: Move[]; reason?: string };
        if (msg.type === "solved") {
          this.worker.removeEventListener("message", onMsg);
          resolve({ ok: true, moves: msg.moves ?? [] });
        } else if (msg.type === "invalid") {
          this.worker.removeEventListener("message", onMsg);
          resolve({ ok: false, reason: msg.reason });
        }
      };
      this.worker.addEventListener("message", onMsg);
      this.worker.postMessage({ type: "solve", n, grids, seed });
    });
  }

  destroy(): void {
    this.worker.terminate();
  }
}
