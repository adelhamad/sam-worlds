# Pogo's courses — World Tour, Chess Camp, Code Lab, Tick Tock

Duolingo-style lesson paths that sit next to the existing worlds (nothing was removed).
**Pogo**, a small alien from Sam's base, is the mascot of all of them:

- **World Tour** (`/tour`) — countries, flags and maps; Sam is the guide showing Pogo Earth.
- **Chess Camp** (`/chess`) — chess from zero for ages 6–10: one unit per piece, then piece
  points and home squares, check, and checkmate.
- **Code Lab** (`/code`) — thinking like a programmer: steering Pogo on a grid with code
  blocks, reading and debugging programs, loops; plus Course Kit cards (steps in order,
  if-then rules, patterns).
- **Tick Tock** (`/tick`) — telling the time on a real clock face: whole hours to any
  minute, parts of the day, "how much later"; plus Course Kit cards with clock pictures.

Entry point: the home screen (`src/ui/home/`) — Pogo's card says what to do next, daily
quests sit under it and every course is on the course shelf. Lessons play at
`<course path>/lesson/:stageId`. New courses are written with the **Course Kit**
(`docs/COURSE_KIT.md`); the reference course to copy is `src/content/_template/course.ts`.

**No emoji.** The courses do not use emoji: pictures are drawn icons by name
(`src/content/iconNames.ts`, drawn by `src/ui/icons/`), clocks (`src/ui/clock/`), flags, or
words. New content never adds emoji (the kit audit fails on them).

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

Course lessons are ordinary stages of each course's world (`tour`, `chess`, …), so the
answer-integrity rules (`docs/ANSWER_INTEGRITY.md`), payouts, stars, session restore,
trophies and the Parent Section's world controls apply without course-specific
code. A widget never judges: it serialises what the child did with the helpers in
`engine/*/answers.ts` / `engine/<course>/judge.ts` and the store compares it to
`question.answer`. A miss swaps in a fresh question of the same kind.

