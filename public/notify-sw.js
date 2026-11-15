// Imported into the generated service worker (see vite.config workbox.importScripts).
// Docs: docs/NOTIFICATIONS.md.

/** Focus an open app window (navigating it to `url` when given) or launch one. */
async function openApp(url) {
  const target = url || ".";
  const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const win of wins) {
    if (!("focus" in win)) continue;
    // Focus first: the permission to focus from a click can lapse during a navigation.
    const focused = await win.focus();
    if (url && "navigate" in win) {
      try {
        await win.navigate(new URL(url, self.registration.scope).href);
      } catch {
        // Cross-origin or not controlled yet — it is focused, that is enough.
      }
    }
    return focused;
  }
  if (self.clients.openWindow) return self.clients.openWindow(target);
  return undefined;
}

// When Sam taps a reminder (local or pushed), focus the open app or launch it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(openApp(typeof data.url === "string" && data.url !== "." ? data.url : null));
});

// Groundwork only: nothing sends pushes today (no server, no subscription).
// If a push sender is ever added, it sends JSON `{ title, body, url? }`.
self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  if (!payload || typeof payload !== "object") payload = {};
  const title = typeof payload.title === "string" && payload.title ? payload.title : "Pogo says hi!";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = typeof payload.url === "string" ? payload.url : ".";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: "sam-push",
      data: { url },
    }),
  );
});
