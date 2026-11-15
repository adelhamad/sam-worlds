# Course Kit — how to add a Pogo course

This is the guide for adding a new course (a Duolingo-style lesson path with Pogo) to
Sam's Worlds. Read it top to bottom before you start; follow the checklist at the end.
Background on what courses are and how they plug into the engine: `docs/POGO_COURSES.md`.

> **No emoji. Anywhere.** The game does not use emoji. Pictures are named icons — see
> `src/content/iconNames.ts` — or text. If you need a picture that has no icon, use words;
> do not add emoji and do not add icon names yourself — ask. The audit fails on any emoji
> character in a course and on the old `emoji` field.

There are two ways to build a course:

| | **Kit course** (data only) | **Custom-mechanic course** |
|---|---|---|
| Use when | The ideas can be taught with cards: pick, match, order, sort, build a sentence, type a number | The course needs its own interactive toy (a chess board, a code grid, a clock to set…) |
| You write | ONE content file | content + a planner in `src/engine/<id>/` + widgets in `src/modules/tour/<id>/` |
| Examples | `src/content/_template/course.ts` (the reference course — copy it) | `chess` (Chess Camp), `code` (Code Lab), `tick` (Tick Tock) |

Prefer a kit course. A custom course can still use the kit:

- it may **mix static kit templates** into its lessons through a `kit:` param (Code Lab:
  `CodeParams.kit` with `codeKit(...)` from `src/content/code/bank.ts`; Tick Tock:
  `tickKit(...)` from `src/content/tick/bank.ts`), and
- its planner may **build kit payloads directly** (Tick Tock's planner builds `kit-pairs`,
  `kit-pick` and `kit-order` questions with clock cards it generates) — the kit widgets
  draw them; the course's own audit checks them.

## 1. Kit course — the whole recipe

1. Copy `src/content/_template/course.ts` to `src/content/<id>/course.ts`. It is a small,
   complete, heavily commented course (Shapes and Patterns: 2 units × 3 lessons, every
   template kind, intro slides with pictures). Replace its content; keep its shape.
2. Rename the export (e.g. `SPACE_COURSE`) and add it to `COURSES` in
   `src/content/courses.ts`. Registering it is all it takes.
3. Run `bun scripts/audit-kit.ts`, then `bun run check`. Done — the home shelf, path,
   lesson player, chests, trophies, daily quests, parent controls and the audits pick the
   course up from the registry.

No routes, no store changes, no CSS, no React.

### 1.1 Course, units, lessons

```ts
import { iconRef } from "../iconNames";
import { defineKitCourse } from "../kitCourse";

export const SPACE_COURSE = defineKitCourse({
  id: "space",            // short, permanent; stage ids become space-u01-l1 …
  worldId: "spacecamp",   // permanent; must not clash with an existing world id
  title: "Space Camp", icon: iconRef("rocket"), tagline: "Fly to the planets with Pogo!",
  path: "/space", hue: "#b794ff", subject: "explore",   // "explore" | "think" | "create"
  isNew: true,
  units: UNITS, bank: BANK,
});
```

- A **unit** teaches one idea: `name`, `icon` (an `iconRef("…")`), `hue`, `blurb`
  (≤ 8 words), a `souvenir` (`{ icon: iconRef("…"), name }` — the keepsake in the unit
  chest) and 3–5 **lessons**. The last lesson of a unit is its champion lesson
  (10 questions; the others have 8).
- A **lesson** has a `name`, 2–5 `templates` (ids from the bank) and optional `intro`
  slides. Templates of earlier lessons come back automatically as spaced review, and a
  champion lesson may also list templates from earlier units.
- Give the first lesson that introduces an idea an `intro`: 1–4 slides, each
  `{ art?, title, lines }` — a title of ≤ 5 words, one or two lines of ≤ 9 words, and an
  optional picture shown in a big badge (no `art` = Pogo presents the slide alone). Teach
  first, then ask.
- Aim for 4–8 units. Order them so each unit only needs ideas from earlier ones.

**Ids are permanent.** Saves store stage ids (`<id>-u01-l1`), so after a course ships you
may only APPEND units and lessons — never reorder, remove or rename them. Template ids
and item ids can change freely.

### 1.2 Cards and pictures

A card (`KitItem`) is `{ id, label, art? }`:

- `label` — the words on the card. Keep it short (≤ 28 characters) so cards fit on a
  phone; for full sentences use a `pick` with `layout: "list"` (≤ 60). Most cards are
  words only, and that is fine: text-only cards are drawn large and centred.
