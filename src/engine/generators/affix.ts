// Word Builders — prefixes & suffixes (morphology), straight from school.
// Build questions are meaning-driven: given a target meaning, pick the part
// that creates it (never "glue the shown parts together" — that tests nothing).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [prefix, root, combined, kid-friendly meaning of the combined word]
const PREFIX_WORDS: Array<[string, string, string, string]> = [
  ["un", "happy", "unhappy", "not happy"], ["un", "kind", "unkind", "not kind"],
  ["un", "fair", "unfair", "not fair"], ["un", "safe", "unsafe", "not safe"],
  ["un", "lucky", "unlucky", "not lucky"], ["un", "tidy", "untidy", "not tidy"],
  ["re", "play", "replay", "play it again"], ["re", "do", "redo", "do it again"],
  ["re", "read", "reread", "read it again"], ["re", "fill", "refill", "fill it again"],
  ["re", "build", "rebuild", "build it again"], ["re", "tell", "retell", "tell it again"],
  ["pre", "school", "preschool", "school before big school"], ["pre", "heat", "preheat", "heat it before"],
  ["pre", "view", "preview", "a look before"], ["pre", "pay", "prepay", "pay before"],
  ["dis", "agree", "disagree", "the opposite of agree"], ["dis", "like", "dislike", "the opposite of like"],
  ["dis", "obey", "disobey", "the opposite of obey"], ["dis", "appear", "disappear", "the opposite of appear"],
  ["mis", "spell", "misspell", "spell it wrongly"], ["mis", "read", "misread", "read it wrongly"],
  ["mis", "place", "misplace", "put it in the wrong place"], ["mis", "count", "miscount", "count it wrongly"],
  ["over", "eat", "overeat", "eat too much"], ["over", "cook", "overcook", "cook it too much"],
  ["over", "fill", "overfill", "fill it too much"], ["over", "sleep", "oversleep", "sleep too long"],
  ["under", "cook", "undercook", "cook it too little"], ["under", "ground", "underground", "below the ground"],
  ["under", "water", "underwater", "below the water"],
];
const PREFIX_MEANING: Array<[string, string]> = [
  ["un", "not"], ["re", "again"], ["pre", "before"], ["dis", "the opposite of"],
  ["mis", "wrongly"], ["over", "too much"], ["under", "too little or below"],
];
// prefixes too close in meaning to be fair distractors for each other
const PREFIX_CONFLICTS: Record<string, string[]> = { un: ["dis"], dis: ["un"], over: ["under"], under: ["over"] };

// [root, suffix, combined, kid-friendly meaning of the combined word]
const SUFFIX_WORDS: Array<[string, string, string, string]> = [
  ["help", "ful", "helpful", "full of help"], ["care", "ful", "careful", "full of care"],
  ["color", "ful", "colorful", "full of color"], ["play", "ful", "playful", "full of play"],
  ["joy", "ful", "joyful", "full of joy"],
  ["hope", "less", "hopeless", "without hope"], ["fear", "less", "fearless", "without fear"],
  ["help", "less", "helpless", "without help"], ["care", "less", "careless", "without care"],
  ["end", "less", "endless", "without an end"],
  ["jump", "ing", "jumping", "jumping right now"], ["read", "ing", "reading", "reading right now"],
  ["sing", "ing", "singing", "singing right now"],
  ["play", "ed", "played", "played in the past"], ["jump", "ed", "jumped", "jumped in the past"],
  ["help", "ed", "helped", "helped in the past"],
  ["quick", "ly", "quickly", "in a quick way"], ["slow", "ly", "slowly", "in a slow way"],
  ["soft", "ly", "softly", "in a soft way"], ["brave", "ly", "bravely", "in a brave way"],
  ["loud", "ly", "loudly", "in a loud way"],
  ["teach", "er", "teacher", "a person who teaches"], ["farm", "er", "farmer", "a person who farms"],
  ["paint", "er", "painter", "a person who paints"], ["sing", "er", "singer", "a person who sings"],
  ["build", "er", "builder", "a person who builds"], ["help", "er", "helper", "a person who helps"],
  ["tall", "est", "tallest", "the MOST tall"], ["fast", "est", "fastest", "the MOST fast"],
  ["strong", "est", "strongest", "the MOST strong"],
];
const SUFFIX_MEANING: Array<[string, string]> = [
  ["ful", "full of"], ["less", "without"], ["er", "a person who does it"], ["ly", "in a way"],
  ["ing", "doing it now"], ["ed", "in the past"], ["est", "the most"],
];

