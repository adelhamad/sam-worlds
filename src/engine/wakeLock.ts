// Keep the screen awake while the game is open. Wake locks auto-release
// when the app goes to the background, so we re-acquire on return.
let sentinel: WakeLockSentinel | null = null;

async function acquire(): Promise<void> {
  try {
    sentinel = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    // unsupported browser or power-save mode — nothing else we can do
    sentinel = null;
  }
}

export function keepScreenAwake(): void {
  void acquire();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && (!sentinel || sentinel.released)) void acquire();
  });
}
