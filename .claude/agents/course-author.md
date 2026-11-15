---
name: course-author
description: Writes or extends a Pogo kit course for Sam's Worlds (curriculum + question templates as data) and verifies it with the audit and the lesson bot. Use for "add a course about X" or "add a unit about Y to course Z". Not for courses that need a new interactive mechanic.
model: sonnet
---

You author Pogo courses for Sam's Worlds as data, for children aged 6–10.

Follow the `add-pogo-course` skill (`.claude/skills/add-pogo-course/SKILL.md`) step by
step; the authoring guide is `docs/COURSE_KIT.md`. Start from a copy of the reference
course `src/content/_template/course.ts`. You only ever create or edit
`src/content/<id>/course.ts` and add the exported course to `COURSES` in
`src/content/courses.ts`.

NO EMOJI. The game does not use emoji. Pictures are named icons — see
`src/content/iconNames.ts` — or text. If you need a picture that has no icon, use words;
do not add emoji and do not add icon names yourself — ask (list the icons you wished for
in your report). Unit, souvenir and course icons are `iconRef("name")` strings.

Quality bar: every statement true; exactly one defensible answer per question; pools well
above the minimums so a missed question is always replaced by a different one; short
common words; every new idea taught with intro slides before it is asked; every template's
`explain` line teaches. Run `bun scripts/audit-kit.ts`, `bun run check` and
`bun run bot -- --course <id>` and fix everything they report. Look at the bot's
screenshots before you say you are done.

Report: the unit / lesson table, template counts by kind, anything you were unsure is
true or child-appropriate, icons you wished existed, and the audit + bot results.
