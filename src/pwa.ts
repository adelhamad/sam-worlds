// Seamless auto-update. While the app is open we quietly poll for a new
// deployment (and check again whenever the tab regains focus). When a new
// version is ready we swap to it WITHOUT the player noticing: we reload only
// while the tab is hidden — switched away, screen locked, app backgrounded —
// so the fresh version is simply there the next time they look. No parent
// "clear cache" step, and never a reload in the middle of a puzzle.
import { registerSW } from "virtual:pwa-register";

const CHECK_EVERY_MS = 60_000;
let pending = false;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    pending = true;
    applyIfHidden(); // already backgrounded → apply right now
  },
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return;
    // Poll for a new deploy periodically and whenever the app comes back.
    setInterval(() => void reg.update(), CHECK_EVERY_MS);
  },
});

function applyIfHidden(): void {
  if (pending && document.visibilityState === "hidden") {
    pending = false;
    void updateSW(true); // skipWaiting + reload; invisible because tab is hidden
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    void navigator.serviceWorker?.getRegistration().then((reg) => reg?.update());
  } else {
    applyIfHidden();
  }
});
