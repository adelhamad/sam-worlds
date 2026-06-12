// Craft Caverns — Minecraft KNOWLEDGE, all visual: mobs and what they do,
// tools for jobs, reading crafting grids, mob/block drops, and where things
// live in the world. No math here — Number Forge owns numbers.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, what it does]
const MOBS: Array<[string, string, string]> = [
  ["🟩", "Creeper", "sneaks up and explodes 💥"],
  ["💀", "Skeleton", "shoots arrows from far away"],
  ["🧟", "Zombie", "burns in the morning sun"],
  ["🕷️", "Spider", "climbs straight up walls"],
  ["👁️", "Enderman", "teleports away when you look at it"],
  ["🧙", "Witch", "throws splash potions"],
  ["🔥", "Blaze", "shoots fireballs in the Nether"],
  ["🟢", "Slime", "splits into smaller slimes when hit"],
  ["👨‍🌾", "Villager", "trades goodies for emeralds"],
  ["🐷", "Piglin", "loves gold more than anything"],
  ["🐡", "Guardian", "guards the ocean temple"],
  ["🐉", "Ender Dragon", "rules the End"],
  ["👻", "Ghast", "cries and shoots fireballs"],
  ["🦇", "Bat", "hangs in dark caves"],
];

// [job, tool]
const TOOLS: Array<[string, string]> = [
  ["chop wood fastest", "🪓 axe"],
  ["mine stone fastest", "⛏️ pickaxe"],
  ["dig dirt and sand fastest", "🦯 shovel"],
  ["fight off mobs", "🗡️ sword"],
  ["catch fish", "🎣 fishing rod"],
  ["shear a sheep's wool", "✂️ shears"],
  ["till soil into farmland", "🌾 hoe"],
  ["light the Nether portal", "🔥 flint and steel"],
];
const TOOL_NAMES = [...new Set(TOOLS.map(([, t]) => t))];

// [what you want, the key thing you need]
const NEEDS: Array<[string, string]> = [
  ["bake bread 🍞", "🌾 wheat"],
  ["craft a torch 🔦", "⚫ coal on a stick"],
  ["make glass 🪟", "🏖️ smelted sand"],
  ["craft a bed 🛏️", "🐑 wool"],
  ["tame a wolf 🐺", "🦴 a bone"],
  ["build a snow golem ⛄", "🎃 a pumpkin head"],
  ["brew potions 🧪", "💧 water bottles"],
  ["enter the Nether 🌋", "🟪 an obsidian portal"],
];
const NEED_NAMES = [...new Set(NEEDS.map(([, x]) => x))];

// [grid rows, crafted item, hint]
const RECIPES: Array<[string[], string, string]> = [
  [["⚫", "🪵"], "🔦 torch", "Coal on a stick lights the night."],
  [["🪨", "🪨", "🪵"], "🗡️ stone sword", "Two sharp blocks on a handle."],
  [["🪨🪨🪨", "⬜🪵⬜", "⬜🪵⬜"], "⛏️ pickaxe", "A wide top on a long handle."],
  [["🪵⬜🪵", "🪵🪵🪵", "🪵⬜🪵"], "🪜 ladder", "Sticks shaped like an H."],
  [["🟫🟫", "🟫🟫"], "🛠️ crafting table", "Four planks make the maker."],
  [["🪨🪨🪨", "🪨⬜🪨", "🪨🪨🪨"], "🔥 furnace", "A stone ring with a hole for fire."],
  [["🟫🟫🟫", "🟫⬜🟫", "🟫🟫🟫"], "📦 chest", "A plank ring with room inside."],
  [["🟥🟥🟥", "🟫🟫🟫"], "🛏️ bed", "Wool on top, planks below."],
  [["🟫🟫", "🟫🟫", "🟫🟫"], "🚪 door", "Six planks standing tall."],
  [["🟫🟫🟫", "📕📕📕", "🟫🟫🟫"], "📚 bookshelf", "Books hiding between planks."],
  [["⬜🎃⬜", "⬜☃️⬜", "⬜☃️⬜"], "⛄ snow golem", "A pumpkin head on snow."],
  [["🪵", "🪵"], "🥢 sticks", "Planks stacked make sticks."],
];
const RECIPE_NAMES = [...new Set(RECIPES.map(([, r]) => r))];

// [emoji, source, drop]
const DROPS: Array<[string, string, string]> = [
  ["🐔", "chicken", "🥚 eggs"],
  ["🐄", "cow", "🥛 milk (with a bucket)"],
  ["🐑", "sheep", "🧶 wool"],
  ["🕷️", "spider", "🕸️ string"],
  ["💀", "skeleton", "🦴 bones"],
  ["🟩", "creeper", "💥 gunpowder"],
  ["🌳", "oak tree", "🪵 wood and sometimes 🍎"],
  ["🐷", "pig", "🥓 porkchops"],
  ["⬛", "coal ore", "⚫ coal"],
  ["💎", "diamond ore", "💎 diamonds"],
  ["🎋", "sugar cane", "📜 paper (after crafting)"],
  ["🧟", "zombie", "🥩 rotten flesh — don't eat it!"],
];
const DROP_NAMES = [...new Set(DROPS.map(([, , d]) => d))];

