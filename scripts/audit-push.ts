// Audit of the push reminder logic (api/_lib). Runs the real handlers against
// an in-memory store and a fake sender: no network, no keys. Hooked into
// scripts/audit-questions.ts; run alone with `bun scripts/audit-push.ts`.
import { handlePush, handleSend, subscriptionId, type PushSender, type PushStore } from "../api/_lib/pushHandlers";
import { PUSH_MESSAGES, localClock, messageFor, shouldSend, type PushRecord } from "../api/_lib/pushLogic";

function memoryStore(): PushStore & { data: Map<string, PushRecord> } {
  const data = new Map<string, PushRecord>();
  return {
    data,
    all: async () => Object.fromEntries(data),
    get: async (id) => data.get(id) ?? null,
    set: async (id, record) => void data.set(id, record),
    remove: async (id) => void data.delete(id),
  };
}

const post = (body: unknown) => new Request("https://app.test/api/push", { method: "POST", body: JSON.stringify(body) });
const cron = (secret?: string) =>
  new Request("https://app.test/api/push-send", { headers: secret ? { authorization: `Bearer ${secret}` } : {} });
const sub = (name: string) => ({ endpoint: `https://push.test/${name}`, keys: { p256dh: "p".repeat(80), auth: "a".repeat(20) } });
const WORDS = /\b(wrong|fail\w*|missed|miss you|lose|lost|last chance|hurry|don't forget)\b/i;

async function checkHandlers(failures: string[]): Promise<void> {
  const must = (ok: boolean, what: string) => { if (!ok) failures.push(`push: ${what}`); };
  const store = memoryStore();
  must((await handlePush(post({ action: "subscribe", subscription: sub("a"), tz: "Asia/Dubai" }), null)).status === 503, "unconfigured store must answer 503");
  must((await handlePush(post({ action: "subscribe", subscription: sub("a"), tz: "Asia/Dubai" }), store)).status === 200, "subscribe accepted");
  must((await handlePush(post({ action: "subscribe", subscription: sub("b"), tz: "America/New_York" }), store)).status === 200, "second device accepted");
  must(store.data.size === 2, "two devices stored");
  must((await handlePush(post({ action: "subscribe", subscription: { endpoint: "http://plain.test" } }), store)).status === 400, "bad subscription rejected");
  must((await handlePush(post({ action: "nonsense", endpoint: sub("a").endpoint }), store)).status === 400, "unknown action rejected");
  must((await handlePush(new Request("https://app.test/api/push", { method: "POST", body: "x".repeat(5000) }), store)).status === 400, "oversized body rejected");

  // 12:30 UTC = 16:30 in Dubai (daytime) and 07:30 / 08:30 in New York (quiet in winter, daytime in summer).
  const noon = new Date("2026-01-15T12:30:00Z");
  const sentTo: string[] = [];
  const sender: PushSender = async (record) => {
    sentTo.push(record.subscription.endpoint);
    return "sent";
  };
  const deps = { store, send: sender, cronSecret: "s3cret", now: noon };
  must((await handleSend(cron(), deps)).status === 401, "schedule call without the secret is refused");
  must((await handleSend(cron("nope"), deps)).status === 401, "a bad secret is refused");
  must((await handleSend(cron("s3cret"), { ...deps, store: null })).status === 503, "unconfigured sender answers 503");
  must((await handleSend(cron("s3cret"), deps)).status === 200, "schedule call accepted");
  must(sentTo.length === 1 && sentTo[0] === sub("a").endpoint, `only the daytime device is reached (got ${sentTo.join(", ") || "none"})`);

  // A finished lesson keeps that local day quiet; the next day is open again.
  await handlePush(post({ action: "played", endpoint: sub("a").endpoint, day: "2026-01-15" }), store);
  sentTo.length = 0;
  await handleSend(cron("s3cret"), deps);
  must(sentTo.length === 0, "no reminder on a day a lesson was finished");
  await handleSend(cron("s3cret"), { ...deps, now: new Date("2026-01-16T12:30:00Z") });
  must(sentTo.length === 1, "the next day is open again");
  // Re-subscribing keeps the played day.
  await handlePush(post({ action: "subscribe", subscription: sub("a"), tz: "Asia/Dubai" }), store);
  must(store.data.get(await subscriptionId(sub("a").endpoint))?.playedDay === "2026-01-15", "re-subscribing keeps the played day");

  // A dead subscription is forgotten; unsubscribe removes the device.
  await handleSend(cron("s3cret"), { ...deps, now: new Date("2026-01-17T12:30:00Z"), send: async () => "gone" });
  must(!store.data.has(await subscriptionId(sub("a").endpoint)), "a gone subscription is removed");
  await handlePush(post({ action: "unsubscribe", endpoint: sub("b").endpoint }), store);
  must(store.data.size === 0, "unsubscribe removes the device");
}

function checkLogic(failures: string[]): void {
  const record = (tz: string, playedDay?: string): PushRecord => ({ subscription: sub("x"), tz, playedDay });
  const at = (iso: string) => new Date(iso);
  if (localClock(at("2026-06-01T20:15:00Z"), "Asia/Dubai").day !== "2026-06-02") failures.push("push: local day must follow the time zone");
  if (shouldSend(record("Asia/Dubai"), at("2026-06-01T02:00:00Z"))) failures.push("push: 06:00 local is quiet time");
  if (shouldSend(record("Asia/Dubai"), at("2026-06-01T16:00:00Z"))) failures.push("push: 20:00 local is quiet time");
  if (!shouldSend(record("Asia/Dubai"), at("2026-06-01T12:30:00Z"))) failures.push("push: 16:30 local should send");
  if (!shouldSend(record("Not/AZone"), at("2026-06-01T12:30:00Z"))) failures.push("push: a bad time zone falls back to UTC");
  for (const message of PUSH_MESSAGES) {
    const text = `${message.title} ${message.body}`;
    if (/\p{Extended_Pictographic}/u.test(text)) failures.push(`push: emoji in "${message.title}"`);
    if (WORDS.test(text)) failures.push(`push: unkind wording in "${message.title}"`);
    if (message.title.split(/\s+/).length > 5 || message.body.split(/\s+/).length > 12) failures.push(`push: "${message.title}" is too long`);
  }
  const week = new Set(Array.from({ length: 6 }, (_, i) => messageFor(new Date(Date.UTC(2026, 0, 1 + i))).title));
  if (week.size !== PUSH_MESSAGES.length) failures.push("push: messages should rotate day by day");
}

export async function auditPush(): Promise<string[]> {
  const failures: string[] = [];
  checkLogic(failures);
  await checkHandlers(failures);
  return failures;
}

if (import.meta.main) {
  const failures = await auditPush();
  for (const failure of failures) console.error(failure);
  console.log(failures.length ? `Push audit: ${failures.length} problem(s)` : `Push audit passed: ${PUSH_MESSAGES.length} messages, handlers and quiet hours checked`);
  process.exit(failures.length ? 1 : 0);
}
