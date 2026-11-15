// Push reminders — the real store (an Upstash / Vercel KV Redis over its REST
// API) and the real sender (Web Push with VAPID keys). Everything is read from
// environment variables; when they are missing these return null and the
// endpoints answer 503, so the feature is simply off.
import { sendNotification, setVapidDetails, type PushSubscription } from "web-push";
import type { PushSender, PushStore } from "./pushHandlers";
import type { PushRecord } from "./pushLogic";

const KEY = "push:subs";

async function redis(url: string, token: string, command: string[]): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`store answered ${response.status}`);
  return ((await response.json()) as { result?: unknown }).result;
}

function parse(value: unknown): PushRecord | null {
  try {
    return typeof value === "string" ? (JSON.parse(value) as PushRecord) : null;
  } catch {
    return null;
  }
}

export function realStore(): PushStore | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return {
    async all() {
      const flat = (await redis(url, token, ["HGETALL", KEY])) as string[] | null;
      const out: Record<string, PushRecord> = {};
      for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) {
        const record = parse(flat?.[i + 1]);
        if (flat && record) out[flat[i]] = record;
      }
      return out;
    },
    async get(id) {
      return parse(await redis(url, token, ["HGET", KEY, id]));
    },
    async set(id, record) {
      await redis(url, token, ["HSET", KEY, id, JSON.stringify(record)]);
    },
    async remove(id) {
      await redis(url, token, ["HDEL", KEY, id]);
    },
  };
}

export function realSender(): PushSender | null {
  const publicKey = process.env.VITE_PUSH_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  setVapidDetails(subject, publicKey, privateKey);
  return async (record, message) => {
    try {
      await sendNotification(record.subscription as PushSubscription, JSON.stringify(message), { TTL: 6 * 60 * 60 });
      return "sent";
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      return status === 404 || status === 410 ? "gone" : "error";
    }
  };
}
