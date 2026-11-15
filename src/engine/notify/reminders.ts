// Encouragement reminders — friendly invitations about Pogo, the courses and
// today's quests. There is no server (static build), so these are LOCAL
// notifications scheduled through the service worker with the Notification
// Triggers API (TimestampTrigger), which fires even when the app is closed.
// CAVEAT (checked 2026-11-15): that API never shipped — it was an origin trial
// and Chrome no longer pursues it; stable Chrome 157 has no TimestampTrigger.
// So today arming is a graceful no-op almost everywhere (only a Chromium with
// the experimental flag schedules them). It lights up by itself if a browser
// ever ships it. When and what:
// `schedule.ts`. Platform notes and the (unbuilt) push design: docs/NOTIFICATIONS.md.
import { todayKey } from "../economy/gifts";
import { disablePush, enablePush, notePlayedToday, pushReady } from "./push";
import { cheerPool, REMINDER_TAG, reminderSchedule, type Cheer, type ReminderContext } from "./schedule";

export type { Cheer, ReminderContext };

const ICON = "icons/icon-192.png";
const READY_TIMEOUT_MS = 10_000;

/** Every cheer that rotates through the slots. */
export const CHEERS: Cheer[] = cheerPool();

export function pickCheer(i: number): Cheer {
  return CHEERS[((i % CHEERS.length) + CHEERS.length) % CHEERS.length];
}

// Callers that do not pass a context (App start, the parent switch) get the
// one the quest signals bridge registers, so every re-arm is context-aware.
let contextSource: (() => ReminderContext | undefined) | null = null;

export function setReminderContextSource(source: (() => ReminderContext | undefined) | null): void {
  contextSource = source;
}

function currentContext(): ReminderContext | undefined {
  try {
    return contextSource?.();
  } catch {
    return undefined;
  }
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

/** Reminders can reach a closed app: by push (when the app was built with a
 * push key) or, where a browser has it, the Notification Triggers API. */
export function timedRemindersSupported(): boolean {
  return notificationsSupported() && (pushReady() || triggerCtor() !== null);
}

export async function requestReminderPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

/** The service worker registration, or null if it never becomes ready (dev, no SW). */
function swReady(): Promise<ServiceWorkerRegistration | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), READY_TIMEOUT_MS));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function clearScheduled(reg: ServiceWorkerRegistration): Promise<void> {
  const opts = { includeTriggered: true } as unknown as GetNotificationOptions;
  const existing = await reg.getNotifications(opts);
  for (const note of existing) {
    if (note.tag?.startsWith(REMINDER_TAG)) note.close();
  }
}

/** Push path: register the device; a day with a finished lesson is reported so it stays quiet. */
async function armPush(context: ReminderContext | undefined): Promise<boolean> {
  const ok = await enablePush();
  if (ok && context?.playedToday) await notePlayedToday(todayKey());
  return ok;
}

async function arm(now: number, context: ReminderContext | undefined): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  if (pushReady()) return armPush(context ?? currentContext());
  const Trigger = triggerCtor();
  if (!Trigger) return false;
  const reg = await swReady();
  if (!reg) return false;
  await clearScheduled(reg);
  const slots = reminderSchedule(now, context ?? currentContext());
  for (const slot of slots) {
    const options = {
      body: slot.cheer.body,
      tag: slot.tag,
      icon: ICON,
      badge: ICON,
      showTrigger: new Trigger(slot.when),
      data: { url: "." },
    } as unknown as NotificationOptions;
    await reg.showNotification(slot.cheer.title, options);
  }
  return slots.length > 0;
}

// Re-arms run one after another so two callers can never interleave
// clear / schedule and leave duplicates behind.
let queue: Promise<unknown> = Promise.resolve();

/** Clear and re-schedule the next days' cheers (≤ 2 a day, daytime only).
 * Returns false (no-op) when permission isn't granted or the platform can't
 * schedule closed-app triggers. Never throws. */
export function armReminders(now: number, context?: ReminderContext): Promise<boolean> {
  const run = queue.then(() => arm(now, context)).catch(() => false);
  queue = run;
  return run;
}

export function disarmReminders(): Promise<void> {
  const run = queue
    .then(async () => {
      if (!notificationsSupported()) return;
      await disablePush();
      const reg = await swReady();
      if (reg) await clearScheduled(reg);
    })
    .catch(() => undefined);
  queue = run;
  return run;
}

/** Show one cheer right now so the parent can confirm reminders work. */
export async function testCheer(): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const reg = await swReady();
  if (!reg) return;
  const cheer = pickCheer(0);
  await reg.showNotification(cheer.title, { body: cheer.body, icon: ICON, tag: `${REMINDER_TAG}-test`, data: { url: "." } });
}
