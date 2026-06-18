// Living Planet — food chains, life cycles and habitats. Ordering is
// constructed (tap cards in sequence); habitat questions are true matching.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface LivingParams {
  types: Array<"chain" | "cycle" | "fact">;
  /** Cap on sequence length. */
  maxLen?: number;
}

const CHAINS: string[][] = [
  ["🌱 grass", "🐇 rabbit", "🦊 fox"],
  ["🌿 leaf", "🐛 caterpillar", "🐦 bird", "🦅 hawk"],
  ["🌊 algae", "🐟 fish", "🦭 seal", "🦈 shark"],
  ["🌸 flower", "🐝 bee", "🐸 frog", "🐍 snake"],
  ["🌾 wheat", "🐭 mouse", "🦉 owl"],
  ["🍃 plankton", "🦐 shrimp", "🐧 penguin", "🐋 orca"],
  ["☀️ sunlight", "🌱 grass", "🦗 cricket", "🐸 frog", "🦅 hawk"],
  ["🍂 leaves", "🪱 worm", "🐦 bird", "🐱 cat", "🦊 fox"],
  ["🌽 corn", "🐔 chicken", "🦊 fox"],
  ["🥬 lettuce", "🐌 snail", "🐦 bird"],
  ["🌱 grass", "🦌 deer", "🐯 tiger"],
  ["🌸 flower", "🦋 butterfly", "🕷️ spider", "🐦 bird"],
  ["🌾 seeds", "🐿️ squirrel", "🦉 owl"],
  ["🌱 grass", "🦗 grasshopper", "🐭 mouse", "🐍 snake"],
  ["🌿 leaf", "🐛 caterpillar", "🐸 frog", "🦅 hawk"],
  ["🌊 algae", "🦐 shrimp", "🐟 fish", "🐬 dolphin"],
  ["🌱 clover", "🐇 rabbit", "🦅 eagle"],
  ["🍎 apple", "🐛 worm", "🐦 robin", "🐱 cat"],
  ["🌾 grain", "🐓 hen", "🦊 fox"],
  ["🌊 seaweed", "🐢 turtle", "🦈 shark"],
  ["🌸 nectar", "🦋 butterfly", "🐸 frog", "🦉 owl"],
  ["🌱 grass", "🐄 cow", "🦁 lion"],
  ["🍃 plankton", "🐟 fish", "🐧 penguin", "🦭 seal"],
  ["🌾 wheat", "🐀 rat", "🐍 snake", "🦅 hawk"],
  ["🌳 berries", "🐻 bear"],
  ["🌱 moss", "🐌 snail", "🦔 hedgehog"],
  ["🌊 algae", "🐌 sea snail", "🐙 octopus"],
  ["🌾 seeds", "🐦 sparrow", "🐈 cat"],
  ["🌿 leaves", "🦒 giraffe", "🐆 leopard"],
  ["🌱 grass", "🦓 zebra", "🦁 lion"],
  ["🍂 leaves", "🦗 cricket", "🐸 frog", "🐍 snake"],
  ["🌊 algae", "🐠 minnow", "🐟 bass", "🐻 bear"],
];

const CYCLES: string[][] = [
  ["🥚 egg", "🐛 caterpillar", "🛡️ chrysalis", "🦋 butterfly"],
  ["🥚 egg", "🐣 chick", "🐔 hen"],
  ["🌰 seed", "🌱 sprout", "🌿 plant", "🌳 tree"],
  ["💧 rain", "🏞️ river", "🌊 sea", "☁️ cloud"],
  ["🥚 egg", "🪱 tadpole", "🐸 frog"],
  ["🌑 new moon", "🌓 half moon", "🌕 full moon", "🌗 waning moon"],
  ["🥚 egg", "🐛 larva", "🛏 pupa", "🐝 bee"],
  ["🌰 acorn", "🌱 seedling", "🌳 oak tree"],
  ["🥚 egg", "🐧 fluffy chick", "🐧 penguin"],
  ["🥚 egg", "🐢 baby turtle", "🐢 big sea turtle"],
  ["🌰 seed", "🌱 seedling", "🌻 sunflower"],
  ["🥚 egg", "🐠 fry", "🐟 fish"],
  ["🥚 egg", "🐊 hatchling", "🐊 crocodile"],
  ["🌱 sprout", "🌿 vine", "🎃 pumpkin"],
  ["🥚 egg", "🐛 maggot", "🪰 fly"],
  ["🌑 new moon", "🌒 crescent", "🌓 half moon", "🌕 full moon"],
  ["🌸 blossom", "🍏 green apple", "🍎 ripe apple"],
  ["🌧️ rain", "🌱 seed", "🌿 plant", "🌼 flower"],
  ["🥚 egg", "🐍 baby snake", "🐍 snake"],
  ["🐛 caterpillar", "🛡️ chrysalis", "🦋 butterfly"],
  ["🌰 seed", "🌱 shoot", "🌽 corn"],
  ["💧 water", "❄️ ice", "💨 vapor", "☁️ cloud"],
  ["🥚 egg", "🐤 duckling", "🦆 duck"],
  ["🌱 spore", "🍄 small mushroom", "🍄 mushroom"],
  ["🌸 flower", "🫛 pod", "🌱 seed"],
  ["🥚 egg", "🐜 larva", "🐜 ant"],
  ["🌅 morning", "🌞 noon", "🌇 evening", "🌙 night"],
  ["🌱 acorn", "🌿 sapling", "🌳 oak", "🍂 leaves fall"],
];

const HABITATS: Array<[string, string]> = [
  ["🐪 camel", "desert"], ["🐧 penguin", "ice"], ["🐵 monkey", "jungle"],
  ["🦈 shark", "ocean"], ["🦅 eagle", "mountains"], ["🐸 frog", "pond"],
  ["🦊 fox", "forest"], ["🐍 snake", "desert"], ["🐋 whale", "ocean"],
  ["🐻 bear", "forest"], ["🦒 giraffe", "savanna"], ["🐬 dolphin", "ocean"],
  ["🦫 beaver", "river"], ["🦂 scorpion", "desert"], ["🐆 jaguar", "jungle"],
  ["🐐 mountain goat", "mountains"], ["🦆 duck", "pond"], ["🦜 parrot", "jungle"],
];
const HABITAT_NAMES = [...new Set(HABITATS.map(([, h]) => h))];

let qid = 0;
const id = () => `lp${++qid}`;

export function generateLiving(params: LivingParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") return genHabitat(rng);
  const pools = type === "cycle" ? CYCLES : CHAINS;
  const maxLen = ctx.easier ? 3 : (params.maxLen ?? 4);
  const seq = pick(rng, pools.filter((c) => c.length <= maxLen));
  return {
    id: id(),
    prompt: type === "cycle" ? "Put the life cycle in order!" : "Who eats whom? Build the chain!",
    answer: seq.join(" → "),
    choices: [],
    hint: `It starts with ${seq[0]}.`,
    inputMode: "order",
    dedupeKey: `seq-${seq.join("")}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}

function genHabitat(rng: RNG): Question {
  const [animal, habitat] = pick(rng, HABITATS);
  const wrong = shuffle(rng, HABITAT_NAMES.filter((h) => h !== habitat)).slice(0, 3);
  return {
    id: id(),
    prompt: `Where does the ${animal} live?`,
    answer: habitat,
    choices: shuffle(rng, [habitat, ...wrong]),
    hint: `Think hot or cold, wet or dry…`,
    inputMode: "choices",
  };
}