| Piece | Where |
|---|---|
| Course registry (routes, units, unlock order) | `src/content/courses.ts`, `courseTypes.ts` |
| Planner registry (one entry per mechanic) | `src/engine/courses/planners.ts` |
| Curricula | `src/content/<course>/units.ts` (`tour`, `chess`, `code`, `tick`), `chess/intros.ts`, `code/intros.ts` |
| Course Kit (data-only courses, cards) | contract + planner `src/engine/kit/`, `defineKitCourse` in `src/content/kitCourse.ts`, widgets `src/modules/tour/kit/`, reference course `src/content/_template/course.ts`, guide `docs/COURSE_KIT.md` |
| Geography planner + payload contract | `src/engine/tour/` (`types.ts`, `planner.ts`) |
| Chess rules, judge, puzzle planner | `src/engine/chess/` (`rules.ts`, `judge.ts`, `types.ts`, `planner.ts`) |
| Code Lab puzzles, solver, planner; kit bank | `src/engine/code/`, `src/content/code/bank.ts` |
| Tick Tock clock maths, planner; kit bank | `src/engine/tick/` (`clock.ts`, `planner.ts`), `src/content/tick/bank.ts` |
| Icons (names → drawn art), clock face | `src/content/iconNames.ts`, `src/ui/icons/`, `src/ui/clock/ClockFace.tsx` |
| Home (Pogo's card, course shelf, my things) | `src/ui/home/` |
| Daily quests | `src/engine/quests/`, `src/state/quests.ts` |
| In-lesson rewards (meter, gift, cheer slots) | `src/engine/answers/lessonRewards.ts` |
| Passport / chests / tour days state | `src/state/tour.ts` (rides the settings row) |
| Mascot, confetti, flag; chess pieces and board | `src/ui/tour/`, `src/ui/chess/` |
| Path, passport, chess set, chests | `src/modules/tour/TourPath.tsx`, `src/modules/tour/path/` |
| Lesson player | `src/modules/tour/TourLesson.tsx`, `src/modules/tour/lesson/` |
| Exercise widgets and teach cards | `src/modules/tour/exercises/`, `src/modules/tour/{kit,chess,code,tick}/` |
| Strings | `src/strings/tour.ts`, `src/strings/chess.ts`, … |
| Audits (run inside `bun run check`) | `scripts/audit-tour.ts`, `scripts/audit-chess.ts`, `scripts/audit-code.ts`, `scripts/audit-kit.ts`, … via `scripts/audit-questions.ts` |

Chess specifics: boards are 4–6 squares wide so every square stays a comfortable tap
target on a phone; the child always plays White from the bottom; Black never moves inside
a puzzle; no castling or en passant yet; every mission's move budget is the fewest moves
that solve it (the audit re-solves each one).

## Pogo, the lesson's rhythm and the finish

Shared by every course — a new course gets all of it for free.

- **Pogo is drawn in code** (`src/ui/tour/`): `pogoPoses.ts` lists the moods as data
  (eyes, mouth, brows, antenna, props), `PogoArt.tsx` / `PogoFace.tsx` / `PogoProps.tsx`
  draw them, `pogo.css` / `pogo-moods.css` move them. A new mood is one `POSES` entry plus
  its CSS block. Moods: idle, happy, cheer, think, wave, talk, wow, sleep, sad, dizzy,
  zoom, splat, starry.
- **A miss makes Pogo sad — briefly.** The owner asked for it. Pogo droops with one tear
  for under two seconds, then turns curious and looks at the worked answer with the
  child (`usePogoReaction` in `TourLesson.tsx`). It is sympathy, never blame: the sheet
  still says "Almost — look at this." and nothing is lost.
- **Pogo has a voice** (`src/engine/feedback/pogoVoice.ts`, synthesized like every other
  sound): a chirp on a right answer, a soft "aww" on a miss, a cheer at the end, and the
  slapstick sounds of the entrance. `lessonSound.ts` is the one place that decides which
  sound plays when.
- **The solved puzzle stays solved under the feedback sheet.** Puzzles that submit
  themselves (missions, pairs, code runs) report from a timer; `useLessonFlow.submit`
  commits the store change and the sheet in one synchronous render (`flushSync`) so the
  widget is never rebuilt from scratch — which used to look like the puzzle had restarted.
- **The last right answer has no sheet.** The solved puzzle holds for a beat
  (`flow.finale`), then the screen is cleared for Pogo's entrance
  (`lesson/FinishEntrance.tsx`, scripts in `lesson/finishActs.ts`, motion in
  `lesson/finish.css`): he hits the glass and slides down, or drops in and bounces, or
  peeks up from the bottom edge — picked from the session seed, skipped by a tap and by
  reduced motion. Only then do the results and the fanfare arrive (`LessonComplete.tsx`).
  A Perfect Run gets the star-struck Pogo.
- **The lesson screen can never scroll** (`overflow: clip` on its root, the document
  locked while it shows), so the top bar cannot slide out of view. `bun run bot` checks
  the bar after every answer.

## Extending it

- **More geography**: append a unit to `SEEDS` in `tour/units.ts` (12 country codes).
- **More chess**: append a unit to `SEEDS` in `chess/units.ts`; new puzzle ideas are a
  `ChessTask` + a generator in `engine/chess/` + audit rules. Natural next steps: a
  full 8×8 board on tablets, mini-games against Pogo, forks and pins.
- **A new course**: almost always a kit course — copy `src/content/_template/course.ts`
  and add the export to `COURSES` (`docs/COURSE_KIT.md`). Only a new interactive toy
  needs its own planner (one entry in `src/engine/courses/planners.ts`) and widgets. The
  path, lesson player, chests, home shelf and parent controls follow from `COURSES`.
- Never reorder or rename existing units or lessons — stage ids are saved.

Dev-only test benches (`bun run dev`): `/#/tour/lab/pogo` (every mood, the three
entrances, Pogo's voice), `/#/tour/lab/exercises`,
`/#/tour/lab/kit`, `/#/tour/lab/chess`, `/#/tour/lab/code`, `/#/tour/lab/tick`,
`/#/tour/lab/icons`.

## Rolling it back

Lock or hide a course (e.g. "World Tour") in the Parent Section — its home tile disappears
and nothing else changes. Course state has its own reset buttons there.

Flags: [flag-icons](https://github.com/lipis/flag-icons) by Lipis (MIT) - copies in `src/assets/flags/` via `bun scripts/copy-flags.ts`.
