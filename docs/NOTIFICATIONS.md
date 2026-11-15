# Daily quests, Pogo's lines, reminders and the app badge

What brings Sam back, and what each device can actually do. Everything here runs on the
device — no server, no network calls, no accounts (`CLAUDE.md`) — except push reminders,
which stay off until the owner adds the keys (last section). Tone rules from
`SAMS_GAME_PLAN.md` §1 apply everywhere: no streak punishment, no FOMO timers, no guilt,
deterministic rewards.

## What exists

| Piece | Where | What it does |
|---|---|---|
| Daily quests | `src/engine/quests/daily.ts`, `src/state/quests.ts` | Three goals a day, picked from the date. Every world and course feeds the counters. Prizes are collected at home; the quest chest opens once all three are collected. "Quest days" only grows. |
| Pogo's line at home | `src/engine/quests/motivator.ts` (`pogoLine`), strings in `HOME.pogo` | One warm line based on what is true right now. Order: quest chest ready → quests to collect → a unit chest waiting (names the course) → welcome back after 2+ days away → praise for today (or how close the nearest quest is) → 1–2 lessons to a unit chest → the next lesson by name → hello for a brand-new player → time of day (a calm "sleepy" line at night). 3–4 variants each, rotated by `facts.turn`. |
| Quest row after a lesson | `src/modules/tour/lesson/QuestRow.tsx` | Today's quests as pills on "Lesson complete!". Quests this lesson finished pop with "Quest done! Collect it at home!". |
| Local reminders (see the caveat below) | `src/engine/notify/schedule.ts` (when and what), `reminders.ts` (scheduling) | At most two a day (10:30 and 16:30 device time), never before 08:00 or after 19:30, for the next 4 days that have a slot. If something is waiting, the first one says so (a treasure chest, the next lesson, today's quests); after that they rotate through the cheers in `HOME.cheers`. Once Sam finishes a lesson, the rest of that day stays quiet. Parent opt-in (`remindersOn`, switch under "Encouragement reminders" in the Parent Section). |
| App-icon badge | `src/engine/notify/badge.ts` | A number on the installed app's icon when something good is waiting: a quest prize to collect, the quest chest, or today's daily gift. No badge for "you haven't played". |
| Signals bridge | `src/state/questSignals.ts` (started in `src/main.tsx`) | Keeps the badge in sync, re-arms reminders with fresh context after each finished lesson and whenever the app goes to the background, and remembers which quests were done when a lesson began (for the quest row). |
| Service worker hooks | `public/notify-sw.js` | `notificationclick` focuses or opens the app (and goes to `data.url` when one is set). A `push` handler is ready for later (see below). |
| Audit | `scripts/audit-motivators.ts` (run by `scripts/audit-questions.ts`) | Checks every Pogo line (≤ 9 words) and reminder (title ≤ 5, body ≤ 12 words) for banned words, checks the moods, and checks the schedule (≤ 2 a day, quiet hours, quiet after a lesson). |

## Which platforms get what

**Important (checked 2026-11-15):** the timed local reminders rely on the Notification
Triggers API (`TimestampTrigger` / `showTrigger`). That API **never shipped**. It ran as a
Chrome origin trial, and Chrome no longer pursues it
([developer.chrome.com/docs/web-platform/notification-triggers](https://developer.chrome.com/docs/web-platform/notification-triggers)).
Stable Chrome 157 has no `TimestampTrigger`. So today the reminders schedule **nothing** on
almost every device. Only a Chromium with the experimental-features flag on would schedule
them. The code feature-detects, does nothing, and would start working by itself if a
browser ever shipped the API. The parent switch says so when it cannot turn on.

| Platform | Timed reminders with the app closed | App-icon badge | Push reminders (once the keys are added) |
|---|---|---|---|
| Android, Chrome / Edge / Samsung Internet | Not today (Notification Triggers not shipped) | Yes, once installed | Yes |
| Desktop Chrome / Edge | Not today | Yes, installed app | Yes, while the browser runs |
| iPhone / iPad (home-screen app, iOS/iPadOS 16.4+) | No: the web cannot schedule local notifications | Yes, after notification permission was granted (tap the reminders switch once and allow; the switch itself stays off) | Yes, only for a home-screen app; needs a server |
| Firefox, Safari on macOS | No | No / partial | Yes; needs a server |

So the signal that works today is the **app-icon badge**. It only changes while the app is
running (when it opens, as things change, and when it goes to the background). A closed app
cannot update its own badge on a new day. Only Web Push can reach a closed app on any
platform.

## Push reminders (built, OFF until you add the keys)

Push is the only thing that reaches Sam while the app is closed, on any platform
(including iPhone / iPad, for a home-screen app). It is in the code but does nothing — no
network call, no subscription — until the four setup steps below are done. This is the one
deliberate exception to the "no server code, no env secrets, no runtime network calls"
rules in `CLAUDE.md`, and it only applies once the owner switches it on.

### What it does when on

- When the parent turns "Encouragement reminders" on, the device asks the browser for a
  push subscription and registers it with `/api/push` (`src/engine/notify/push.ts`).
- Once a day (the schedule in `vercel.json`, 12:30 UTC by default) `/api/push-send` sends
  ONE friendly reminder to each registered device — only between 08:00 and 19:30 in the
  device's own time zone, and never on a day Sam already finished a lesson (the app reports
  "played today" after a lesson).
- Tapping the reminder opens the app (`public/notify-sw.js`).
- Turning reminders off unsubscribes the device and deletes it from the store.

What the server keeps per device: the push subscription (an address at Apple / Google /
Mozilla plus two keys), the time zone, and the last day a lesson was finished. No name, no
progress, no account.

### Turn it on (about 10 minutes, once)

1. **Make the keys.** Run `bunx web-push generate-vapid-keys`. You get a public and a
   private key.
2. **Add a small key-value store.** In the Vercel project: Storage → add "Upstash for
   Redis" (the free plan is plenty). It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Add four environment variables** in Vercel (Production):
   - `VITE_PUSH_PUBLIC_KEY` — the public key (it ships in the app; not a secret)
   - `VAPID_PRIVATE_KEY` — the private key (secret)
   - `VAPID_SUBJECT` — `mailto:` plus your email (push services ask for a contact)
   - `CRON_SECRET` — any long random text (Vercel sends it with the daily call)
4. **Redeploy**, then on Sam's device open the Parent Section → "Encouragement reminders"
   → On, and allow notifications. On iPad / iPhone the app must first be added to the home
   screen (Share → Add to Home Screen) and opened from there (iOS / iPadOS 16.4 or later).

To change the time of day, edit the schedule in `vercel.json` (it is in UTC; Vercel's free
plan allows one run a day). To turn push off again, remove `VITE_PUSH_PUBLIC_KEY` and
redeploy: the app stops subscribing and the endpoints answer "not set up".

### Where the code is

| Piece | Where |
|---|---|
| Device side (subscribe, unsubscribe, "played today") | `src/engine/notify/push.ts`, called from `reminders.ts` |
| Endpoints | `api/push.ts` (POST from the app), `api/push-send.ts` (GET, daily schedule) |
| Logic (quiet hours, message of the day, validation) | `api/_lib/pushLogic.ts`, `api/_lib/pushHandlers.ts` |
| Store + sender (Upstash REST, Web Push / VAPID) | `api/_lib/pushEnv.ts` |
| Audit (real handlers, fake store and sender) | `scripts/audit-push.ts` (inside `bun run check`) |

### What is and is not verified

Verified here: the handlers and quiet-hours logic (audit), the store against a stand-in for
the Upstash REST API, and that the sender builds with real VAPID keys. NOT verified: a real
deployment — the Vercel function wiring, the daily schedule, and a push actually arriving
on a phone or tablet. After the first deploy with keys, check it once: switch reminders on,
then open `https://<your app>/api/push-send` with the header
`Authorization: Bearer <CRON_SECRET>` (for example with curl) at a daytime hour and watch a
reminder arrive.