export interface AffixParams {
  types: Array<"buildPrefix" | "buildSuffix" | "prefixMeaning" | "suffixMeaning" | "root">;
}

let qid = 0;
const id = () => `af${++qid}`;

export function generateAffix(params: AffixParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "buildSuffix":
      return genBuildSuffix(rng);
    case "prefixMeaning":
      return genMeaning(rng, PREFIX_MEANING, "prefix");
    case "suffixMeaning":
      return genMeaning(rng, SUFFIX_MEANING, "suffix");
    case "root":
      return genRoot(rng);
    default:
      return genBuildPrefix(rng);
  }
}

/** Given a target meaning, choose the prefix that builds it. */
function genBuildPrefix(rng: RNG): Question {
  const [prefix, root, combined, meaning] = pick(rng, PREFIX_WORDS);
  const partMeaning = PREFIX_MEANING.find(([p]) => p === prefix)?.[1] ?? prefix;
  const blocked = [prefix, ...(PREFIX_CONFLICTS[prefix] ?? [])];
  const wrong = shuffle(rng, PREFIX_MEANING.map(([p]) => p).filter((p) => !blocked.includes(p))).slice(0, 3);
  return {
    id: id(),
    prompt: `Build a word that means "${meaning}":\n▢ + ${root}`,
    answer: `${prefix}-`,
    choices: shuffle(rng, [prefix, ...wrong].map((p) => `${p}-`)),
    hint: `You need the part that means "${partMeaning}" — it makes "${combined}".`,
    inputMode: "choices",
    dedupeKey: `bp-${combined}`,
  };
}

/** Given a target meaning, choose the suffix that builds it. */
function genBuildSuffix(rng: RNG): Question {
  const [root, suffix, combined, meaning] = pick(rng, SUFFIX_WORDS);
  const partMeaning = SUFFIX_MEANING.find(([s]) => s === suffix)?.[1] ?? suffix;
  const wrong = shuffle(rng, SUFFIX_MEANING.map(([s]) => s).filter((s) => s !== suffix)).slice(0, 3);
  return {
    id: id(),
    prompt: `Build a word that means "${meaning}":\n${root} + ▢`,
    answer: `-${suffix}`,
    choices: shuffle(rng, [suffix, ...wrong].map((s) => `-${s}`)),
    hint: `You need the ending that means "${partMeaning}" — it makes "${combined}".`,
    inputMode: "choices",
    dedupeKey: `bs-${combined}`,
  };
}

function genMeaning(rng: RNG, table: Array<[string, string]>, kind: string): Question {
  const [affix, meaning] = pick(rng, table);
  const wrong = shuffle(rng, table.filter((m) => m[1] !== meaning).map((m) => m[1])).slice(0, 3);
  return {
    id: id(),
    prompt: kind === "prefix" ? `What does the prefix "${affix}-" mean?` : `What does the suffix "-${affix}" mean?`,
    answer: meaning,
    choices: shuffle(rng, [meaning, ...wrong]),
    hint: `Think of a word that uses "${affix}".`,
    inputMode: "choices",
    dedupeKey: `mean-${affix}`,
  };
}

function genRoot(rng: RNG): Question {
  const all = [
    ...PREFIX_WORDS.map(([, root, combined]) => [root, combined] as const),
    ...SUFFIX_WORDS.map(([root, , combined]) => [root, combined] as const),
  ];
  const [root, combined] = pick(rng, all);
  const wrong = shuffle(rng, [...new Set(all.map(([r]) => r))].filter((r) => r !== root && !combined.includes(r))).slice(0, 3);
  return {
    id: id(),
    prompt: `Find the root word in "${combined}"`,
    answer: root,
    choices: shuffle(rng, [root, ...wrong]),
    hint: "Take away the extra part at the start or end.",
    inputMode: "choices",
    dedupeKey: `root-${combined}`,
  };
}
