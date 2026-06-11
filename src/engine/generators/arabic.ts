// Letter Garden — Arabic, as visual as possible: huge letter glyphs,
// emoji ↔ word matching, and build-the-word letter ordering.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

/** [letter, example word, emoji] — one friendly word per letter. */
const LETTERS: Array<[string, string, string]> = [
  ["أ", "أسد", "🦁"], ["ب", "بطة", "🦆"], ["ت", "تفاحة", "🍎"], ["ث", "ثعلب", "🦊"],
  ["ج", "جمل", "🐪"], ["ح", "حصان", "🐎"], ["خ", "خروف", "🐑"], ["د", "دب", "🐻"],
  ["ذ", "ذرة", "🌽"], ["ر", "روبوت", "🤖"], ["ز", "زرافة", "🦒"], ["س", "سمكة", "🐟"],
  ["ش", "شمس", "☀️"], ["ص", "صاروخ", "🚀"], ["ض", "ضفدع", "🐸"], ["ط", "طائرة", "✈️"],
  ["ظ", "ظرف", "✉️"], ["ع", "عين", "👁️"], ["غ", "غيمة", "☁️"], ["ف", "فيل", "🐘"],
  ["ق", "قمر", "🌙"], ["ك", "كتاب", "📖"], ["ل", "ليمون", "🍋"], ["م", "موز", "🍌"],
  ["ن", "نجمة", "⭐"], ["هـ", "هدية", "🎁"], ["و", "وردة", "🌹"], ["ي", "يد", "✋"],
];

/** Short words for build-the-word: [word, letters in order, emoji]. */
const BUILD_WORDS: Array<[string, string[], string]> = [
  ["قط", ["ق", "ط"], "🐱"], ["دب", ["د", "ب"], "🐻"], ["يد", ["ي", "د"], "✋"],
  ["نار", ["ن", "ا", "ر"], "🔥"], ["قمر", ["ق", "م", "ر"], "🌙"], ["باب", ["ب", "ا", "ب"], "🚪"],
  ["بيت", ["ب", "ي", "ت"], "🏠"], ["ماء", ["م", "ا", "ء"], "💧"], ["جمل", ["ج", "م", "ل"], "🐪"],
  ["فيل", ["ف", "ي", "ل"], "🐘"], ["موز", ["م", "و", "ز"], "🍌"], ["ولد", ["و", "ل", "د"], "👦"],
  ["شمس", ["ش", "م", "س"], "☀️"], ["نجمة", ["ن", "ج", "م", "ة"], "⭐"], ["كتاب", ["ك", "ت", "ا", "ب"], "📖"],
  ["سمكة", ["س", "م", "ك", "ة"], "🐟"], ["وردة", ["و", "ر", "د", "ة"], "🌹"], ["تفاحة", ["ت", "ف", "ا", "ح", "ة"], "🍎"],
];

const NUMERALS: Array<[string, string]> = [
  ["١", "1"], ["٢", "2"], ["٣", "3"], ["٤", "4"], ["٥", "5"],
  ["٦", "6"], ["٧", "7"], ["٨", "8"], ["٩", "9"], ["١٠", "10"],
];

export interface ArabicParams {
  types: Array<"letterWord" | "emojiWord" | "buildWord" | "numeral">;
  /** How many letters of the alphabet are in play (from the start). */
  letterCount?: number;
  /** Max letters in build-the-word. */
  wordMaxLen?: number;
}

let qid = 0;
const id = () => `ar${++qid}`;

export function generateArabic(params: ArabicParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "emojiWord":
      return genEmojiWord(params, rng, ctx);
    case "buildWord":
      return genBuildWord(params, rng, ctx);
    case "numeral":
      return genNumeral(rng);
    default:
      return genLetterWord(params, rng, ctx);
  }
}

function pool(params: ArabicParams, ctx: GenContext): Array<[string, string, string]> {
  const count = ctx.easier ? Math.min(10, params.letterCount ?? 28) : (params.letterCount ?? 28);
  return LETTERS.slice(0, count);
}

/** Big letter shown — which word starts with it? */
function genLetterWord(params: ArabicParams, rng: RNG, ctx: GenContext): Question {
  const letters = pool(params, ctx);
  const [letter, word, emoji] = pick(rng, letters);
  const wrong = shuffle(rng, letters.filter((l) => l[0] !== letter)).slice(0, 3);
  return {
    id: id(),
    prompt: "Which word starts with this letter?",
    answer: `${emoji} ${word}`,
    choices: shuffle(rng, [`${emoji} ${word}`, ...wrong.map(([, w, e]) => `${e} ${w}`)]),
    hint: `${letter} sounds like the start of ${word}.`,
    inputMode: "choices",
    payload: { bigSymbol: letter, bigChoices: true },
  };
}

/** Big emoji shown — what is it called in Arabic? */
function genEmojiWord(params: ArabicParams, rng: RNG, ctx: GenContext): Question {
  const letters = pool(params, ctx);
  const [, word, emoji] = pick(rng, letters);
  const wrong = shuffle(rng, letters.filter((l) => l[1] !== word)).slice(0, 3);
  return {
    id: id(),
    prompt: "What is this in Arabic?",
    answer: word,
    choices: shuffle(rng, [word, ...wrong.map(([, w]) => w)]),
    hint: `It starts with ${word[0]}.`,
    inputMode: "choices",
    payload: { bigSymbol: emoji, bigChoices: true },
  };
}

/** Order the letter cards to spell the word for the emoji. */
function genBuildWord(params: ArabicParams, rng: RNG, ctx: GenContext): Question {
  const maxLen = ctx.easier ? 3 : (params.wordMaxLen ?? 4);
  const candidates = BUILD_WORDS.filter(([, letters]) => letters.length <= maxLen);
  const [word, letters, emoji] = pick(rng, candidates);
  return {
    id: id(),
    prompt: `Spell ${word} — first letter first!`,
    answer: letters.join(" "),
    choices: [],
    hint: `It starts with ${letters[0]} (the right side!).`,
    inputMode: "order",
    payload: { bigSymbol: emoji, items: shuffle(rng, letters), arrow: "·" },
  };
}

/** Arabic-Indic numerals. */
function genNumeral(rng: RNG): Question {
  const [glyph, value] = pick(rng, NUMERALS);
  const wrong = shuffle(rng, NUMERALS.filter(([, v]) => v !== value)).slice(0, 3);
  return {
    id: id(),
    prompt: "Which number is this?",
    answer: value,
    choices: shuffle(rng, [value, ...wrong.map(([, v]) => v)]),
    hint: "Count it out slowly…",
    inputMode: "choices",
    payload: { bigSymbol: glyph, bigChoices: true },
  };
}
