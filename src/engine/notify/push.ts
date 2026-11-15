// Push reminders, device side. OFF unless the app was built with a public push
// key (`VITE_PUSH_PUBLIC_KEY`) — without it nothing here touches the network.
// With it, and only after the parent switches reminders on, the device asks
// the browser for a push subscription and registers it with /api/push so the
// daily sender can reach the app while it is closed. Setup: docs/NOTIFICATIONS.md.

const PUBLIC_KEY = (import.meta.env.VITE_PUSH_PUBLIC_KEY as string | undefined) ?? "";
const ENDPOINT = "/api/push";

/** The app was built with a push key and this browser can receive pushes. */
export function pushReady(): boolean {
  return PUBLIC_KEY.length > 0 && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

function keyBytes(base64url: string): ArrayBuffer {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

async function post(body: unknown): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return response.ok;
  } catch {
    return false; // offline: the next re-arm tries again
  }
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

/** Subscribe this device (idempotent) and tell the sender. Notification permission must be granted. */
export async function enablePush(): Promise<boolean> {
  if (!pushReady() || Notification.permission !== "granted") return false;
  try {
    const reg = await registration();
    if (!reg) return false;
    const existing = await reg.pushManager.getSubscription();
    const subscription = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return await post({ action: "subscribe", subscription: subscription.toJSON(), tz });
  } catch {
    return false;
  }
}

/** Unsubscribe this device and forget it on the sender. */
export async function disablePush(): Promise<void> {
  if (!pushReady()) return;
  try {
    const reg = await registration();
    const subscription = await reg?.pushManager.getSubscription();
    if (!subscription) return;
    await post({ action: "unsubscribe", endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  } catch {
    // nothing to clean up
  }
}

/** A lesson was finished today: the sender keeps today quiet for this device. */
export async function notePlayedToday(day: string): Promise<void> {
  if (!pushReady()) return;
  try {
    const reg = await registration();
    const subscription = await reg?.pushManager.getSubscription();
    if (subscription) await post({ action: "played", endpoint: subscription.endpoint, day });
  } catch {
    // best effort
  }
}
