// Grammar Galaxy — parts of speech, a/an, plurals, past tense. School English.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const NOUNS = [
  "dog", "ball", "tree", "car", "book", "house", "teacher", "river", "chair", "apple",
  "school", "beach", "bird", "cake", "train", "garden", "doctor", "mountain", "pencil", "shoe",
  "lion", "kite", "spoon", "flower", "window",
];
const VERBS = [
  "run", "jump", "eat", "sleep", "sing", "read", "swim", "write", "play", "laugh",
  "climb", "dance", "throw", "catch", "draw", "build", "shout", "listen", "cook", "fly",
  "paint", "wash", "kick", "smile", "push",
];
const ADJECTIVES = [
  "big", "happy", "red", "fast", "tall", "soft", "loud", "cold", "funny", "shiny",
  "small", "green", "slow", "short", "quiet", "warm", "sad", "brave", "dirty", "bright",
  "hot", "wet", "smooth", "heavy", "tiny",
];

// vowel-sound words take "an"
const AN_WORDS = [
  "apple", "egg", "orange", "umbrella", "igloo", "elephant", "ant", "octopus",
  "owl", "oven", "island", "ear", "eagle", "insect", "astronaut",
];
const A_WORDS = [
  "ball", "dog", "car", "house", "tree", "book", "cup", "kite",
  "banana", "robot", "train", "lion", "table", "garden", "pencil", "rainbow",
];

// [singular, plural]
const PLURALS: Array<[string, string]> = [
  ["dog", "dogs"], ["cat", "cats"], ["book", "books"], ["car", "cars"], ["box", "boxes"], ["bus", "buses"],
  ["child", "children"], ["foot", "feet"], ["tooth", "teeth"], ["mouse", "mice"], ["man", "men"],
  ["woman", "women"], ["person", "people"], ["fish", "fish"], ["sheep", "sheep"],
  ["fox", "foxes"], ["dish", "dishes"], ["brush", "brushes"], ["baby", "babies"], ["puppy", "puppies"],
  ["story", "stories"], ["cherry", "cherries"], ["leaf", "leaves"], ["wolf", "wolves"], ["knife", "knives"],
  ["goose", "geese"],
  // more regular -s
  ["bird", "birds"], ["tree", "trees"], ["apple", "apples"], ["chair", "chairs"], ["table", "tables"],
  ["shoe", "shoes"], ["star", "stars"], ["hand", "hands"],
  // -es after sh / ch / x / s
  ["watch", "watches"], ["beach", "beaches"], ["bench", "benches"], ["glass", "glasses"], ["wish", "wishes"],
  // consonant + y -> ies
  ["pony", "ponies"], ["bunny", "bunnies"], ["fly", "flies"], ["lady", "ladies"], ["city", "cities"],
  // f / fe -> ves
  ["half", "halves"], ["shelf", "shelves"], ["loaf", "loaves"],
  // more irregulars
  ["ox", "oxen"], ["cactus", "cacti"],
];

// [present, past]
const PAST: Array<[string, string]> = [
  ["jump", "jumped"], ["play", "played"], ["walk", "walked"], ["help", "helped"],
  ["run", "ran"], ["eat", "ate"], ["go", "went"], ["see", "saw"], ["swim", "swam"],
  ["sing", "sang"], ["write", "wrote"], ["sleep", "slept"], ["make", "made"], ["give", "gave"],
  ["drink", "drank"], ["ride", "rode"], ["fly", "flew"], ["draw", "drew"], ["build", "built"],
  ["catch", "caught"], ["think", "thought"], ["buy", "bought"], ["come", "came"], ["fall", "fell"],
  ["tell", "told"], ["find", "found"],
  // more regular -ed
  ["cook", "cooked"], ["dance", "danced"], ["clean", "cleaned"], ["paint", "painted"], ["wash", "washed"],
  ["climb", "climbed"], ["laugh", "laughed"], ["open", "opened"],
  // more irregulars
  ["take", "took"], ["throw", "threw"], ["read", "read"], ["sit", "sat"], ["stand", "stood"],
  ["wear", "wore"], ["bring", "brought"], ["teach", "taught"], ["grow", "grew"], ["know", "knew"],
];

export interface GrammarParams {
  types: Array<"classify" | "pick" | "article" | "plural" | "past">;
}

let qid = 0;
const id = () => `gr${++qid}`;
const POS = ["noun", "verb", "adjective"];

export function generateGrammar(params: GrammarParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "pick":
      return genPick(rng);
    case "article":
      return genArticle(rng);
    case "plural":
      return genPlural(rng);
    case "past":
      return genPast(rng);
    default:
      return genClassify(rng);
  }
}

function classOf(word: string): string {
  if (NOUNS.includes(word)) return "noun";
  if (VERBS.includes(word)) return "verb";
  return "adjective";
}

function verbHint(kind: string): string {
  if (kind === "verb") return "An action you can do.";
  if (kind === "noun") return "A person, place or thing.";
  return "A describing word.";
}

function genClassify(rng: RNG): Question {
  const word = pick(rng, [...NOUNS, ...VERBS, ...ADJECTIVES]);
  return {
    id: id(),
    prompt: `Is "${word}" a noun, verb, or adjective?`,
    answer: classOf(word),
    choices: [...POS],
    hint: "Noun = thing, verb = action, adjective = describes.",
    inputMode: "choices",
    dedupeKey: `class-${word}`,
  };
}

const POOLS: Record<string, string[]> = { noun: NOUNS, verb: VERBS, adjective: ADJECTIVES };

function genPick(rng: RNG): Question {
  const kind = pick(rng, POS);
  const answer = pick(rng, POOLS[kind]);
  const others = [...NOUNS, ...VERBS, ...ADJECTIVES].filter((w) => classOf(w) !== kind);
  const wrong = shuffle(rng, others).slice(0, 3);
  const article = kind === "adjective" ? "an" : "a";
  return {
    id: id(),
    prompt: `Which word is ${article} ${kind}?`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: verbHint(kind),
    inputMode: "choices",
    dedupeKey: `pick-${kind}-${answer}`,
  };
}

function genArticle(rng: RNG): Question {
  const useAn = rng() < 0.5;
  const word = pick(rng, useAn ? AN_WORDS : A_WORDS);
  return {
    id: id(),
    prompt: `___ ${word}`,
    answer: useAn ? "an" : "a",
    choices: ["a", "an"],
    hint: 'Use "an" before a vowel sound (a, e, i, o, u).',
    inputMode: "choices",
    dedupeKey: `art-${word}`,
  };
}

function genPlural(rng: RNG): Question {
  const [one, many] = pick(rng, PLURALS);
  const wrong = shuffle(rng, [`${one}s`, `${one}es`, `${many}s`, "many"].filter((w) => w !== many)).slice(0, 3);
  return {
    id: id(),
    prompt: `One ${one}, two ___?`,
    answer: many,
    choices: shuffle(rng, [many, ...wrong]),
    hint: "Some words change in a special way!",
    inputMode: "choices",
    dedupeKey: `plural-${one}`,
  };
}

function genPast(rng: RNG): Question {
  const [present, past] = pick(rng, PAST);
  const wrong = shuffle(rng, [`${present}ed`, `${present}d`, `${present}t`].filter((w) => w !== past).concat(PAST.filter((p) => p[1] !== past).map((p) => p[1]))).slice(0, 3);
  return {
    id: id(),
    prompt: `Today I ${present}. Yesterday I ___?`,
    answer: past,
    choices: shuffle(rng, [past, ...wrong]),
    hint: "How do you say it happened before?",
    inputMode: "choices",
    dedupeKey: `past-${present}`,
  };
}
