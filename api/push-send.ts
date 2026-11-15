// GET /api/push-send — run once a day by the schedule in vercel.json. Sends one
// friendly reminder to each registered device that has not played today and is
// in its daytime. Off (503) until the push environment variables are set.
import { realSender, realStore } from "./_lib/pushEnv";
import { handleSend } from "./_lib/pushHandlers";

export function GET(request: Request): Promise<Response> {
  return handleSend(request, { store: realStore(), send: realSender(), cronSecret: process.env.CRON_SECRET, now: new Date() });
}
