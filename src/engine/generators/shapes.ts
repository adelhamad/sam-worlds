// Shape Studio — Grade 1–2 geometry (US Common Core 1.G / 2.G): naming 2D & 3D
// shapes and their sides/corners/faces, equal parts & simple fractions (halves,
// thirds, fourths), and partitioning into rows & columns (arrays → repeated
// addition, 2.G.2 / 2.OA.4). Counts are typed; "name the shape / part" are true
// matching questions.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const SHAPES_2D = [
  { name: "triangle", sides: 3, emoji: "🔺" },
  { name: "square", sides: 4, emoji: "🟥" },
  { name: "rectangle", sides: 4, emoji: "▬" },
  { name: "pentagon", sides: 5, emoji: "⬠" },
  { name: "hexagon", sides: 6, emoji: "⬡" },
  { name: "octagon", sides: 8, emoji: "🛑" },
  { name: "circle", sides: 0, emoji: "⭕" },
];
const SHAPES_3D = [
  { name: "cube", faces: 6, like: "a dice" },
  { name: "sphere", faces: 0, like: "a ball" },
  { name: "cone", faces: 2, like: "a party hat" },
  { name: "cylinder", faces: 3, like: "a can" },
  { name: "pyramid", faces: 5, like: "a tent" },
  { name: "rectangular prism", faces: 6, like: "a box" },
  { name: "triangular prism", faces: 5, like: "a tent roof" },
];
const FRACTIONS = [
  { parts: 2, one: "half", many: "halves" },
  { parts: 3, one: "third", many: "thirds" },
  { parts: 4, one: "fourth", many: "fourths" },
  { parts: 5, one: "fifth", many: "fifths" },
  { parts: 6, one: "sixth", many: "sixths" },
  { parts: 8, one: "eighth", many: "eighths" },
  { parts: 10, one: "tenth", many: "tenths" },
];
const FOODS = ["🍕", "🍪", "🍫", "🥧", "🧇", "🍊", "🍉", "🥪", "🥯"];

export type ShapeType =
  | "sides" // "How many sides does a hexagon have?"
  | "corners" // "How many corners does a square have?"
  | "nameShape" // "Which shape has 3 sides?"
  | "shape3d" // "How many faces does a cube have?" / "A ball is a ___?"
  | "fractionName" // "A whole cut in 4 equal parts — each is one ___?"
  | "fractionCount" // "How many fourths make a whole?"
  | "fractionLeft" // "Pizza in 4, eat 1 — parts left?"
  | "array"; // "3 rows of 4 = ?"

export interface ShapeParams {
  types: ShapeType[];
}

let qid = 0;
const id = () => `sh${++qid}`;

export function generateShapes(params: ShapeParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "corners":
      return genCorners(rng);
    case "nameShape":
      return genNameShape(rng);
    case "shape3d":
      return genShape3d(rng);
    case "fractionName":
      return genFractionName(rng);
    case "fractionCount":
      return genFractionCount(rng);
    case "fractionLeft":
      return genFractionLeft(rng);
    case "array":
      return genArray(rng, ctx);
    default:
      return genSides(rng);
  }
}

/** "How many sides does a hexagon have?" */
function genSides(rng: RNG): Question {
  const s = pick(rng, SHAPES_2D.filter((x) => x.sides > 0));
  return {
    id: id(),
    prompt: `How many sides\ndoes a ${s.name} have?`,
    answer: String(s.sides),
    choices: [],
    hint: `Trace each straight edge of the ${s.name} and count.`,
    dedupeKey: `sd-${s.name}`,
  };
}

/** "How many corners does a square have?" (corners = vertices = sides for these) */
function genCorners(rng: RNG): Question {
  const s = pick(rng, SHAPES_2D.filter((x) => x.sides > 0));
  return {
    id: id(),
    prompt: `How many corners\ndoes a ${s.name} have?`,
    answer: String(s.sides),
    choices: [],
    hint: `A ${s.name} has the same number of corners as sides.`,
    dedupeKey: `co-${s.name}`,
  };
}

