// Sound It Out — phonics: letter-sound matching, short vowels, digraphs,
// blending CVC words, and counting syllables. The word is shown with a blank so
// the picture supports the sound; choices are letters (constructed answers).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const CONSONANTS = "bcdfghjklmnpqrstvwxyz".split("");
const VOWELS = ["a", "e", "i", "o", "u"];

// Consonant-vowel-consonant words [emoji, word]. first/vowel/last are read off
// the string, so every entry must be exactly C-V-C.
const CVC: Array<[string, string]> = [
  ["🐱", "cat"], ["🎩", "hat"], ["🐀", "rat"], ["🎒", "bag"], ["🧢", "cap"],
  ["🚐", "van"], ["🦇", "bat"], ["🪭", "fan"], ["🐶", "dog"], ["🦊", "fox"],
  ["🍲", "pot"], ["🪵", "log"], ["🔝", "top"], ["☀️", "sun"], ["☕", "mug"],
  ["🚌", "bus"], ["🐛", "bug"], ["🥤", "cup"], ["🛏️", "bed"], ["✈️", "jet"],
  ["🖊️", "pen"], ["🐔", "hen"], ["🥅", "net"], ["🐷", "pig"], ["📌", "pin"],
  ["6️⃣", "six"], ["💋", "lip"], ["⛏️", "dig"],
];

// Words that begin with a two-letter digraph [emoji, word, digraph].
const DIGRAPHS: Array<[string, string, string]> = [
  ["🚢", "ship", "sh"], ["🦈", "shark", "sh"], ["🐑", "sheep", "sh"], ["🐚", "shell", "sh"],
  ["🪑", "chair", "ch"], ["🧀", "cheese", "ch"], ["🍒", "cherry", "ch"], ["🍗", "chicken", "ch"],
  ["👍", "thumb", "th"], ["🦷", "tooth", "th"], ["🌩️", "thunder", "th"], ["🧵", "thread", "th"],
  ["🐳", "whale", "wh"], ["🛞", "wheel", "wh"], ["🌾", "wheat", "wh"],
];
const DIGRAPH_CHOICES = ["sh", "ch", "th", "wh"];

// [emoji, word, syllable count]
const SYLLABLES: Array<[string, string, number]> = [
  ["🐱", "cat", 1], ["🐶", "dog", 1], ["☀️", "sun", 1], ["🍎", "apple", 2],
  ["🌈", "rainbow", 2], ["✏️", "pencil", 2], ["🐅", "tiger", 2], ["🐰", "rabbit", 2],
  ["🪟", "window", 2], ["👋", "hello", 2], ["🦒", "giraffe", 2], ["🍌", "banana", 3],
  ["🦋", "butterfly", 3], ["🐘", "elephant", 3], ["🦕", "dinosaur", 3], ["☂️", "umbrella", 3],
  ["🐊", "crocodile", 3], ["🦘", "kangaroo", 3], ["🐞", "ladybug", 3], ["👨‍👩‍👧", "family", 3],
  ["🍉", "watermelon", 4], ["🐛", "caterpillar", 4], ["🚁", "helicopter", 4],
];

export interface PhonicsParams {
  types: Array<"begin" | "end" | "vowel" | "digraph" | "build" | "syllable">;
}

let qid = 0;
const id = () => `ph${++qid}`;

function letterChoices(rng: RNG, answer: string, pool: string[]): string[] {
  const wrong = shuffle(rng, pool.filter((l) => l !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

export function generatePhonics(params: PhonicsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "end":
      return genEnd(rng);
    case "vowel":
      return genVowel(rng);
    case "digraph":
      return genDigraph(rng);
    case "build":
      return genBuild(rng);
    case "syllable":
      return genSyllable(rng);
    default:
      return genBegin(rng);
  }
}

function genBegin(rng: RNG): Question {
  const [emoji, word] = pick(rng, CVC);
  return {
    id: id(),
    prompt: `Which letter starts the word?  _${word.slice(1)}`,
    answer: word[0],
    choices: letterChoices(rng, word[0], CONSONANTS),
    hint: `Say it slowly: ${word[0]}-${word[0]}-${word}.`,
    inputMode: "choices",
    dedupeKey: `begin-${word}`,
    payload: { bigSymbol: emoji },
  };
}

function genEnd(rng: RNG): Question {
  const [emoji, word] = pick(rng, CVC);
  const last = word[word.length - 1];
  return {
    id: id(),
    prompt: `Which letter ends the word?  ${word.slice(0, -1)}_`,
    answer: last,
    choices: letterChoices(rng, last, CONSONANTS),
    hint: `Stretch the end: ${word}-${last}-${last}.`,
    inputMode: "choices",
    dedupeKey: `end-${word}`,
    payload: { bigSymbol: emoji },
  };
}

function genVowel(rng: RNG): Question {
  const [emoji, word] = pick(rng, CVC);
  const vowel = word[1];
  return {
    id: id(),
    prompt: `Which vowel is missing?  ${word[0]}_${word.slice(2)}`,
    answer: vowel,
    choices: letterChoices(rng, vowel, VOWELS),
    hint: `Sound it out: ${word[0]}-${vowel}-${word.slice(2)}.`,
    inputMode: "choices",
    dedupeKey: `vowel-${word}`,
    payload: { bigSymbol: emoji },
  };
}

function genDigraph(rng: RNG): Question {
  const [emoji, word, dg] = pick(rng, DIGRAPHS);
  return {
    id: id(),
    prompt: `Which two letters start the word?  __${word.slice(2)}`,
    answer: dg,
    choices: shuffle(rng, DIGRAPH_CHOICES),
    hint: `${dg} makes one sound, like in ${word}.`,
    inputMode: "choices",
    dedupeKey: `digraph-${word}`,
    payload: { bigSymbol: emoji },
  };
}

function genBuild(rng: RNG): Question {
  const [emoji, word] = pick(rng, CVC);
  const letters = word.split("");
  return {
    id: id(),
    prompt: `Spell the word — put the letters in order!`,
    answer: letters.join(" → "),
    choices: [],
    hint: `Sound out each letter: ${letters.join("-")}.`,
    inputMode: "order",
    dedupeKey: `build-${word}`,
    payload: { items: shuffle(rng, letters), arrow: "→", bigSymbol: emoji },
  };
}

function genSyllable(rng: RNG): Question {
  const [emoji, word, n] = pick(rng, SYLLABLES);
  return {
    id: id(),
    prompt: `How many beats (syllables) in this word?  ${word}`,
    answer: String(n),
    choices: [],
    hint: "Clap once for each beat as you say it.",
    dedupeKey: `syllable-${word}`,
    payload: { bigSymbol: emoji },
  };
}