- `art` — an optional picture (`KitArt`, `src/engine/kit/types.ts`):
  - `{ kind: "icon", name: "tree" }` — a drawn icon. `name` must be in `ICON_NAMES`
    (`src/content/iconNames.ts`); TypeScript and the audit both check it.
  - `{ kind: "clock", hour: 3, minute: 30 }` — an analog clock face (hour 1–12,
    minute 0–59).
- `label: ""` makes a **picture-only** card (then `art` is required); screen readers hear
  the icon's name or the clock's digits. Two cards are different when their label OR
  their picture differs, so two picture-only clocks showing different times are fine.

```ts
{ id: "tree", label: "Tree" }                                          // words only
{ id: "tree", label: "Tree", art: { kind: "icon", name: "tree" } }     // icon + words
{ id: "c330", label: "", art: { kind: "clock", hour: 3, minute: 30 } } // picture only
```

Within one template give every card a picture or none — a mix looks like something is
missing. Use a picture only when it genuinely helps (a shape, an object the child should
recognise, a clock); never decorate. Slides take the same `art`.

### 1.3 Templates (the question bank)

A template is not one question; it is a *recipe with pools*. The planner samples a fresh
question from it every time (a miss always swaps in a different sample), so every pool
must be bigger than what one question shows. Types: `src/engine/kit/types.ts`.

| kind | The child… | You provide | Pool to write |
|---|---|---|---|
| `pick` | taps the one right card | `right[]`, `wrong[]`, optional `hero`, `layout` | ≥ 3 right, ≥ 6 wrong |
| `pairs` | matches left cards to partners | `pairs[] = { left, right }` | ≥ 7 pairs |
| `order` | puts cards in order | `sequences[][]`, each already in the right order | one sequence of ≥ 6 steps, or several of ≥ 5 |
| `sort` | drops cards into 2–3 buckets | `buckets[] = { bucket, items[] }` | ≥ 5 items per bucket |
| `build` | builds a sentence from word tiles | `sentences[] = { words[], decoys[] }` | ≥ 6 sentences |
| `number` | types a number | `variants[] = { items[], answer, caption? }` | ≥ 6 variants |

The audit requires every template to produce **at least 6 different questions**; the pools
above get you there with room to spare. It also fails a lesson whose templates are so thin
that the planner has to reuse a question.

How the planner uses the pools (so you can write for it):

- `pairs` — any 3–5 of your pairs may appear together, and on harder settings one extra
  right-hand card from an unused pair is added as a decoy. So a left card must fit exactly
  ONE right card in the whole template, not just among its neighbours. Left and right
  ids must all differ. When one side is picture-only (clocks), the board stacks the
  pictures on top and the words below.
- `order` — a long sequence is cut down to 3–5 steps keeping their order, so every subset
  of your steps must still have one obvious order. Ids must be unique across all
  sequences. Clock or picture-only cards are laid out as a strip (spots side by side).
- `build` — the child must use every real word; a shorter sentence made from fewer tiles
  counts as a miss. Write sentences where swapping two words, or dropping one, does not
  leave another sensible sentence (avoid two swappable nouns: "A cat chases a dog").
- `pick` — one card from `right`, the rest from `wrong`; any `wrong` card may sit next to
  any `right` card.
- `number` — `items` are drawn above the number pad: picture-only icon cards to count
  (keep counts ≤ 12), or word cards to read.

Every template also needs `id`, `prompt` (what Pogo asks, ≤ 9 simple words) and `explain`
(one warm line that teaches the idea — it is shown on the "Almost — look at this." card).

### 1.4 Writing rules (the audit enforces most of these)

- **No emoji** — not in labels, prompts, explains, slide titles or lines, build words,
  captions or unit icons. Pictures are named icons (`src/content/iconNames.ts`) or text.
  If you need a picture that has no icon, use words; do not add emoji and do not add icon
  names yourself — ask.
- Age 6–10, reading level of a 7-year-old: short common words, one idea per card.
- True and checkable. Never teach something you would have to caveat for an adult (or
  that is only true where you live — seasons, weather, foods).
- Exactly one defensible answer. If two cards could both be right, change the cards.
  In `order`, every sequence must have ONE natural order. In `build`, the sentence must
  have ONE natural word order and no decoy may make a second valid sentence.
- Wrong options should be tempting but clearly not right once you know the idea — never
  trick questions, never jokes at the child's expense.
