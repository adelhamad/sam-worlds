// =============================================================================
// REFERENCE KIT COURSE — "Shapes and Patterns". COPY THIS FILE to start a new
// course: `src/content/<id>/course.ts`. It is NOT in `COURSES`, so it never
// appears in the app, but `bun scripts/audit-kit.ts` audits it like a real
// course, so everything below is known to pass. Guide: docs/COURSE_KIT.md.
//
// The shape of a kit course:
//   1. a BANK of templates (each one a recipe with pools — the planner draws a
//      fresh question from it every time, and a miss swaps in another sample),
//   2. UNITS → LESSONS that list template ids (+ intro slides),
//   3. one `defineKitCourse({...})` call that turns both into a Course.
// To ship your copy: export it and add it to `COURSES` in src/content/courses.ts.
//
// NO EMOJI — anywhere (labels, prompts, slides, unit icons). A picture is
// `art`: a drawn icon BY NAME from src/content/iconNames.ts, or a clock. If no
// icon fits, use words. Do not add emoji, and do not add icon names yourself —
// ask for the icon instead. Most cards are words only; that is fine.
// =============================================================================
import { iconRef, type IconName } from "../iconNames";
import { defineKitCourse, type KitUnitSeed } from "../kitCourse";
import type { KitItem, KitTemplate } from "../../engine/kit/types";

// ----------------------------------------------------------------- card helpers
// Small helpers keep the bank readable. Ids only need to be unique INSIDE one
// template (and may change freely — saves never store them).

/** A words-only card — the most common card. */
const word = (id: string, label: string): KitItem => ({ id, label });
/** A card with a drawn icon above / beside its label. */
const pic = (id: string, label: string, icon: IconName): KitItem => ({ id, label, art: { kind: "icon", name: icon } });
/** A picture-only card (label ""): the widget names it by its icon for screen readers. */
const only = (id: string, icon: IconName): KitItem => ({ id, label: "", art: { kind: "icon", name: icon } });

// =============================================================== UNIT 1: SHAPES

// PICK (grid) — tap the one right card. The planner shows ONE card from `right`
// and 2–3 from `wrong`, in any combination, so every `wrong` card must be
// clearly not round next to ANY right card. Write ≥ 3 right and ≥ 6 wrong.
// Icons here genuinely help: the child sees the shape. Within one template,
// give every card a picture or none — a mix looks like something is missing.
const SHP_ROUND: KitTemplate = {
  kind: "pick", id: "shp-round", prompt: "Which one is round?",
  explain: "Round things have no corners. They can roll.",
  right: [pic("circle", "Circle", "circle"), pic("ball", "Ball", "ball"), pic("globe", "Globe", "globe")],
  wrong: [
    pic("square", "Square", "square"), pic("triangle", "Triangle", "triangle"), pic("diamond", "Diamond", "diamond"),
    pic("book", "Book", "book"), pic("gift", "Gift box", "gift"), pic("home", "House", "home"),
  ],
};

// SORT — drop each card into its bucket. 2–3 buckets, write ≥ 5 items each:
// the planner shows 4–6 cards with at least one per bucket. No card may fit
// two buckets. Words only here: there is no icon for a ring or a bubble, and
// the template stays consistent.
const SHP_CORNERS: KitTemplate = {
  kind: "sort", id: "shp-corners", prompt: "Does it have corners?",
  explain: "A corner is where two straight sides meet.",
  buckets: [
    {
      bucket: word("corners", "Has corners"),
      items: [word("square", "Square"), word("triangle", "Triangle"), word("book", "Book"), word("door", "Door"), word("box", "Box"), word("diamond", "Diamond")],
    },
    {
      bucket: word("round", "No corners"),
      items: [word("circle", "Circle"), word("ball", "Ball"), word("bubble", "Bubble"), word("ring", "Ring"), word("wheel", "Wheel")],
    },
  ],
};

