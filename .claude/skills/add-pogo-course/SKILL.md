---
name: add-pogo-course
description: Add a new Pogo course (a Duolingo-style lesson path) to Sam's Worlds, or extend an existing one with units and lessons. Use when asked to "add a course", "add a game like Chess Camp / Code Lab / Tick Tock", "teach X with Pogo", or to add units, lessons or questions to a course.
---

# Add a Pogo course

A course is a path of units and lessons played in the shared lesson player with the mascot
Pogo. Almost every new course should be a **kit course**: one data file, no React, no
engine code. The full guide is `docs/COURSE_KIT.md` — read it before writing anything.
Background: `docs/POGO_COURSES.md`. Project rules: `CLAUDE.md`.

**No emoji — the owner hates them.** The game does not use emoji. Pictures are named
icons — see `src/content/iconNames.ts` — or text. If you need a picture that has no icon,
use words; do not add emoji and do not add icon names yourself — ask. This holds for
labels, prompts, slides and unit / course / souvenir icons (use `iconRef("name")`).

## Procedure

1. **Recall the rules.** Read `docs/COURSE_KIT.md` (all of it) and read
   `src/content/_template/course.ts`, the reference kit course — its comments explain
   every choice (pools, one defensible answer, where pictures come from).
2. **Design before typing.** Write the unit list first (4–8 units, 3–5 lessons each): the
   one idea each unit teaches, in an order where each unit only needs earlier ones. For a
   child of 6–10 who has never met the subject. Show the plan to the user only if they
   asked to review it; otherwise proceed.
3. **Copy `src/content/_template/course.ts` to `src/content/<id>/course.ts`** and replace
   its content (it uses `defineKitCourse`). Cards are words by default; add
   `art: { kind: "icon", name }` only where a picture genuinely helps and the name is in
   `ICON_NAMES` (clocks: `{ kind: "clock", hour, minute }`). For each lesson that
   introduces an idea, add `intro` slides (teach first, then ask). Write templates as
   recipes with pools well above the minimums (guide §1.3), obeying the writing rules
   (guide §1.4): true, one defensible answer, short words, warm tone, no emoji.
4. **Register** the course: add the exported course to `COURSES` in
   `src/content/courses.ts`. Nothing else — routes, the home shelf, chests, trophies,
   quests, parent controls and audits read the registry.
5. **Verify.**
   - `bun scripts/audit-kit.ts` while you write (names every broken template).
   - `bun run check` must pass (the kit audit reports every content problem by template id).
   - `bun run bot -- --course <id> --shots /tmp/<id>-shots` must exit 0; repeat with
     `--lesson <n>` for a middle lesson and the last lesson, and once with `--miss 1,3`.
   - Open the screenshots and LOOK: no card overflows or clips, nothing scrolls inside a
     question on the phone size, intro slides read well.
6. **Self-review the content** as a sceptical adult and as a 7-year-old: is every answer
   the only right one? Is every statement true? Does each `explain` line teach?
7. **Ship** the way `CLAUDE.md` / the user's instructions say (branch, commit, PR).

## Only if cards cannot teach it

A course that needs its own interactive toy (like the chess board or the code grid) is a
custom-mechanic course: follow guide §2 and mirror `chess`, `code` or `tick`
(`src/engine/<id>/` + `src/modules/tour/<id>/`) file by file. Such a course can still mix
static kit templates into lessons through a `kit:` param (Code Lab, Tick Tock) and its
planner may build kit payloads directly (Tick Tock's clock cards). It is several times the
work — say so, and prefer a kit course.

## Never

- Rename, reorder or delete shipped units or lessons (stage ids live in saves) — append.
- Touch `src/state/`, `src/engine/save/`, routes or the Parent Section for a kit course.
- Use emoji anywhere, or invent icon names (ask for a new icon instead).
- Add timers, lives, streaks that can be lost, random rewards, or the words "wrong"/"fail".
- Add network calls, analytics, accounts or server code.
