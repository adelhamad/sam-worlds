# Sam's Worlds — Working Rules

Personal PWA learning game for Sam (7). Full spec lives in `SAMS_GAME_PLAN.md` — read §1 (principles) before adding any feature. Internal/family project: no accounts, no analytics, no runtime network calls, no unit-test suite.

## Non-negotiable workflow rule

**After every task, run `bun run check` (lint + typecheck + build) and fix everything it reports before considering the task done.**

## Tooling

- **bun, never npm/npx** — `bun install`, `bun run <script>`, `bunx`.
- `bun run dev` — dev server · `bun run lint` — ESLint · `bun run build` — typecheck + production build · `bun run check` — lint + build.
- Deploys to **Vercel** as a static Vite build (`vercel.json`). Keep it deployable: no server code, no env secrets.
- ESLint flat config with SonarJS: **max 500 lines/file, complexity ≤ 25, cognitive complexity ≤ 25**. Don't raise limits — split files/functions instead.

## Architecture (where things go)

- `src/engine/` — pure logic: generators, difficulty, economy, save, missions, feedback. **No React imports here.** Pure functions take `(params, rng, ctx)` so behavior is reproducible from a seed.
- `src/content/` — stages and worlds are **data** (JSON + metadata). Never put level logic in components; mechanics are reusable scene types.
- `src/pixi/` — PixiJS v8 scene classes. Pattern: `static async create(host, ...)`, imperative methods (`openGate`, `steer`), `destroy()`. React talks to scenes via refs, never the other way.
- `src/modules/<world>/` — per-world React screens.
- `src/ui/` — shared screens (hub, title, workshop).
- `src/state/store.ts` — single Zustand store; every meaningful action also persists to Dexie (fire-and-forget `void db...put(...)`).
- `src/strings/en.ts` + `src/persona.config.ts` — every player-facing string goes through these (name-aware, future Arabic toggle).

## Stack gotchas

- **PixiJS v8**: `await app.init(...)` then `host.appendChild(app.canvas)`. Guard async creation against React StrictMode double-mount (cancelled flag in useEffect cleanup, destroy on cancel).
- **Dexie**: schema changes need a `db.version(n+1)` migration — never edit an existing `version()` block.
- **Web Audio**: requires a user gesture; route everything through `unlockAudio()` first. Respect `soundOn`/`musicOn` settings.
- **RNG**: use `mulberry32(seed)` from `src/engine/rng.ts` for anything gameplay-related; store the seed so sessions can be restored exactly. `Math.random` only for cosmetic effects.
- **PWA**: new asset types must be added to `globPatterns` in `vite.config.ts` or they won't work offline.

## Answer integrity & anti-guessing (GLOBAL engine rule — every game, current and future)

Full spec: `docs/ANSWER_INTEGRITY.md`. No question flow may bypass these; the shared
logic lives in `src/engine/answers/` — never write per-game answer handling.

1. **Regenerate on miss** — a wrong answer discards the question and generates a fresh
   same-difficulty one. Elimination must never converge on the answer. The concept of
   "retrying the exact same question" must not exist anywhere.
2. **Constructed answers by default** — number pad, dragging, setting hands, placing
   notes. Multiple choice only for true matching questions (rule 1 still applies there).
3. **Miss scaffold** — 1st miss: input locks 2–3s while the hint shows, then a fresh
   question. 2nd miss on the skill: show a worked example. Tone: "Almost — look at this."
   The words "wrong"/"fail" never appear in player-facing strings.
4. **Accuracy-weighted payout** — first-try = 100%, correct-after-hint = 40%; stars from
   first-try accuracy only; Perfect Run (all first-try) = bonus + unique fanfare;
   completion always pays something, nothing is ever deducted.
5. **Rapid-guess detection** — ≥3 wrong answers each under ~2s → adjust difficulty, one
   warm companion line, log for Parent Corner. A signal to adapt, never a penalty.

## Design rules (from the plan — enforce in code review)

- Touch-first: minimum 48px targets; layouts must work portrait tablet and phone first, desktop second.
- Never punish: no fail states, no lost progress, no timers Sam didn't opt into. Wrong answer → "Almost! Try again."
- Cyan (`--cyan`) is reserved for rewards/interactives only.
- Every reward must be deterministic (effort → reward); bounded surprise max once per session, cosmetic only.
- Music/audio assets must be license-clean (current tracks: Kevin MacLeod, CC BY 4.0 — keep the title-screen credit).