// PAIRS — match each left card to its partner. Any 3–5 pairs show together and
// on harder settings one unused partner joins as a decoy, so a left card must
// fit exactly ONE right card in the whole template: the square and the
// rectangle both have 4 sides, so their partners say what makes them different.
// Write ≥ 7 pairs; 6 is the minimum.
const SHP_SIDES: KitTemplate = {
  kind: "pairs", id: "shp-sides", prompt: "Match each shape to its sides",
  explain: "Count the straight sides, one by one.",
  pairs: [
    { left: word("triangle", "Triangle"), right: word("three", "3 sides") },
    { left: word("square", "Square"), right: word("four", "4 equal sides") },
    { left: word("rectangle", "Rectangle"), right: word("longshort", "2 long and 2 short sides") },
    { left: word("pentagon", "Pentagon"), right: word("five", "5 sides") },
    { left: word("hexagon", "Hexagon"), right: word("six", "6 sides") },
    { left: word("octagon", "Octagon"), right: word("eight", "8 sides") },
    { left: word("circle", "Circle"), right: word("none", "No straight sides") },
  ],
};

// PICK (list) — full-width rows for sentences (≤ 60 characters each). A
// "which sentence is true?" pick is a good way to check facts; every false
// row must be plainly false, never a trick.
const SHP_TRUE: KitTemplate = {
  kind: "pick", id: "shp-true", prompt: "Which sentence is true?", layout: "list",
  explain: "Count the sides and corners to check.",
  right: [
    word("t1", "A triangle has 3 sides"), word("t2", "A square has 4 corners"),
    word("t3", "A circle has no corners"), word("t4", "All 4 sides of a square are the same"),
  ],
  wrong: [
    word("f1", "A circle has 4 corners"), word("f2", "A triangle has 5 sides"), word("f3", "A square has 3 sides"),
    word("f4", "A triangle is round"), word("f5", "A square has no corners"), word("f6", "A circle has 2 sides"),
  ],
};

// BUILD — tap the word tiles into a sentence (3–7 words, tiles ≤ 14 letters).
// Every real word must be used, so write sentences with ONE natural word order,
// and decoys that cannot make a second sensible sentence (verbs that do not
// fit work well). Write ≥ 6 sentences. A hero card may sit above the line.
const SHP_SAY: KitTemplate = {
  kind: "build", id: "shp-say", prompt: "Build the sentence",
  explain: "First say the shape. Then say what it has.",
  hero: pic("shapes", "Shapes", "triangle"),
  sentences: [
    { words: ["A", "triangle", "has", "three", "sides"], decoys: ["sleeps", "under"] },
    { words: ["A", "square", "has", "four", "corners"], decoys: ["jumps", "eats"] },
    { words: ["A", "circle", "is", "round"], decoys: ["sings", "runs"] },
    { words: ["My", "book", "has", "four", "corners"], decoys: ["swims", "eats"] },
    { words: ["A", "circle", "has", "no", "corners"], decoys: ["sleeps", "jumps"] },
    { words: ["A", "ball", "can", "roll"], decoys: ["sings", "under"] },
    { words: ["A", "wheel", "is", "round"], decoys: ["sings", "jumps"] },
    { words: ["A", "triangle", "has", "three", "corners"], decoys: ["swims", "runs"] },
  ],
};

// ============================================================= UNIT 2: PATTERNS

// SORT with words: rows that repeat vs rows that do not. Each "no pattern" row
// was checked: no part of 1, 2 or 3 items repeats in it.
const PAT_REPEATS: KitTemplate = {
  kind: "sort", id: "pat-repeats", prompt: "Does it repeat?",
  explain: "A pattern repeats the same part again and again.",
  buckets: [
    {
      bucket: word("yes", "Repeats"),
      items: [word("r1", "A B A B A B"), word("r2", "1 2 1 2 1 2"), word("r3", "big small big small"), word("r4", "C C D C C D"), word("r5", "1 2 3 1 2 3")],
    },
    {
      bucket: word("no", "No pattern"),
      items: [word("n1", "A B B A B A A"), word("n2", "1 1 2 1 2 2"), word("n3", "big big small big"), word("n4", "C D D C C C D"), word("n5", "3 1 2 2 3 1 1")],
    },
  ],
};

