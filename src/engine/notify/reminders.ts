// Encouragement reminders — friendly nudges to come back and play. There is no
// server (static build), so these are LOCAL notifications scheduled through the
// service worker with the Notification Triggers API (TimestampTrigger). That API
// fires even when the app is closed, with no network — on Chromium (Android/
// desktop). Where it's unsupported (e.g. iOS Safari) arming is a graceful no-op.
import { persona } from "../../persona.config";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // aim for one cheer every 6 hours
const COUNT = 8; // schedule ~2 days ahead; re-armed every time the app opens
const TAG = "sam-reminder";
// Daytime only — never ping a sleeping child.
const DAY_START = 8;
const DAY_END = 20;

const n = persona.name;

export interface Cheer {
  title: string;
  body: string;
}

// Exciting, name-aware, and tied to what's waiting in the app (Cosmo + worlds).
export const CHEERS: Cheer[] = [
  { title: "🚀 Adventure time!", body: `A whole universe is waiting, ${n}. Come explore!` },
  { title: "🐉 Cosmo misses you!", body: `Your buddy is hungry, ${n} — feed it with a quick puzzle!` },
  { title: "🦕 Dino Dig!", body: `New dinosaurs to discover, ${n}. Let's dig in!` },
  { title: "🌦️ Weather Watch", body: `Sun, rain or snow today, ${n}? Come find out!` },
  { title: "⭐ So close!", body: `One more level to grow Cosmo, ${n}. Let's go!` },
  { title: "🪐 Space Voyage", body: `Blast off and meet the planets, ${n}!` },
  { title: "✨ Treasure is ready", body: `Your daily gift is waiting, ${n}. Come open it!` },
  { title: "🎉 Brain boost?", body: `Cosmo's ready when you are, ${n}!` },
];

export function pickCheer(i: number): Cheer {
  return CHEERS[((i % CHEERS.length) + CHEERS.length) % CHEERS.length];
}

interface TriggerCtor {
  new (timestamp: number): unknown;
}
function triggerCtor(): TriggerCtor | null {
  const w = window as unknown as { TimestampTrigger?: TriggerCtor };
  return w.TimestampTrigger ?? null;
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

/** Closed-app timed delivery needs the Notification Triggers API. */
export function timedRemindersSupported(): boolean {
  return notificationsSupported() && triggerCtor() !== null;
}

export async function requestReminderPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

async function clearScheduled(reg: ServiceWorkerRegistration): Promise<void> {
  const opts = { includeTriggered: true } as unknown as GetNotificationOptions;
  const existing = await reg.getNotifications(opts);
  for (const note of existing) {
    if (note.tag?.startsWith(TAG)) note.close();
  }
}

/** Re-arm the next COUNT daytime cheers, ~6h apart. Returns false (no-op) when
 * permission isn't granted or the platform can't schedule closed-app triggers. */
export async function armReminders(now: number): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const Trigger = triggerCtor();
  if (!Trigger) return false;
  const reg = await navigator.serviceWorker.ready;
  await clearScheduled(reg);
  let scheduled = 0;
  for (let i = 1; i <= COUNT * 4 && scheduled < COUNT; i++) {
    const when = now + i * INTERVAL_MS;
    const hour = new Date(when).getHours();
    if (hour < DAY_START || hour >= DAY_END) continue; // skip night slots
    const cheer = pickCheer(scheduled + Math.floor(now / INTERVAL_MS));
    const options = {
      body: cheer.body,
      tag: `${TAG}-${scheduled}`,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      showTrigger: new Trigger(when),
      data: { url: "." },
    } as unknown as NotificationOptions;
    await reg.showNotification(cheer.title, options);
    scheduled++;
  }
  return scheduled > 0;
}

export async function disarmReminders(): Promise<void> {
  if (!notificationsSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  await clearScheduled(reg);
}

/** Show one cheer right now so the parent can confirm reminders work. */
export async function testCheer(): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready;
  const cheer = pickCheer(0);
  await reg.showNotification(cheer.title, { body: cheer.body, icon: "icons/icon-192.png", tag: `${TAG}-test` });
}
