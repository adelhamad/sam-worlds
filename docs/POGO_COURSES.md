# Pogo's courses — World Tour, Chess Camp, Code Lab, Tick Tock, Yalla Arabic, Bonjour French

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

## The language courses

**Yalla Arabic** (spoken Levantine Arabic, `/arabic`) and **Bonjour French** (`/french`)
sit on their own **Languages** shelf at home. They are data: unit files of phrases a
child really says, real-life scenes ("Teta gives you a cookie — what do you say?") and,
for Arabic, the alphabet to read and write. Authoring guide, the Latin spelling scheme
for Arabic and both syllabuses: `docs/LANGUAGES.md`.

| Piece | Where |
|---|---|
| Contract, planner, answer helpers | `src/engine/lang/` (`types.ts`, `planner.ts`, `tasks.ts`, `cards.ts`, `answers.ts`) |
| Course builder | `src/content/langCourse.ts` (`defineLangCourse`), registry `src/content/langCourses.ts` |
| Content | `src/content/arabic/` (`course.ts`, `alphabet.ts`, `units/uNN.ts`), `src/content/french/` |
| Widgets, opening slides, teach card, mission card | `src/modules/tour/lang/` |
| Voices (Arabic, French) | `speakIn` / `voiceFor` in `src/engine/feedback/speech.ts`, `useVoice` |
| Writing a letter with a finger | judge `src/engine/write/`, canvas `src/ui/write/`, strokes `src/content/arabic/strokes.gen.ts`, guide `docs/ARABIC_WRITING.md` |
| Strings | `src/strings/lang.ts`, `src/strings/write.ts` |
| Audit | `scripts/audit-lang.ts` (+ `-seed`, `-question`), `scripts/audit-write.ts` |

Things to know before touching them:

- **Ten kinds of question** come out of one lesson's data: hear → meaning, meaning →
  phrase, read (no Latin help), match pairs, build the sentence from word tiles, a
  real-life scene → what you say, spell a word from letter tiles (the line shows the
  letters joined, so Arabic connects as in real writing), trace a letter, letter → sound,
  sound → letter. The lesson kind (`words`, `talk`, `letters`, `review`) only sets the mix.
- **The other options of a question are other phrases the child has met.** `like` on a
  phrase and `alsoOk` on a scene keep out anything that could also be right; the audit
  checks every planned question for it. The audit cannot judge the language itself.
- **The voice is the device's own** (Web Speech, on-device). Arabic voices read Standard
  Arabic, so each phrase may carry a `say` spelled as the dialect sounds. A device with
  no voice for the language shows the words to read out loud instead — nothing breaks.
- **Every unit ends with a real-life mission** (shown on the lesson-complete screen):
  one thing to say to a real person today. Nothing is tracked.
- The course's world id is `yalla`, not `arabic`: the classic Letter Garden world owns
  `arabic` and saves refer to it.

## Pogo, the lesson's rhythm and the finish

Shared by every course — a new course gets all of it for free.

- **Pogo is drawn in code** (`src/ui/tour/`): `pogoPoses.ts` lists the moods as data
  (eyes, mouth, brows, antenna, props, what the right mitten does), `PogoArt.tsx` /
  `PogoFace.tsx` / `PogoProps.tsx` draw them, `pogo.css` / `pogo-moods.css` /
  `pogo-arc.css` / `pogo-live.css` move them. A new mood is one `POSES` entry plus its CSS
  block (a static pose plus motion; `.pogo-still` and reduced motion keep the pose).
  Moods: idle, happy, cheer, think, wave, talk, wow, sleep, sad, dizzy, zoom, splat,
  starry; the miss arc oops, worried, focus, determined, relieved, proud, whoa; and
  giggle, beckon, twirl, flip. Every mood is in the dev gallery `/#/tour/lab/pogo`
  (three sizes, plus buttons that play the whole miss arc).
- **A mistake registers — then gets fixed.** The owner asked that a miss make Pogo show
  feelings so the child senses "I need to fix this and concentrate", without any
  punishment (`usePogoReaction` in `TourLesson.tsx`, beats in ms from the sheet opening):
  1. *oops* (0–0.6 s): a startled jolt, mittens to his cheeks, bulb flickers, "uh-oh".
  2. *sad* (0.6–1.8 s): droop and one tear. A **second miss in the same slot** is *worried*
     instead (bitten lip, sweat drop, small tremble, soft "aww"). Rapid guessing
     (`sheet.slowDown`) is *whoa* instead, held: a raised palm and a slow head shake.
  3. *focus* (from 1.8 s while the amber sheet is open): brows level, eyes narrowed and
     looking down, a finger pointing down at the worked answer, the bulb pulsing like a
     lighthouse, a firm "hm!". His bubble says a short focus line (`TOUR.lesson.focusLines`).
  4. *determined* for the whole retry (`session.attemptMissed`, so it survives a reload):
     leaning in, tongue tip out, "effort" strokes, slow blink — the prompt still shows.
  5. The first right answer after a miss in that slot: *relieved* ("phew", wipes his brow,
     the sweat drop flies off) for 1 s, then *proud* (chest out, thumbs up) — worth more
     than an ordinary hop. A choices question that must be proven twice counts its
     "one more to be sure" sheet as the fix; Pogo stays determined for the proof.
  Pogo's acting never depends on WHAT was answered, only on the verdict the store gave.
- **Pogo plays along while the child works** (`lesson/usePogoLive.ts`, used by
  `QuestionView`): his pupils and head follow the child's finger (one passive pointer
  listener writing CSS variables on `.tl-ask` — no React render per move; off under
  reduced motion); he perks up when the answer is ready (only `value !== null`, never
  the value); after ~10 s without a touch he fidgets, after ~20 s he waves down at the
  puzzle — any touch ends it, nothing is shown to the child. Tapping him (`PogoTap` +
  `usePogoPoke`) makes him giggle, hop, turn round or squish, with a rate-limited voice;
  taps are ignored while a sheet is up. Combo milestones escalate: 3 cheer, 5 twirl,
  8 flip. A tiny Pogo head (`PogoHead.tsx`) rides the progress bar and hops each step.
- **Bigger Pogo.** The lesson Pogo is drawn at 120 px on a tall phone (184 on a portrait
  tablet, 96 on a landscape phone — `useLessonPogoSize`), but `.tl-ask` pulls his art's
  empty edges into the gutters, so the layout box grows far less than the drawing.
  On the path he is 104 px, can be tapped, and hops over from the lesson he stood at
  before (`path/PogoGuide.tsx`); on the home card he is 124 / 172 px and can be tapped.
- **Pogo has a voice** (`src/engine/feedback/pogoVoice.ts`, synthesized like every other
  sound): a chirp on a right answer, "uh-oh" / "hm!" / "phew" around a miss, a giggle when
  tapped, a cheer at the end, and the slapstick sounds of the entrance. `lessonSound.ts`
  is the one place that decides which sound plays when.
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
`/#/tour/lab/kit`, `/#/tour/lab/lang` (any lesson of a language course, question by
question: `?course=arabic&lesson=3&seed=2`), `/#/tour/lab/chess`, `/#/tour/lab/code`, `/#/tour/lab/tick`,
`/#/tour/lab/icons`.

## Rolling it back

Lock or hide a course (e.g. "World Tour") in the Parent Section — its home tile disappears
and nothing else changes. Course state has its own reset buttons there.

Flags: [flag-icons](https://github.com/lipis/flag-icons) by Lipis (MIT) - copies in `src/assets/flags/` via `bun scripts/copy-flags.ts`.