// [emoji, thing, where it's found]
const WHERE: Array<[string, string, string]> = [
  ["💎", "diamonds", "deep underground, near bedrock"],
  ["🌵", "cactus", "in the desert"],
  ["🎋", "sugar cane", "right next to water"],
  ["🍉", "melons", "in the jungle"],
  ["🐺", "wolves", "in the forest"],
  ["🔥", "Blazes", "in a Nether fortress"],
  ["🐉", "the Ender Dragon", "in the End"],
  ["🐻‍❄️", "polar bears", "in the snowy biome"],
  ["🏜️", "sandy temples", "in the desert"],
  ["🌋", "oceans of lava", "in the Nether"],
  ["🐡", "Guardians", "in the ocean temple"],
  ["🍄", "giant mushrooms", "on the mushroom island"],
];
const WHERE_NAMES = [...new Set(WHERE.map(([, , w]) => w))];

export interface CraftParams {
  types: Array<"mob" | "tool" | "need" | "recipe" | "drop" | "where">;
}

let qid = 0;
const id = () => `cc${++qid}`;

export function generateCraft(params: CraftParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "tool":
      return genTool(rng);
    case "need":
      return genNeed(rng);
    case "recipe":
      return genRecipe(rng);
    case "drop":
      return genDrop(rng);
    case "where":
      return genWhere(rng);
    default:
      return genMob(rng);
  }
}

function genMob(rng: RNG): Question {
  const [emoji, name, does] = pick(rng, MOBS);
  const askByDeed = rng() < 0.5;
  if (askByDeed) {
    const wrong = shuffle(rng, MOBS.filter((m) => m[1] !== name)).slice(0, 3);
    return {
      id: id(),
      prompt: `Which mob ${does}?`,
      answer: `${emoji} ${name}`,
      choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
      hint: "Think of your last adventure…",
      inputMode: "choices",
      dedupeKey: `mob-deed-${name}`,
    };
  }
  const wrong = shuffle(rng, MOBS.filter((m) => m[2] !== does)).slice(0, 3);
  return {
    id: id(),
    prompt: `What does the ${name} do?`,
    answer: does,
    choices: shuffle(rng, [does, ...wrong.map(([, , d]) => d)]),
    hint: "Picture meeting it at night…",
    inputMode: "choices",
    dedupeKey: `mob-does-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genTool(rng: RNG): Question {
  const [job, tool] = pick(rng, TOOLS);
  const wrong = shuffle(rng, TOOL_NAMES.filter((t) => t !== tool)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which tool helps you ${job}?`,
    answer: tool,
    choices: shuffle(rng, [tool, ...wrong]),
    hint: "Picture yourself holding it…",
    inputMode: "choices",
    dedupeKey: `tool-${job}`,
  };
}

function genNeed(rng: RNG): Question {
  const [goal, need] = pick(rng, NEEDS);
  const wrong = shuffle(rng, NEED_NAMES.filter((x) => x !== need)).slice(0, 3);
  return {
    id: id(),
    prompt: `To ${goal} you need…?`,
    answer: need,
    choices: shuffle(rng, [need, ...wrong]),
    hint: "Think of your crafting table!",
    inputMode: "choices",
    dedupeKey: `need-${goal}`,
  };
}

/** Read a crafting-grid picture — what does it make? */
function genRecipe(rng: RNG): Question {
  const [rows, item, hint] = pick(rng, RECIPES);
  const wrong = shuffle(rng, RECIPE_NAMES.filter((r) => r !== item)).slice(0, 3);
  return {
    id: id(),
    prompt: "What does this recipe craft?",
    answer: item,
    choices: shuffle(rng, [item, ...wrong]),
    hint,
    inputMode: "choices",
    dedupeKey: `recipe-${item}`,
    payload: { gridRows: rows },
  };
}

function genDrop(rng: RNG): Question {
  const [emoji, source, drop] = pick(rng, DROPS);
  const wrong = shuffle(rng, DROP_NAMES.filter((d) => d !== drop)).slice(0, 3);
  return {
    id: id(),
    prompt: `What do you get from the ${source}?`,
    answer: drop,
    choices: shuffle(rng, [drop, ...wrong]),
    hint: "What would it leave behind?",
    inputMode: "choices",
    dedupeKey: `drop-${source}`,
    payload: { bigSymbol: emoji },
  };
}

function genWhere(rng: RNG): Question {
  const [emoji, thing, place] = pick(rng, WHERE);
  const wrong = shuffle(rng, WHERE_NAMES.filter((w) => w !== place)).slice(0, 3);
  return {
    id: id(),
    prompt: `Where do you find ${thing}?`,
    answer: place,
    choices: shuffle(rng, [place, ...wrong]),
    hint: "Picture the biome around it…",
    inputMode: "choices",
    dedupeKey: `where-${thing}`,
    payload: { bigSymbol: emoji },
  };
}
