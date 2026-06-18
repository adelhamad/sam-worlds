// Preposition Park — English prepositions taught VISUALLY: emoji scenes
// (the cat really is on the box), fill-in sentences, and opposites.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const GAP = "　"; // fullwidth space keeps emoji scenes aligned

const ACTORS = ["🐱", "🐶", "🐸", "⚽", "🧸", "🤖"];
const FLYERS = ["🐦", "🦋", "🪁", "🚁"];
const BASES = ["📦", "🪑", "🛏️", "🪨", "🧺"];

type Prep = "on" | "under" | "next to" | "between" | "above";
const PREPS: Prep[] = ["on", "under", "next to", "between", "above"];
// visually too close to be fair distractors for each other
const PREP_CONFLICTS: Record<string, string[]> = { on: ["above"], above: ["on"] };

function sceneRows(prep: Prep, actor: string, base: string): string[] {
  switch (prep) {
    case "on":
      return [actor, base];
    case "under":
      return [base, actor];
    case "next to":
      return [`${actor}${GAP}${base}`];
    case "between":
      return [`${base}${GAP}${actor}${GAP}${base}`];
    case "above":
      return [actor, GAP, base];
  }
}

// [sentence with ___, answer, curated wrong choices]
const SENTENCES: Array<[string, string, string[]]> = [
  ["The juice is ___ the cup.", "in", ["on", "under", "next to"]],
  ["You sleep ___ a warm blanket.", "under", ["on", "next to", "between"]],
  ["The cherry goes ___ the cake.", "on", ["under", "between", "in"]],
  ["The moon is high ___ us.", "above", ["under", "between", "in"]],
  ["Walk ___ me — hold my hand.", "next to", ["under", "in", "through"]],
  ["Jump ___ the puddle, stay dry!", "over", ["in", "under", "next to"]],
  ["The train goes ___ the tunnel.", "through", ["on", "next to", "above"]],
  ["Hide ___ the curtain!", "behind", ["on", "above", "next to"]],
  ["Put your shoes ___ the bed, not on it!", "under", ["in", "above", "between"]],
  ["The cat sleeps ___ the sofa and the wall.", "between", ["on", "in", "above"]],
  ["An umbrella goes ___ your head.", "over", ["under", "in", "between"]],
  ["The bird built a nest ___ the tree.", "in", ["between", "over", "next to"]],
  ["Park your bike ___ the door.", "next to", ["in", "through", "above"]],
  ["Water flows ___ the bridge.", "under", ["between", "in", "on"]],
  ["The knight rides ___ the castle gate.", "through", ["above", "between", "next to"]],
  ["Your socks are ___ the drawer.", "in", ["on", "under", "behind"]],
  ["Hang the picture ___ the sofa.", "above", ["in", "through", "between"]],
  ["The ball rolled ___ the table.", "under", ["in", "through", "above"]],
  ["Climb ___ the ladder to the slide!", "up", ["under", "between", "through"]],
  ["The dog squeezed ___ the fence hole.", "through", ["on", "above", "between"]],
  ["The cup sits ___ the shelf.", "on", ["in", "under", "through"]],
  ["A fish swims ___ the water.", "in", ["on", "above", "over"]],
  ["The plane flies ___ the clouds.", "above", ["under", "in", "behind"]],
  ["Slide ___ the hill on your sled.", "down", ["up", "in", "between"]],
  ["The mouse ran ___ the chair leg.", "behind", ["on", "above", "in"]],
  ["Tuck the toy ___ the box and the wall.", "between", ["on", "in", "over"]],
  ["The kite soared ___ the rooftops.", "over", ["under", "in", "behind"]],
  ["Crawl ___ the tunnel slide.", "through", ["on", "above", "next to"]],
  ["The lamp stands ___ the desk.", "next to", ["in", "through", "above"]],
  ["Put the milk ___ the fridge.", "in", ["on", "over", "behind"]],
  ["A rainbow arches ___ the hills.", "above", ["under", "in", "through"]],
  ["The cat hid ___ the blanket.", "under", ["on", "above", "next to"]],
  ["Roll the ball ___ the goal.", "into", ["above", "behind", "over"]],
  ["The boat floats ___ the lake.", "on", ["under", "in", "through"]],
  ["Hop ___ the log on the trail.", "over", ["under", "in", "behind"]],
  ["Your coat hangs ___ the hook.", "on", ["in", "under", "through"]],
  ["The squirrel sat ___ the two branches.", "between", ["on", "in", "above"]],
  ["The keys fell ___ the sofa cushions.", "behind", ["on", "above", "over"]],
  ["Step ___ the bus carefully.", "onto", ["under", "behind", "above"]],
];

// [word, opposite]
const OPPOSITES: Array<[string, string]> = [
  ["over", "under"], ["in", "out"], ["above", "below"],
  ["in front of", "behind"], ["up", "down"], ["inside", "outside"],
  ["on", "off"], ["near", "far"], ["top", "bottom"],
  ["left", "right"], ["before", "after"], ["into", "out of"],
  ["toward", "away from"], ["high", "low"],
];
const OPPOSITE_WORDS = OPPOSITES.flat();

export interface PrepositionParams {
  types: Array<"scene" | "sentence" | "opposite">;
  /** Which scene prepositions are in play. */
  preps?: Prep[];
}

let qid = 0;
const id = () => `pp${++qid}`;

export function generatePrepositions(params: PrepositionParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "sentence") return genSentence(rng);
  if (type === "opposite") return genOpposite(rng);
  return genScene(params, rng);
}

/** A real emoji scene — say where the actor is. */
function genScene(params: PrepositionParams, rng: RNG): Question {
  const preps = params.preps ?? PREPS;
  const prep = pick(rng, preps);
  const actor = prep === "above" ? pick(rng, FLYERS) : pick(rng, ACTORS);
  const base = pick(rng, BASES);
  const blocked = [prep, ...(PREP_CONFLICTS[prep] ?? [])];
  const wrong = shuffle(rng, PREPS.filter((p) => !blocked.includes(p))).slice(0, 3);
  return {
    id: id(),
    prompt: `Where is the ${actor}?`,
    answer: phrase(prep, base),
    choices: shuffle(rng, [prep, ...wrong].map((p) => phrase(p, base))),
    hint: "Look at the picture — top, bottom, or side?",
    inputMode: "choices",
    dedupeKey: `scene-${prep}-${actor}-${base}`,
    payload: { gridRows: sceneRows(prep, actor, base) },
  };
}

function phrase(prep: Prep | string, base: string): string {
  return prep === "between" ? `between the ${base}s` : `${prep} the ${base}`;
}

function genSentence(rng: RNG): Question {
  const [text, answer, wrong] = pick(rng, SENTENCES);
  return {
    id: id(),
    prompt: text,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: "Picture it happening — which word fits?",
    inputMode: "choices",
    dedupeKey: `sent-${text}`,
  };
}

function genOpposite(rng: RNG): Question {
  const pair = pick(rng, OPPOSITES);
  const flip = rng() < 0.5;
  const [word, answer] = flip ? [pair[1], pair[0]] : pair;
  const wrong = shuffle(rng, OPPOSITE_WORDS.filter((w) => w !== answer && w !== word)).slice(0, 3);
  return {
    id: id(),
    prompt: `What is the OPPOSITE of "${word}"?`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: "Point one way, then point the other way.",
    inputMode: "choices",
    dedupeKey: `opp-${word}`,
  };
}
