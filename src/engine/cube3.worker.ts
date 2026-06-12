/// <reference lib="webworker" />
// Runs the Kociemba two-phase solver (cubejs) off the main thread. Its one-time
// table build (~4s) would otherwise freeze the screen, so we warm it up while
// the player is still entering colors.
import Cube from "cubejs";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ready = false;

function ensure(): void {
  if (!ready) {
    Cube.initSolver();
    ready = true;
  }
}

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: "warm" } | { type: "solve"; facelets: string };
  if (msg.type === "warm") {
    ensure();
    ctx.postMessage({ type: "ready" });
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