// PAIRS with words: a pattern and what comes next. Every "next" is different,
// so each left card has exactly one partner, even with a decoy on the board.
const PAT_NEXT: KitTemplate = {
  kind: "pairs", id: "pat-next", prompt: "What comes next?",
  explain: "Say the pattern out loud. What part comes again?",
  pairs: [
    { left: word("ab", "A B A B A"), right: word("b", "B") },
    { left: word("123", "1 2 3 1 2"), right: word("three", "3") },
    { left: word("ud", "up down up down up"), right: word("down", "down") },
    { left: word("rb", "red blue red blue"), right: word("red", "red") },
    { left: word("bs", "big small big small big"), right: word("small", "small") },
    { left: word("fives", "5 10 15 20"), right: word("twentyfive", "25") },
    { left: word("tens", "10 20 30 40"), right: word("fifty", "50") },
  ],
};

// ORDER — every sequence is written in the RIGHT order. The planner shows 3–5
// steps of one sequence (keeping their order), so every subset must still have
// one obvious order: numbers from small to big always do. Give ≥ 3 sequences,
// or one of ≥ 6 steps. Ids must be unique across ALL sequences of the template.
const jumps = (tag: string, values: number[]): KitItem[] => values.map((n) => word(`${tag}${n}`, String(n)));
const PAT_JUMPS: KitTemplate = {
  kind: "order", id: "pat-jumps", prompt: "Put the numbers from smallest to biggest",
  explain: "Count in jumps. Each jump adds the same amount.",
  sequences: [
    jumps("two-", [2, 4, 6, 8, 10, 12]),
    jumps("five-", [5, 10, 15, 20, 25, 30]),
    jumps("ten-", [10, 20, 30, 40, 50, 60]),
    jumps("three-", [3, 6, 9, 12, 15, 18]),
  ],
};

// NUMBER — count the pictures, type the number. `items` are drawn above the pad
// (picture-only icons are perfect here); `caption` is an optional line under
// them. Write ≥ 6 variants with different answers. Keep counts ≤ 12 so they fit.
const many = (count: number, icon: IconName): KitItem[] => Array.from({ length: count }, (_, i) => only(`${icon}${i}`, icon));
const PAT_COUNT: KitTemplate = {
  kind: "number", id: "pat-count", prompt: "How many are there?",
  explain: "Count in twos: 2, 4, 6, 8. Or one by one.",
  variants: [
    { items: many(4, "star"), answer: 4, caption: "Count the stars in twos" },
    { items: many(6, "apple"), answer: 6, caption: "Count the apples in twos" },
    { items: many(8, "ball"), answer: 8, caption: "Count the balls in twos" },
    { items: many(10, "flower"), answer: 10, caption: "Count the flowers in twos" },
    { items: many(12, "star"), answer: 12, caption: "Count the stars in twos" },
    { items: many(3, "circle"), answer: 3, caption: "Count the circles" },
    { items: many(5, "triangle"), answer: 5, caption: "Count the triangles" },
    { items: many(7, "square"), answer: 7, caption: "Count the squares" },
  ],
};

// PICK (list) with words again — reviewing the idea in a new form.
const PAT_ROW: KitTemplate = {
  kind: "pick", id: "pat-row", prompt: "Which row is a pattern?", layout: "list",
  explain: "Find the part that comes again and again.",
  right: [
    word("p1", "star moon star moon star moon"), word("p2", "1 1 2 1 1 2"),
    word("p3", "clap stamp clap stamp"), word("p4", "X Y Z X Y Z"),
  ],
  wrong: [
    word("q1", "star moon moon star star"), word("q2", "1 2 2 1 2 1 1"), word("q3", "clap clap stamp clap"),
    word("q4", "X Z Y Y X Z"), word("q5", "moon star star star moon"), word("q6", "2 1 1 2 2 2 1"),
  ],
};

