// Push reminders — request handling with its dependencies passed in (the
// store, the sender, the clock), so the audit can run it with fakes. The two
// files next to api/ wire the real ones.
import { messageFor, shouldSend, validDay, validSubscription, type PushMessage, type PushRecord } from "./pushLogic";

export interface PushStore {
  all(): Promise<Record<string, PushRecord>>;
  get(id: string): Promise<PushRecord | null>;
  set(id: string, record: PushRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Sends one push. Resolves "gone" when the push service says the subscription is dead. */
export type PushSender = (record: PushRecord, message: PushMessage) => Promise<"sent" | "gone" | "error">;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** A stable id for a subscription: a hash of its endpoint (the endpoint itself is never used as a key). */
export async function subscriptionId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface PushBody {
  action?: unknown;
  subscription?: unknown;
  endpoint?: unknown;
  tz?: unknown;
  day?: unknown;
}

async function readBody(request: Request): Promise<PushBody | null> {
  try {
    const text = await request.text();
    return text.length > 4096 ? null : (JSON.parse(text) as PushBody);
  } catch {
    return null;
  }
}

/** POST /api/push — { action: "subscribe" | "unsubscribe" | "played", … } from the app. */
export async function handlePush(request: Request, store: PushStore | null): Promise<Response> {
  if (!store) return json(503, { ok: false, reason: "push is not set up" });
  const body = await readBody(request);
  if (!body) return json(400, { ok: false });

  if (body.action === "subscribe") {
    if (!validSubscription(body.subscription)) return json(400, { ok: false });
    const tz = typeof body.tz === "string" && body.tz.length < 64 ? body.tz : "UTC";
    const id = await subscriptionId(body.subscription.endpoint);
    const before = await store.get(id);
    await store.set(id, { subscription: body.subscription, tz, playedDay: before?.playedDay });
    return json(200, { ok: true });
  }

  if (typeof body.endpoint !== "string" || body.endpoint.length > 1024) return json(400, { ok: false });
  const id = await subscriptionId(body.endpoint);
  if (body.action === "unsubscribe") {
    await store.remove(id);
    return json(200, { ok: true });
  }
  if (body.action === "played" && validDay(body.day)) {
    const record = await store.get(id);
    if (record) await store.set(id, { ...record, playedDay: body.day });
    return json(200, { ok: true });
  }
  return json(400, { ok: false });
}

export interface SendDeps {
  store: PushStore | null;
  send: PushSender | null;
  /** The shared secret the scheduler must present ("Bearer <secret>"). */
  cronSecret: string | undefined;
  now: Date;
}

/** GET /api/push-send — called by the daily schedule: one reminder per device that should get one. */
export async function handleSend(request: Request, deps: SendDeps): Promise<Response> {
  if (!deps.store || !deps.send || !deps.cronSecret) return json(503, { ok: false, reason: "push is not set up" });
  if (request.headers.get("authorization") !== `Bearer ${deps.cronSecret}`) return json(401, { ok: false });
  const records = await deps.store.all();
  const message = messageFor(deps.now);
  let sent = 0;
  let removed = 0;
  let skipped = 0;
  for (const [id, record] of Object.entries(records)) {
    if (!shouldSend(record, deps.now)) {
      skipped += 1;
      continue;
    }
    const outcome = await deps.send(record, message);
    if (outcome === "sent") sent += 1;
    if (outcome === "gone") {
      await deps.store.remove(id);
      removed += 1;
    }
  }
  return json(200, { ok: true, sent, skipped, removed });
}
