/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Public VAPID key for push reminders. Unset = push is off (docs/NOTIFICATIONS.md). */
  readonly VITE_PUSH_PUBLIC_KEY?: string;
}
