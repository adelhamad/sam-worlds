# Pogo's courses — World Tour and Chess Camp

Duolingo-style lesson paths that sit next to the existing worlds (nothing was removed).
**Pogo**, a small alien from Sam's base, is the mascot of both:

- **World Tour** (`/tour`) — countries, flags and maps; Sam is the guide showing Pogo Earth.
- **Chess Camp** (`/chess`) — chess from zero for ages 6–10: one unit per piece, then piece
  points and home squares, check, and checkmate.

Entry points: the "Play with Pogo!" banner at the top of the hub, the two planets in the
world grid, and the hub's Continue bar. Lessons play at `<course path>/lesson/:stageId`.

## Why it is built this way

- **A character that reacts** — Pogo hops on a right answer, tilts his head on a miss,
  hands over a gift halfway through every lesson and bounces in to cheer near the end.
- **Built answers, not four buttons** — geography: hear-and-pick, match pairs, build the
  name from tiles, tap the map, sort into continents, paint the flag. Chess: drag pieces
  on a real board (collect the stars in N moves, capture, promote, check, escape,
  checkmate in 1), tap every square a piece can reach, add up piece points, set up the
  back row. Every chess lesson of a new piece opens with a free-play demo.
- **Collecting as you go** — a Star Dust meter fills slot by slot (the same
  accuracy-weighted payout the store pays at the end), plus one gift box per lesson.
- **Spaced repetition** — earlier countries / pieces keep coming back, so course questions
  are `repeatable` and stay out of the global "never repeat" history.
- **Things to own** — passport stamps (geography), a golden piece per chess unit for Sam's
  chess set, a chest and trophy per unit, and "Day N" that only ever grows. No hearts, no
  timers, no streak to lose; a miss is "Almost — look at this." with a teach card.

## How it plugs into the engine

Course lessons are ordinary stages of the worlds `tour` and `chess`, so the
answer-integrity rules (`docs/ANSWER_INTEGRITY.md`), payouts, stars, session restore, pet
feeding, trophies and the Parent Section's world controls apply without course-specific
code. A widget never judges: it serialises what the child did with the helpers in
`engine/*/answers.ts` / `engine/chess/judge.ts` and the store compares it to
`question.answer`. A miss swaps in a fresh question of the same kind.

| Piece | Where |
|---|---|
| Course registry (routes, units, unlock order) | `src/content/courses.ts`, `courseTypes.ts` |
| Curricula | `src/content/tour/units.ts`, `src/content/chess/units.ts`, `chess/intros.ts` |
| Geography planner + payload contract | `src/engine/tour/` (`types.ts`, `planner.ts`) |
| Chess rules, judge, puzzle planner | `src/engine/chess/` (`rules.ts`, `judge.ts`, `types.ts`, `planner.ts`) |
| In-lesson rewards (meter, gift, cheer slots) | `src/engine/answers/lessonRewards.ts` |
| Passport / chests / tour days state | `src/state/tour.ts` (rides the settings row) |
| Mascot, confetti, flag; chess pieces and board | `src/ui/tour/`, `src/ui/chess/` |
| Path, passport, chess set, chests | `src/modules/tour/TourPath.tsx`, `src/modules/tour/path/` |
| Lesson player | `src/modules/tour/TourLesson.tsx`, `src/modules/tour/lesson/` |
| Exercise widgets and teach cards | `src/modules/tour/exercises/`, `src/modules/tour/chess/` |
| Strings | `src/strings/tour.ts`, `src/strings/chess.ts` |
| Audits (run inside `bun run check`) | `scripts/audit-tour.ts`, `scripts/audit-chess.ts` |

Chess specifics: boards are 4–6 squares wide so every square stays a comfortable tap
target on a phone; the child always plays White from the bottom; Black never moves inside
a puzzle; no castling or en passant yet; every mission's move budget is the fewest moves
that solve it (the audit re-solves each one).

## Extending it

- **More geography**: append a unit to `SEEDS` in `tour/units.ts` (12 country codes).
- **More chess**: append a unit to `SEEDS` in `chess/units.ts`; new puzzle ideas are a
  `ChessTask` + a generator in `engine/chess/` + audit rules. Natural next steps: a
  full 8×8 board on tablets, mini-games against Pogo, forks and pins.
- **A new course**: add its world, planner and widgets, then one entry in `COURSES` — the
  path, lesson player, chests, hub tile and parent controls follow.
- Never reorder or rename existing units or lessons — stage ids are saved.

Dev-only test benches (`bun run dev`): `/#/tour/lab/pogo`, `/#/tour/lab/exercises`,
`/#/tour/lab/chess`.

## Rolling it back

Lock or hide "World Tour" or "Chess Camp" in the Parent Section — its hub tile disappears
and nothing else changes. Course state has its own reset buttons there.
