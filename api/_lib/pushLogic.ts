// Push reminders — the pure part: who gets a reminder now, and what it says.
// No network and no secrets here, so the audit can test it.

/** What the server keeps per device. No name, no progress — only how to reach the app. */
export interface PushRecord {
  /** The browser's push subscription (endpoint + keys), as the device sent it. */
  subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
  /** IANA time zone of the device, e.g. "Asia/Dubai" — used only for quiet hours. */
  tz: string;
  /** Local day (YYYY-MM-DD) on which a lesson was last finished; that day stays quiet. */
  playedDay?: string;
}

export interface PushMessage {
  title: string;
  body: string;
  url: string;
}

/** Friendly, guilt-free, no emoji. One a day at most; rotates by date. */
export const PUSH_MESSAGES: PushMessage[] = [
  { title: "Pogo says hi!", body: "A new lesson is ready whenever you are.", url: "." },
  { title: "Today's quests are in", body: "Three little quests are waiting at home.", url: "." },
  { title: "A gift is waiting", body: "Your daily gift is ready to open.", url: "." },
  { title: "Pogo found something", body: "Come and see what is next on the path.", url: "." },
  { title: "Ready for a puzzle?", body: "A short lesson with Pogo is ready.", url: "." },
  { title: "Tick tock!", body: "Pogo saved your spot. Come and play.", url: "." },
];

/** Reminders are only sent between these local times. */
export const QUIET_BEFORE_MIN = 8 * 60;
export const QUIET_AFTER_MIN = 19 * 60 + 30;

/** The local date and minutes-after-midnight in a time zone (falls back to UTC for a bad zone). */
export function localClock(now: Date, tz: string): { day: string; minutes: number } {
  const read = (zone: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
    return { day: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  };
  try {
    return read(tz);
  } catch {
    return read("UTC");
  }
}

/** Send now? Only in the daytime, and never on a day the child already finished a lesson. */
export function shouldSend(record: PushRecord, now: Date): boolean {
  const { day, minutes } = localClock(now, record.tz);
  if (minutes < QUIET_BEFORE_MIN || minutes > QUIET_AFTER_MIN) return false;
  return record.playedDay !== day;
}

/** The message of the day (the same for every device on a given UTC date). */
export function messageFor(now: Date): PushMessage {
  const dayNumber = Math.floor(now.getTime() / 86_400_000);
  return PUSH_MESSAGES[dayNumber % PUSH_MESSAGES.length];
}

/** A push subscription we are willing to store: an https endpoint with both keys, of sane size. */
export function validSubscription(value: unknown): value is PushRecord["subscription"] {
  const sub = value as PushRecord["subscription"] | null;
  if (!sub || typeof sub.endpoint !== "string" || sub.endpoint.length > 1024) return false;
  if (!sub.endpoint.startsWith("https://")) return false;
  const { p256dh, auth } = sub.keys ?? {};
  return typeof p256dh === "string" && typeof auth === "string" && p256dh.length < 256 && auth.length < 128;
}

export function validDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