/** "Which shape has 3 sides?" */
function genNameShape(rng: RNG): Question {
  const s = pick(rng, SHAPES_2D.filter((x) => x.sides > 0));
  const others = shuffle(rng, SHAPES_2D.filter((x) => x.name !== s.name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which shape\nhas ${s.sides} sides?`,
    answer: s.name,
    choices: shuffle(rng, [s.name, ...others.map((o) => o.name)]),
    inputMode: "choices",
    hint: `Triangle 3, square & rectangle 4, pentagon 5, hexagon 6.`,
    dedupeKey: `ns-${s.name}`,
  };
}

/** "How many faces does a cube have?"  or  "A ball is shaped like a ___?" */
function genShape3d(rng: RNG): Question {
  const s = pick(rng, SHAPES_3D);
  if (s.faces > 0 && rng() < 0.5) {
    return {
      id: id(),
      prompt: `How many flat faces\ndoes a ${s.name} have?`,
      answer: String(s.faces),
      choices: [],
      hint: `Think of ${s.like} — count its flat sides.`,
      dedupeKey: `3f-${s.name}`,
    };
  }
  const others = shuffle(rng, SHAPES_3D.filter((x) => x.name !== s.name)).slice(0, 3);
  return {
    id: id(),
    prompt: `${s.like[0].toUpperCase() + s.like.slice(1)}\nis shaped like a ___?`,
    answer: s.name,
    choices: shuffle(rng, [s.name, ...others.map((o) => o.name)]),
    inputMode: "choices",
    hint: `Cube = dice, sphere = ball, cone = party hat, cylinder = can.`,
    dedupeKey: `3n-${s.name}`,
  };
}

/** "A whole cut into 4 equal parts — each is one ___?" */
function genFractionName(rng: RNG): Question {
  const f = pick(rng, FRACTIONS);
  const food = pick(rng, FOODS);
  const others = shuffle(rng, FRACTIONS.filter((x) => x.one !== f.one)).slice(0, 3);
  return {
    id: id(),
    prompt: `${food} cut into ${f.parts} equal parts.\nEach part is one ___?`,
    answer: f.one,
    choices: shuffle(rng, [f.one, ...others.map((o) => o.one)]),
    inputMode: "choices",
    hint: `2 parts → halves, 3 → thirds, 4 → fourths — the name matches the count.`,
    dedupeKey: `fn-${f.parts}`,
  };
}

/** "How many fourths make a whole?" */
function genFractionCount(rng: RNG): Question {
  const f = pick(rng, FRACTIONS);
  return {
    id: id(),
    prompt: `How many ${f.many}\nmake a whole?`,
    answer: String(f.parts),
    choices: [],
    hint: `It takes ${f.parts} equal ${f.many} to fill one whole.`,
    dedupeKey: `fc-${f.parts}`,
  };
}

/** "Pizza cut in 4, you eat 1 — how many parts left?" */
function genFractionLeft(rng: RNG): Question {
  const f = pick(rng, FRACTIONS);
  const food = pick(rng, FOODS);
  const eaten = randInt(rng, 1, f.parts - 1);
  return {
    id: id(),
    prompt: `${food} cut into ${f.parts}.\nYou eat ${eaten}. Parts left?`,
    answer: String(f.parts - eaten),
    choices: [],
    hint: `${f.parts} parts take away ${eaten}.`,
    dedupeKey: `fl-${f.parts}-${eaten}`,
  };
}

/** "3 rows of 4 = ?" — partition into rows & columns (repeated addition). */
function genArray(rng: RNG, ctx: GenContext): Question {
  const rows = randInt(rng, 2, ctx.easier ? 3 : 6);
  const cols = randInt(rng, 2, ctx.easier ? 4 : 6);
  return {
    id: id(),
    prompt: `${rows} rows of ${cols} dots.\nHow many dots?`,
    answer: String(rows * cols),
    choices: [],
    hint: `Add ${cols} a total of ${rows} times: ${Array(rows).fill(cols).join(" + ")}.`,
    dedupeKey: `ar-${rows}-${cols}`,
  };
}
