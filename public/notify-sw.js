// Imported into the generated service worker (see vite.config workbox.importScripts).
// When Sam taps an encouragement reminder, focus the open app or launch it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const win of wins) {
        if ("focus" in win) return win.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(".");
    })(),
  );
});