/** Every template of the course (lessons pick them by id). */
const BANK: KitTemplate[] = [SHP_ROUND, SHP_CORNERS, SHP_SIDES, SHP_TRUE, SHP_SAY, PAT_REPEATS, PAT_NEXT, PAT_JUMPS, PAT_COUNT, PAT_ROW];

// ======================================================================= UNITS
// A unit teaches ONE idea in 3–5 lessons; the LAST lesson is its champion
// lesson (10 questions; others have 8). A lesson lists 2–5 bank ids; templates
// of earlier lessons come back by themselves as spaced review. Give the first
// lesson of every new idea `intro` slides (1–4): teach first, then ask.
// Slide rules: title ≤ 5 words, 1–2 lines of ≤ 9 words, optional `art`
// (an icon or a clock in a big badge; no art = Pogo presents alone).
// Unit and souvenir icons are `iconRef("name")` strings — never emoji.
const UNITS: KitUnitSeed[] = [
  {
    name: "Shape Spotters", icon: iconRef("triangle"), hue: "#6ea8ff", blurb: "Find the shapes all around you!",
    souvenir: { icon: iconRef("medal"), name: "Shape Medal" },
    lessons: [
      {
        name: "Round or Not",
        templates: ["shp-round", "shp-corners"],
        intro: [
          { art: { kind: "icon", name: "circle" }, title: "Meet the circle", lines: ["It is round all the way.", "It has no corners."] },
          { art: { kind: "icon", name: "square" }, title: "Meet the square", lines: ["It has 4 straight sides.", "It has 4 corners."] },
        ],
      },
      {
        name: "Count the Sides",
        templates: ["shp-sides", "shp-true"],
        intro: [
          { art: { kind: "icon", name: "triangle" }, title: "Meet the triangle", lines: ["It has 3 sides.", "It has 3 corners."] },
          { title: "Count the sides", lines: ["Touch each straight side.", "Count them: one, two, three…"] },
        ],
      },
      { name: "Shape Champion", templates: ["shp-say", "shp-sides", "shp-round"] },
    ],
  },
  {
    name: "Pattern Makers", icon: iconRef("loop"), hue: "#5fd68b", blurb: "Spot what comes again!",
    souvenir: { icon: iconRef("star"), name: "Pattern Star" },
    lessons: [
      {
        name: "What Repeats?",
        templates: ["pat-repeats", "pat-next"],
        intro: [
          { art: { kind: "icon", name: "loop" }, title: "A pattern repeats", lines: ["Red, blue, red, blue…", "The same part again and again."] },
        ],
      },
      {
        name: "Count in Jumps",
        templates: ["pat-jumps", "pat-count"],
        intro: [
          { art: { kind: "icon", name: "star" }, title: "Jump by twos", lines: ["2, 4, 6, 8…", "Each jump adds 2."] },
        ],
      },
      { name: "Pattern Champion", templates: ["pat-row", "pat-jumps", "pat-next", "shp-say"] },
    ],
  },
];

// ====================================================================== COURSE
// `id` is short and PERMANENT (stage ids become `<id>-u01-l1`; saves store
// them). After a course ships, only APPEND units and lessons. `worldId` must
// not clash with an existing world. `icon` is an `iconRef`, like the units'.
export const TEMPLATE_COURSE = defineKitCourse({
  id: "shapes-demo",
  worldId: "shapes-demo",
  title: "Shapes and Patterns",
  icon: iconRef("diamond"),
  tagline: "Find shapes and patterns with Pogo!",
  path: "/shapes-demo",
  hue: "#b794ff",
  subject: "think",
  units: UNITS,
  bank: BANK,
});
