// Word Wizard — literacy, not math: rhyming, unscrambling, missing letters,
// and odd-sound-out. Leans on the fact that Sam reads well.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// rhyme families — every word in a group rhymes with the others.
const RHYMES: string[][] = [
  ["CAT", "HAT", "BAT", "MAT"],
  ["DOG", "LOG", "FROG", "FOG"],
  ["STAR", "CAR", "JAR", "FAR"],
  ["MOON", "SPOON", "BALLOON", "TUNE"],
  ["CAKE", "LAKE", "SNAKE", "RAKE"],
  ["BALL", "WALL", "TALL", "FALL"],
  ["TREE", "BEE", "KEY", "SEA"],
  ["LIGHT", "NIGHT", "KITE", "BRIGHT"],
  ["BLUE", "GLUE", "SHOE", "TWO"],
  ["RING", "KING", "SING", "WING"],
];

const SHORT_WORDS = ["SUN", "CUP", "DOG", "CAT", "BOX", "HAT", "BUS", "PEN", "BED", "FOX", "JAM", "MAP"];
const LONG_WORDS = ["TRAIN", "PLANT", "BREAD", "CLOUD", "SMILE", "BRUSH", "CROWN", "GHOST", "SNAIL", "SWORD"];

export interface WordParams {
  types: Array<"rhyme" | "unscramble" | "missing" | "oddSound">;
  /** Cap word length for unscramble. */
  maxLen?: number;
}

let qid = 0;
const id = () => `ww${++qid}`;

export function generateWordWizard(params: WordParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "unscramble":
      return genUnscramble(params, rng, ctx);
    case "missing":
      return genMissing(rng, ctx);
    case "oddSound":
      return genOddSound(rng);
    default:
      return genRhyme(rng);
  }
}

function genRhyme(rng: RNG): Question {
  const group = pick(rng, RHYMES);
  const target = group[0];
  const answer = pick(rng, group.slice(1));
  // distractors from OTHER rhyme groups
  const others = shuffle(rng, RHYMES.filter((g) => g !== group).flat()).slice(0, 3);
  return {
    id: id(),
    prompt: `Which word rhymes with ${target}?`,
    answer,
    choices: shuffle(rng, [answer, ...others]),
    hint: `Say them out loud — listen to the ending sound.`,
    inputMode: "choices",
  };
}

function genUnscramble(params: WordParams, rng: RNG, ctx: GenContext): Question {
  const pool = ctx.easier ? SHORT_WORDS : [...SHORT_WORDS, ...LONG_WORDS].filter((w) => w.length <= (params.maxLen ?? 5));
  const word = pick(rng, pool);
  const letters = [...word];
  return {
    id: id(),
    prompt: "Unscramble the word!",
    answer: letters.join(" · "),
    choices: [],
    hint: `It starts with ${letters[0]}.`,
    inputMode: "order",
    payload: { items: shuffle(rng, letters), arrow: "·" },
  };
}

function genMissing(rng: RNG, ctx: GenContext): Question {
  const pool = ctx.easier ? SHORT_WORDS : [...SHORT_WORDS, ...LONG_WORDS];
  const word = pick(rng, pool);
  const hole = randInt(rng, 0, word.length - 1);
  const answer = word[hole];
  const shown = [...word].map((c, i) => (i === hole ? "_" : c)).join("");
  const wrong = shuffle(rng, "ABCDEFGHIJKLMNOPRSTUW".split("").filter((c) => c !== answer)).slice(0, 3);
  return {
    id: id(),
    prompt: `Fill the missing letter: ${shown}`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: `Sound out ${word.toLowerCase()}.`,
    inputMode: "choices",
    payload: { bigSymbol: shown },
  };
}

function genOddSound(rng: RNG): Question {
  // three words that rhyme + one that doesn't; pick the odd one out
  const group = pick(rng, RHYMES);
  const three = shuffle(rng, group).slice(0, 3);
  const odd = pick(rng, shuffle(rng, RHYMES.filter((g) => g !== group)).flat());
  return {
    id: id(),
    prompt: "Which word does NOT rhyme?",
    answer: odd,
    choices: shuffle(rng, [...three, odd]),
    hint: "Three sound the same at the end — one is different.",
    inputMode: "choices",
  };
}
