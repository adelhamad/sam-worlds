// Craft Caverns — Minecraft-flavored math: crafting ratios, stacks of 64,
// furnace smelting, block walls (with a visual grid!) and mining coordinates.
import { pick, randInt, shuffle, type RNG } from "../rng";
import { lerp, numericChoices, type GenContext, type Question } from "./types";

const RECIPES: Array<[string, string, number]> = [
  ["log 🪵", "planks 🟫", 4],
  ["plank 🟫", "sticks 🪵", 4],
  ["block of coal ⬛", "coal lumps ⚫", 9],
  ["melon 🍉", "slices 🍉", 9],
  ["iron block ⬜", "ingots 🔩", 9],
  ["sugar cane 🎋", "paper 📜", 3],
];

const MOBS: Array<[string, string]> = [
  ["Which mob 💥 explodes?", "Creeper"],
  ["Which mob 🏹 shoots arrows?", "Skeleton"],
  ["Which mob 🧪 throws potions?", "Witch"],
  ["Which mob 👁️ teleports away?", "Enderman"],
  ["Which mob 🐷 lives in the Nether?", "Piglin"],
  ["Which mob 🕸️ climbs walls?", "Spider"],
];
const MOB_NAMES = [...new Set(MOBS.map(([, m]) => m)), "Zombie", "Sheep", "Villager"];

export interface CraftParams {
  types: Array<"recipe" | "wall" | "stack" | "smelt" | "coords" | "mob">;
  /** Wall/volume size cap per side. */
  maxSide?: number;
  /** 3D volume questions (layers). */
  volume?: boolean;
  /** Coordinate questions may dig below zero ("blocks below zero"). */
  belowZero?: boolean;
}

let qid = 0;
const id = () => `cc${++qid}`;

export function generateCraft(params: CraftParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "wall":
      return genWall(params, rng, ctx);
    case "stack":
      return genStack(rng, ctx);
    case "smelt":
      return genSmelt(rng, ctx);
    case "coords":
      return genCoords(params, rng, ctx);
    case "mob":
      return genMob(rng);
    default:
      return genRecipe(rng, ctx);
  }
}

function genRecipe(rng: RNG, ctx: GenContext): Question {
  const [input, output, ratio] = pick(rng, RECIPES);
  const count = randInt(rng, 2, ctx.easier ? 4 : Math.round(lerp(5, 9, ctx.difficulty)));
  return {
    id: id(),
    prompt: `1 ${input} → ${ratio} ${output}. Craft with ${count}: how many?`,
    answer: String(count * ratio),
    choices: numericChoices(rng, count * ratio, [ratio, count, 1]),
    hint: `${count} groups of ${ratio}. Skip-count: ${ratio}, ${ratio * 2}…`,
  };
}

function genWall(params: CraftParams, rng: RNG, ctx: GenContext): Question {
  const cap = ctx.easier ? 4 : Math.min(params.maxSide ?? 6, Math.round(lerp(4, 8, ctx.difficulty)));
  const w = randInt(rng, 2, cap);
  const h = randInt(rng, 2, Math.min(cap, 5));
  if (params.volume && !ctx.easier && rng() < 0.5) {
    const d = randInt(rng, 2, 4);
    return {
      id: id(),
      prompt: `A wall ${w} wide and ${h} tall — built ${d} layers thick. Total blocks?`,
      answer: String(w * h * d),
      choices: numericChoices(rng, w * h * d, [w, h, d]),
      hint: `One layer is ${w} × ${h} = ${w * h}. Now ${d} layers…`,
      payload: { gridRows: Array.from({ length: h }, () => "🟫".repeat(w)) },
    };
  }
  return {
    id: id(),
    prompt: "How many blocks in this wall?",
    answer: String(w * h),
    choices: numericChoices(rng, w * h, [w, h, 1]),
    hint: `${h} rows of ${w} blocks.`,
    dedupeKey: `wall-${w}x${h}`,
    payload: { gridRows: Array.from({ length: h }, () => "🟫".repeat(w)) },
  };
}

function genStack(rng: RNG, ctx: GenContext): Question {
  const stackSize = ctx.easier ? 10 : pick(rng, [16, 64]);
  const stacks = randInt(rng, 1, ctx.easier ? 2 : 3);
  const loose = randInt(rng, 1, stackSize - 1);
  return {
    id: id(),
    prompt: `A stack holds ${stackSize}. You carry ${stacks} full stack${stacks > 1 ? "s" : ""} + ${loose} more. Total?`,
    answer: String(stacks * stackSize + loose),
    choices: numericChoices(rng, stacks * stackSize + loose, [stackSize, 10, 1]),
    hint: `${stacks} × ${stackSize} first, then add ${loose}.`,
  };
}

function genSmelt(rng: RNG, ctx: GenContext): Question {
  const per = pick(rng, ctx.easier ? [2, 4] : [4, 8]);
  const batches = randInt(rng, 2, ctx.easier ? 4 : 8);
  return {
    id: id(),
    prompt: `1 coal ⚫ smelts ${per} items. How much coal for ${per * batches} items?`,
    answer: String(batches),
    choices: numericChoices(rng, batches, [1, 2, per]),
    hint: `How many ${per}s fit in ${per * batches}?`,
  };
}

function genCoords(params: CraftParams, rng: RNG, ctx: GenContext): Question {
  if (params.belowZero && !ctx.easier && rng() < 0.5) {
    // Minecraft makes negatives concrete: bedrock lives below zero.
    const start = randInt(rng, 3, 12);
    const dig = start + randInt(rng, 1, 8);
    return {
      id: id(),
      prompt: `You stand at height ${start} and dig DOWN ${dig}. How many blocks below zero?`,
      answer: String(dig - start),
      choices: numericChoices(rng, dig - start, [1, 2, start]),
      hint: `First ${start} blocks reach zero. Keep digging…`,
    };
  }
  const start = randInt(rng, 1, ctx.easier ? 10 : 30);
  const move = randInt(rng, 2, ctx.easier ? 10 : 25);
  const east = rng() < 0.6 || start - move < 0;
  return {
    id: id(),
    prompt: east
      ? `You stand at x = ${start} and walk ${move} blocks east (+). New x?`
      : `You stand at x = ${start} and walk ${move} blocks west (−). New x?`,
    answer: String(east ? start + move : start - move),
    choices: numericChoices(rng, east ? start + move : start - move, [1, 2, 10]),
    hint: east ? `East means adding.` : `West means taking away.`,
  };
}

function genMob(rng: RNG): Question {
  const [prompt, answer] = pick(rng, MOBS);
  const wrong = shuffle(rng, MOB_NAMES.filter((m) => m !== answer)).slice(0, 3);
  return {
    id: id(),
    prompt,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: "Think of your last adventure…",
    inputMode: "choices",
  };
}
