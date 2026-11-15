// POST /api/push — the app registers / removes this device for reminders, or
// notes that a lesson was finished today. Off (503) until the push environment
// variables are set: see docs/NOTIFICATIONS.md.
import { realStore } from "./_lib/pushEnv";
import { handlePush } from "./_lib/pushHandlers";

export function POST(request: Request): Promise<Response> {
  return handlePush(request, realStore());
}
