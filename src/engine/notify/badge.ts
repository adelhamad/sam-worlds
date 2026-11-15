// App-icon badge (Badging API): a small number on the installed app's icon when
// something good is waiting — a finished quest to collect, the quest chest, or
// today's unopened daily gift. Never a badge just for "you haven't played".
// Works for installed PWAs on Android / desktop Chromium and iOS / iPadOS 16.4+
// (home-screen apps, once notification permission was granted). Feature-detected;
// never throws.

export interface BadgeFacts {
  questsToCollect: number;
  questChestReady: boolean;
  giftReady: boolean;
}

/** How many good things are waiting (0 = no badge). */
export function badgeCount(facts: BadgeFacts): number {
  return Math.max(0, facts.questsToCollect) + (facts.questChestReady ? 1 : 0) + (facts.giftReady ? 1 : 0);
}

interface BadgeNavigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

export function badgeSupported(): boolean {
  return typeof navigator !== "undefined" && typeof (navigator as BadgeNavigator).setAppBadge === "function";
}

let shown: number | null = null;

/** Show `count` on the app icon (0 clears it). Skips repeat calls with the same count. */
export function setBadge(count: number): void {
  if (!badgeSupported() || count === shown) return;
  const nav = navigator as BadgeNavigator;
  shown = count;
  try {
    const done = count > 0 ? nav.setAppBadge?.(count) : (nav.clearAppBadge?.() ?? nav.setAppBadge?.(0));
    void done?.catch(() => {
      shown = null;
    });
  } catch {
    shown = null;
  }
}