- The words "wrong" and "fail" never appear. A miss is "Almost — look at this."
- No timers, no lives, no punishment, nothing scary. Rewards are fixed, never random.
- Do not list the same template in more than three lessons of the whole course; variety
  matters more than volume. 2–5 templates per lesson is the sweet spot.
- Files are capped at 500 lines. A big course may keep its bank in `bank.ts` next to
  `course.ts` (Code Lab does), or use small helper functions to build cards (the
  reference course does).

## 2. Custom-mechanic course

Only when cards cannot teach it. Mirror `chess`, `code` or `tick`, file by file:

1. **Contract** — `src/engine/<id>/types.ts`: payload types whose `tour` kind is prefixed
   `<id>-`, a `<id>Payload(q)` narrowing helper, stage params. Questions use
   `inputMode: "tour"` and `repeatable: true`.
2. **Judge** — `src/engine/<id>/judge.ts` (or `clock.ts`): pure serialisers. The store
   judges with `typed === question.answer`; a widget never decides. Puzzles with many
   right answers report a fixed token when solved (see `MISSION_DONE`, `CODE_DONE`).
3. **Planner** — `src/engine/<id>/planner.ts`: `plan…Lesson(params, count, seed, ctx,
   excluded)` (seeded, always returns `count`, `count === 1` = replacement that avoids
   `excluded` and keeps the same skill), `generate…`, `…SessionParams`. Register all
   three in `src/engine/courses/planners.ts` (one entry). The planner may return kit
   payloads (`kit-pick`, `kit-pairs`, `kit-order`, …) for some slots — cards with `art`
   (icons, clocks) render through the kit widgets for free.
4. **Widgets** — `src/modules/tour/<id>/`: `<Id>Exercise`, `<Id>Teach`, optional
   `<Id>Meet` (opening demo). Add one branch each in
   `src/modules/tour/exercises/TourExercise.tsx` and `openingOf` in `TourLesson.tsx`; add
   self-submitting kinds to `SELF_SUBMITTING` in `exercises/contract.ts`. Pictures come
   from `<Icon name>` (`src/ui/icons/Icon.tsx`) and `<ClockFace>` (`src/ui/clock/`) —
   never emoji.
5. **Content** — `src/content/<id>/units.ts` exporting a `Course`; add it to `COURSES`.
   Static kit templates for it live in `src/content/<id>/bank.ts` (see Code Lab, Tick Tock).
6. **Audit** — `scripts/audit-<id>.ts` hooked into `scripts/audit-questions.ts`: every
   generated puzzle is valid, solvable, and its answer is reproducible. Static kit
   templates mixed in through `kit:` are audited by `scripts/audit-kit.ts` automatically.

## 3. Verify

- `bun scripts/audit-kit.ts` — the fast content check while you write: it names every
  template that breaks a rule (pool too small, label too long, an emoji, an unknown icon,
  a banned word, two cards that look the same).
- `bun run check` — lint, the full question audit and the build. It must pass before you
  commit.
- `bun run bot -- --course <id>` plays a whole lesson through the real UI in a headless
  browser and prints the result (`scripts/lesson-bot.mjs`; add `--lesson <n>` to pick a
  lesson, `--miss 1,3` to miss on purpose, `--shots <dir>` for screenshots, `--sheets 1`
  to also photograph every feedback sheet). It fails if the top bar ever leaves the
  screen. Look at the screenshots: cards must not overflow, nothing may scroll inside a
  question on a phone.
- DEV test benches while `bun run dev` runs: `/#/tour/lab/kit` (every widget with icon,
  clock and text-only cards, the teach cards and the slides), `/#/tour/lab/code`,
  `/#/tour/lab/tick`, `/#/tour/lab/chess`, `/#/tour/lab/exercises`, `/#/tour/lab/pogo`,
  `/#/tour/lab/icons`.

## 4. Checklist

- [ ] Course content file written (copied from `src/content/_template/course.ts`); ids
      unique and permanent
- [ ] No emoji anywhere; every picture is an `art` icon from `ICON_NAMES` (or a clock)
- [ ] Added to `COURSES`
- [ ] Every lesson that introduces an idea has intro slides
- [ ] Every template has an `explain` line that teaches, and pools above the minimums
- [ ] `bun scripts/audit-kit.ts` and `bun run check` pass
- [ ] `bun run bot -- --course <id>` finishes a lesson with no errors; screenshots look right
- [ ] Nothing in `src/state/`, `src/engine/save/`, routes or the Parent Section was touched
      (a kit course never needs to)
