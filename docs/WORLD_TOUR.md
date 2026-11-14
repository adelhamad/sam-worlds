# World Tour — the Duolingo-style trial

A trial mode that sits next to the existing worlds (nothing was removed). Sam guides
**Pogo**, a small alien from his base, around Earth: short lessons about countries, flags
and maps, played with hands-on exercises instead of four answer buttons.

Entry points: the banner at the top of the hub, the `World Tour` planet in the world grid,
and the hub's Continue bar. Routes: `/tour` (path) and `/tour/lesson/:stageId` (player).

## Why it is built this way

- **A character to teach** — Sam is the expert and Pogo the learner, so questions read as
  helping a friend rather than being tested. Pogo reacts to every answer.
- **Built answers** — six exercise kinds: hear-and-pick flag cards, match pairs, build the
  name from chunk tiles, tap the country on a map, sort into continents, paint the flag.
- **Spaced repetition** — each lesson mixes its four new countries with earlier ones, so
  tour questions are `repeatable` and stay out of the global "never repeat" history.
- **Things to own** — passport stamps (3 first-try answers per country), a chest and
  souvenir per unit, trophies on the Trophy Shelf, Star Dust, and "Day N" tour days that
  only ever grow (no streak to lose, no hearts, no timers).

## How it plugs into the engine

Tour lessons are ordinary stages of the world `tour`, so the answer-integrity rules
(`docs/ANSWER_INTEGRITY.md`), payouts, stars, session restore, pet feeding, trophies and
the Parent Section's world controls all apply without tour-specific code.

| Piece | Where |
|---|---|
| Curriculum (units, lessons, chests) | `src/content/tour/units.ts` |
| Payload contract for the six kinds | `src/engine/tour/types.ts` |
| Lesson planner and exercise builders | `src/engine/tour/` (`planner.ts` is the entry) |
| Canonical answer strings | `src/engine/tour/answers.ts` |
| Passport / chests / tour days state | `src/state/tour.ts` (rides the settings row) |
| Mascot, confetti, flag | `src/ui/tour/` |
| Path, passport, chests | `src/modules/tour/TourPath.tsx`, `src/modules/tour/path/` |
| Lesson player | `src/modules/tour/TourLesson.tsx`, `src/modules/tour/lesson/` |
| Exercise widgets and teach cards | `src/modules/tour/exercises/` |
| Strings | `src/strings/tour.ts` |
| Audit | `scripts/audit-tour.ts` (runs inside `bun run check`) |

A widget never judges an answer: it serialises what the child built with the helpers in
`answers.ts` and the shared store compares it to `question.answer`. A miss swaps in a
fresh question of the same kind about a different country and shows a teach card.

## Extending it

- **More countries**: append a unit to `SEEDS` in `units.ts` (12 codes from
  `countries.json`). Never reorder or rename existing units — stage ids are saved.
- **Another subject** (capitals, landmarks, animals…): add a planner + payload kinds and
  reuse the lesson player, path and mascot; they only depend on the contract files.
- **A new exercise kind**: add its payload to `types.ts`, a builder in `engine/tour/`,
  a widget + teach card in `modules/tour/exercises/`, and audit rules.

Dev-only test benches: `/#/tour/lab/pogo` and `/#/tour/lab/exercises` (`bun run dev`).

## Rolling it back

Lock or hide the `World Tour` world in the Parent Section — the hub banner disappears and
nothing else changes. Tour state has its own reset buttons there.
