// Green Planet — caring for the Earth: recycling, sorting waste, saving water
// and power, and looking after nature. Common-sense, situational matching.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

type QA = [string, string, string[]];

// Which bin? sorting waste
const SORT: QA[] = [
  ["Where does an empty glass bottle go?", "the recycling bin", ["the toilet", "the garden", "out the window"]],
  ["Where does a banana peel go?", "the compost bin", ["the recycling bin", "your pocket", "the road"]],
  ["Where does a clean paper sheet go?", "the recycling bin", ["the fireplace", "the bin for food", "the drain"]],
  ["Where does a plastic bottle go?", "the recycling bin", ["the ocean", "the park", "the bushes"]],
  ["Where do apple cores and veggie scraps go?", "the compost bin", ["the recycling bin", "the sofa", "the river"]],
  ["What can you do with an old jam jar?", "reuse it to hold things", ["throw it in the sea", "smash it on the path", "leave it in the park"]],
];

// Saving water & power
const SAVE: QA[] = [
  ["To save water while brushing your teeth, you…", "turn off the tap", ["let it run", "fill the sink", "splash it around"]],
  ["When you leave a room, you should…", "turn off the lights", ["leave them all on", "turn on more", "open the fridge"]],
  ["To save water in the garden, you can…", "collect rainwater", ["use the hose all day", "leave taps on", "water in the hot sun"]],
  ["A good way to save paper is to…", "use both sides", ["throw it after one line", "scrunch it up", "use a fresh sheet each time"]],
  ["To use less power, you can…", "play outside instead of more screens", ["leave the TV on all night", "open the fridge for fun", "run the fan in an empty room"]],
  ["A short shower instead of a long bath…", "saves water", ["wastes water", "makes no difference", "uses more water"]],
];

// Good vs not-good for the Earth, and caring for nature
const NATURE: QA[] = [
  ["Which is good for the Earth?", "planting a tree", ["dropping litter", "wasting water", "leaving lights on"]],
  ["You see litter in the park. You…", "pick it up and bin it", ["add more litter", "kick it around", "leave it"]],
  ["The 3 R's for the Earth are…", "reduce, reuse, recycle", ["run, rest, repeat", "rip, rush, ruin", "red, ripe, round"]],
  ["A reusable water bottle is better than…", "a new plastic bottle each day", ["a glass you keep", "tap water", "a metal cup"]],
  ["Bees and butterflies help the Earth by…", "helping flowers grow", ["making litter", "scaring animals", "drinking oil"]],
  ["Walking or biking instead of driving…", "keeps the air cleaner", ["makes more smoke", "uses more fuel", "harms the Earth"]],
  ["To help wildlife, you should…", "keep their homes clean and safe", ["chase the animals", "litter in the woods", "pick all the flowers"]],
  ["Turning off the tap while soaping your hands…", "saves water", ["wastes water", "uses electricity", "does nothing"]],
];

export interface GreenParams {
  types: Array<"sort" | "save" | "nature">;
}

let qid = 0;
const id = () => `gr${++qid}`;

function qa(rng: RNG, prompt: string, answer: string, wrong: string[], hint: string, dedupe: string): Question {
  return { id: id(), prompt, answer, choices: shuffle(rng, [answer, ...wrong]), hint, inputMode: "choices", dedupeKey: dedupe };
}

const GREEN_POOLS = { sort: SORT, save: SAVE, nature: NATURE };

export function generateGreen(params: GreenParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [p, a, w] = pick(rng, GREEN_POOLS[type]);
  return qa(rng, p, a, w, "Which choice helps our planet?", `${type}-${p}`);
}
