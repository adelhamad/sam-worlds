// Potion Lab — first chemistry, hands-on and visual: solid/liquid/gas,
// melting & freezing, dissolving, what things are made of, kitchen science.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

type State = "solid" | "liquid" | "gas";
// [emoji, name, state]
const STATES: Array<[string, string, State]> = [
  ["🧊", "ice cube", "solid"], ["💧", "water drop", "liquid"], ["💨", "puff of air", "gas"],
  ["🪨", "rock", "solid"], ["🥛", "milk", "liquid"], ["🫖", "steam from the kettle", "gas"],
  ["🍯", "honey", "liquid"], ["🧱", "brick", "solid"], ["🎈", "air inside a balloon", "gas"],
  ["🧃", "juice", "liquid"], ["🥄", "spoon", "solid"], ["🛢️", "oil", "liquid"],
  ["🍬", "candy", "solid"], ["🌬️", "wind", "gas"], ["🫧", "soap bubble's air", "gas"],
];

// [scenario, result, wrongs]
const CHANGES: Array<[string, string, string[]]> = [
  ["Warm an ice cube 🧊 in your hand. It…", "melts into water", ["freezes harder", "turns to dust", "grows bigger"]],
  ["Put water in the freezer. It…", "freezes into ice", ["boils", "disappears", "turns to honey"]],
  ["Boil water in a pot 🍲. It rises as…", "steam", ["snow", "smoke from fire", "dust"]],
  ["Steam touches a cold mirror 🪞. It becomes…", "little water drops", ["ice instantly", "nothing", "glass"]],
  ["Chocolate 🍫 in the warm sun…", "melts and goes soft", ["freezes", "pops", "turns white"]],
  ["Butter 🧈 lands in a hot pan…", "melts into liquid", ["gets harder", "bounces", "turns to steam at once"]],
  ["Juice in the freezer becomes…", "an ice pop", ["warm juice", "steam", "jelly"]],
  ["A puddle on a hot sunny day slowly…", "dries up into the air", ["gets deeper", "freezes", "turns to milk"]],
  ["Wet hair + hair dryer 💨 = …", "dry hair — the water flies into the air", ["wetter hair", "frozen hair", "colored hair"]],
  ["A candle 🕯️ burns. The wax near the flame…", "melts and drips", ["freezes", "jumps", "stays rock hard"]],
  ["A snowman ⛄ on a warm day…", "melts into a puddle", ["grows taller", "freezes harder", "walks away"]],
  ["Melting and freezing change HOW it looks, but ice and water are both…", "the same stuff — water", ["different stuff", "metal", "air"]],
];

// [emoji, name, dissolves?]
const DISSOLVE: Array<[string, string, boolean]> = [
  ["🍬", "sugar", true], ["🧂", "salt", true], ["🍫", "cocoa powder", true],
  ["🏖️", "sand", false], ["🪨", "pebbles", false], ["🥄", "a metal spoon", false],
  ["🧈", "oil drops", false], ["✨", "glitter", false],
];

// [emoji, thing, material]
const MATERIALS: Array<[string, string, string]> = [
  ["🪟", "window", "glass"], ["🥄", "spoon", "metal"], ["🪑", "chair", "wood"],
  ["📖", "book pages", "paper"], ["🧸", "teddy bear", "cloth"], ["🛞", "tire", "rubber"],
  ["🥤", "straw cup", "plastic"], ["🔑", "key", "metal"], ["📦", "box", "paper"],
  ["👕", "t-shirt", "cloth"], ["🍾", "bottle", "glass"], ["✏️", "pencil body", "wood"],
  ["🎈", "balloon", "rubber"], ["🧱", "toy blocks", "plastic"],
];
const MATERIAL_NAMES = [...new Set(MATERIALS.map(([, , m]) => m))];

// [question, answer, wrongs] — kitchen science + lab rules
const MIX: Array<[string, string, string[]]> = [
  ["Vinegar + baking soda = ?", "fizzy bubbles everywhere! 🫧", ["nothing at all", "ice", "glue"]],
  ["Stir flour + water = ?", "sticky dough", ["fizzy drink", "clear water", "sand"]],
  ["Oil poured into water…", "floats on top — they don't mix", ["vanishes", "sinks to the bottom", "turns to soup"]],
  ["Shake a fizzy drink 🥤 and open it…", "bubbles whoosh out!", ["it freezes", "nothing happens", "it turns to juice"]],
  ["The bubbles in fizzy drinks are…", "a gas hiding in the liquid", ["tiny rocks", "soap", "fish breath"]],
  ["Milk left warm too long…", "goes sour — don't drink it", ["gets tastier", "turns to cheese instantly", "freezes"]],
  ["A real scientist protects their eyes with…", "goggles 🥽", ["sunglasses at night", "closed eyes", "a hat"]],
  ["You find a mystery bottle. Do you taste it?", "NEVER — ask a grown-up", ["one tiny sip", "yes, if it smells nice", "yes, if it's pretty"]],
  ["Mixing real potions is only for…", "doing with a grown-up", ["doing alone in secret", "midnight", "pets"]],
];

export interface ChemistryParams {
  types: Array<"state" | "change" | "dissolve" | "material" | "mix">;
}

let qid = 0;
const id = () => `ch${++qid}`;

export function generateChemistry(params: ChemistryParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "change":
      return genTable(rng, CHANGES, "chg", "Have you seen it happen at home?");
    case "dissolve":
      return genDissolve(rng);
    case "material":
      return genMaterial(rng);
    case "mix":
      return genTable(rng, MIX, "mix", "Picture it in the kitchen.");
    default:
      return genState(rng);
  }
}

function genState(rng: RNG): Question {
  const [emoji, name, state] = pick(rng, STATES);
  return {
    id: id(),
    prompt: `Is the ${name} solid, liquid, or gas?`,
    answer: state,
    choices: ["solid", "liquid", "gas"],
    hint: "Solid keeps its shape. Liquid pours. Gas floats everywhere.",
    inputMode: "choices",
    dedupeKey: `state-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genDissolve(rng: RNG): Question {
  const [emoji, name, dissolves] = pick(rng, DISSOLVE);
  return {
    id: id(),
    prompt: `Stir ${name} into water — does it vanish into the water?`,
    answer: dissolves ? "✨ yes, it dissolves" : "🙅 no, you still see it",
    choices: shuffle(rng, ["✨ yes, it dissolves", "🙅 no, you still see it"]),
    hint: "Tiny grains that hide in water = dissolving.",
    inputMode: "choices",
    dedupeKey: `dis-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genMaterial(rng: RNG): Question {
  const [emoji, thing, material] = pick(rng, MATERIALS);
  const wrong = shuffle(rng, MATERIAL_NAMES.filter((m) => m !== material)).slice(0, 3);
  return {
    id: id(),
    prompt: `What is the ${thing} made of?`,
    answer: material,
    choices: shuffle(rng, [material, ...wrong]),
    hint: "Knock on it in your head — what would it feel like?",
    inputMode: "choices",
    dedupeKey: `mat-${thing}`,
    payload: { bigSymbol: emoji },
  };
}

function genTable(rng: RNG, pool: Array<[string, string, string[]]>, key: string, hint: string): Question {
  const [prompt, answer, wrong] = pick(rng, pool);
  return {
    id: id(),
    prompt,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint,
    inputMode: "choices",
    dedupeKey: `${key}-${prompt}`,
  };
}
