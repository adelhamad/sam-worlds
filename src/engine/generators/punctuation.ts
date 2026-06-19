// Punctuation Park — end marks (. ? !), capital letters, and what each mark does.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [sentence without its end mark, correct mark]
const ENDMARK: Array<[string, string]> = [
  ["I love ice cream", "."],
  ["What is your name", "?"],
  ["Watch out", "!"],
  ["The dog is brown", "."],
  ["Where are you going", "?"],
  ["Wow, that is amazing", "!"],
  ["My birthday is in May", "."],
  ["Do you like dogs", "?"],
  ["Help me please", "!"],
  ["We went to the park", "."],
  ["How old are you", "?"],
  ["That is so cool", "!"],
];

// [lowercase word, why it needs a capital]
const NAMES: Array<[string, string]> = [
  ["sam", "a person's name"], ["monday", "a day of the week"], ["london", "a city"],
  ["july", "a month"], ["africa", "a place"], ["egypt", "a country"], ["max", "a pet's name"],
  ["december", "a month"], ["friday", "a day"], ["paris", "a city"],
];

// [question, answer, wrongs]
const MARK: Array<[string, string, string[]]> = [
  ["Which mark ends a question?", "? (question mark)", [". (period)", "! (exclamation)", ", (comma)"]],
  ["Which mark shows excitement or shouting?", "! (exclamation)", ["? (question)", ". (period)", ", (comma)"]],
  ["Which mark ends a telling sentence?", ". (period)", ["? (question)", "! (exclamation)", ", (comma)"]],
  ["Every sentence should begin with a…", "capital letter", ["small letter", "number", "question mark"]],
  ["The first word of a sentence starts with a…", "capital letter", ["period", "comma", "small letter"]],
];

export interface PunctuationParams {
  types: Array<"endmark" | "name" | "mark">;
}

let qid = 0;
const id = () => `pu${++qid}`;
const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export function generatePunctuation(params: PunctuationParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "name") {
    const [word, why] = pick(rng, NAMES);
    return {
      id: id(),
      prompt: `How should we write “${word}”? (It is ${why}.)`,
      answer: capitalize(word),
      choices: shuffle(rng, [capitalize(word), word, word.toUpperCase()]),
      hint: "Names and special words start with a capital letter.",
      inputMode: "choices",
      dedupeKey: `name-${word}`,
    };
  }
  if (type === "mark") {
    const [p, a, w] = pick(rng, MARK);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about what each mark is for.", inputMode: "choices", dedupeKey: `mark-${p}` };
  }
  const [sentence, mark] = pick(rng, ENDMARK);
  return {
    id: id(),
    prompt: `Which mark ends this sentence?  “${sentence} __”`,
    answer: mark,
    choices: shuffle(rng, [".", "?", "!"]),
    hint: "Is it telling, asking, or shouting?",
    inputMode: "choices",
    dedupeKey: `end-${sentence}`,
  };
}
