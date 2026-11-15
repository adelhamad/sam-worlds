# Daily quests, Pogo's lines, reminders and the app badge

What brings Sam back, and what each device can actually do. Everything here runs on the
device: no server, no network calls, no accounts (`CLAUDE.md`). Tone rules from
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

| Platform | Timed reminders with the app closed | App-icon badge | Web Push (if a server ever sends it) |
|---|---|---|---|
| Android, Chrome / Edge / Samsung Internet | Not today (Notification Triggers not shipped) | Yes, once installed | Yes |
| Desktop Chrome / Edge | Not today | Yes, installed app | Yes, while the browser runs |
| iPhone / iPad (home-screen app, iOS/iPadOS 16.4+) | No: the web cannot schedule local notifications | Yes, after notification permission was granted (tap the reminders switch once and allow; the switch itself stays off) | Yes, only for a home-screen app; needs a server |
| Firefox, Safari on macOS | No | No / partial | Yes; needs a server |

So the signal that works today is the **app-icon badge**. It only changes while the app is
running (when it opens, as things change, and when it goes to the background). A closed app
cannot update its own badge on a new day. Only Web Push can reach a closed app on any
platform.

## Real push notifications (designed, deliberately NOT built)

Push is the only way that works today to reach Sam while the app is closed, on any platform
(including iPhone / iPad). It needs things the project rules forbid right now: **server
code, a secret key, and network calls while the app runs** (`CLAUDE.md`: "no server code, no
env secrets", "no runtime network calls"). So it was **not built**. Adding it is the owner's
call.

If the owner wants it, the smallest honest design is:

1. **VAPID keys.** Generate a key pair once (`bunx web-push generate-vapid-keys`). The public
   key ships in the app. The private key is a secret on the server only (for example a Vercel
   environment variable).
2. **Subscribe on the device.** Behind the existing parent opt-in, call
   `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and
   POST the subscription (endpoint + keys) to the server. This is the first runtime network call.
3. **Store subscriptions.** A small key-value store (Vercel KV / Upstash, or one JSON row per
   device) keyed by endpoint. Delete it when the parent turns reminders off or when sending
   returns 404 / 410.
4. **A scheduled sender.** One serverless function on a daily cron (Vercel Cron, for example
   `30 14 * * *` in UTC, so mind the family's time zone) that sends each stored subscription a
   payload with the `web-push` library. Keep the cadence the same as the local reminders:
   at most two a day, nothing before 08:00 or after 19:30, no guilt.
5. **Payload.** JSON `{ "title": "...", "body": "...", "url": "#/" }`. The server cannot see the
   save (it lives in IndexedDB on the device), so the text is generic. Reuse the lines in
   `HOME.cheers` and run them through `scripts/audit-motivators.ts`.
6. **Client handler.** Already done: the `push` listener in `public/notify-sw.js` shows the
   notification from that payload (with a fallback title if the payload is empty), and
   `notificationclick` opens `data.url`. Nothing else in the app has to change for delivery.

**Privacy.** A push subscription is a random endpoint URL from the browser's push service
(Google, Apple, Mozilla) plus two encryption keys. It holds no name, no age, no progress and
no personal data. The server would store only that. The push service does see delivery
metadata (when a message was sent to that device). Payloads are encrypted end to end with the
subscription keys.

Until then, the app-icon badge (on installed apps) and Pogo's line at home are the live
signals. The local-reminder code stays in place in case a browser ever ships Notification Triggers.
