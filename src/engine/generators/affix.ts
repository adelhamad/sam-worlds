// Word Builders — prefixes & suffixes (morphology), straight from school.
// Build words from parts, learn what each part means, find the root.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [prefix, root, combined]
const PREFIX_WORDS: Array<[string, string, string]> = [
  ["un", "happy", "unhappy"], ["un", "lock", "unlock"], ["un", "kind", "unkind"], ["un", "fair", "unfair"],
  ["re", "play", "replay"], ["re", "do", "redo"], ["re", "read", "reread"], ["re", "fill", "refill"],
  ["pre", "school", "preschool"], ["pre", "heat", "preheat"], ["pre", "view", "preview"],
  ["dis", "agree", "disagree"], ["dis", "like", "dislike"], ["dis", "obey", "disobey"],
  ["mis", "spell", "misspell"], ["mis", "read", "misread"], ["mis", "place", "misplace"],
  ["over", "eat", "overeat"], ["over", "cook", "overcook"],
];
const PREFIX_MEANING: Array<[string, string]> = [
  ["un", "not"], ["re", "again"], ["pre", "before"], ["dis", "the opposite of"], ["mis", "wrongly"], ["over", "too much"],
];

// [root, suffix, combined]
const SUFFIX_WORDS: Array<[string, string, string]> = [
  ["help", "ful", "helpful"], ["care", "ful", "careful"], ["color", "ful", "colorful"],
  ["hope", "less", "hopeless"], ["fear", "less", "fearless"], ["help", "less", "helpless"],
  ["jump", "ing", "jumping"], ["read", "ing", "reading"], ["play", "ed", "played"], ["jump", "ed", "jumped"],
  ["quick", "ly", "quickly"], ["slow", "ly", "slowly"], ["soft", "ly", "softly"],
  ["teach", "er", "teacher"], ["farm", "er", "farmer"], ["paint", "er", "painter"],
];
const SUFFIX_MEANING: Array<[string, string]> = [
  ["ful", "full of"], ["less", "without"], ["er", "a person who does it"], ["ly", "in a way"], ["ing", "doing it now"], ["ed", "in the past"],
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

function genBuildPrefix(rng: RNG): Question {
  const [prefix, root, combined] = pick(rng, PREFIX_WORDS);
  const wrong = shuffle(rng, PREFIX_WORDS.filter((p) => p[2] !== combined).map((p) => p[2])).slice(0, 3);
  return {
    id: id(),
    prompt: `Add the parts: ${prefix} + ${root} = ?`,
    answer: combined,
    choices: shuffle(rng, [combined, ...wrong]),
    hint: `The prefix "${prefix}" goes at the front.`,
    inputMode: "choices",
    dedupeKey: `bp-${combined}`,
  };
}

function genBuildSuffix(rng: RNG): Question {
  const [root, suffix, combined] = pick(rng, SUFFIX_WORDS);
  const wrong = shuffle(rng, SUFFIX_WORDS.filter((s) => s[2] !== combined).map((s) => s[2])).slice(0, 3);
  return {
    id: id(),
    prompt: `Add the parts: ${root} + ${suffix} = ?`,
    answer: combined,
    choices: shuffle(rng, [combined, ...wrong]),
    hint: `The suffix "${suffix}" goes at the end.`,
    inputMode: "choices",
    dedupeKey: `bs-${combined}`,
  };
}

function genMeaning(rng: RNG, table: Array<[string, string]>, kind: string): Question {
  const [affix, meaning] = pick(rng, table);
  const wrong = shuffle(rng, table.filter((m) => m[1] !== meaning).map((m) => m[1])).slice(0, 3);
  return {
    id: id(),
    prompt: `What does the ${kind} "${affix}-" mean?`,
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
  const wrong = shuffle(rng, all.filter(([r]) => r !== root).map(([r]) => r)).slice(0, 3);
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
