// The hands-on tasks: things the child BUILDS, DRAGS or FINDS instead of
// picking one card of four — a chat reply from a word bank, a phrase built by
// ear, a thing handed to Pogo, a word caught in a sentence, a memory game.
// Same rules as tasks.ts: a builder returns null when the lesson's data
// cannot make a fair question.
import type { Question } from "../generators/types";
import { shuffle } from "../rng";
import { LANG } from "../../strings/lang";
import { spotAnswer } from "./answers";
import { clashes, others, phraseCard } from "./cards";
import {
  bare, base, build, buildable, closedWords, companions, make, means, phraseOf, sayIt, tileWords, type Env,
} from "./tasks";
import { FOUND, SAID, type LangTile, type MemoryCard, type Phrase, type PhraseWord, type Scene } from "./types";

/** Most tiles a word bank holds on a phone. */
const BANK_MAX = 8;
/** Pairs in a memory game, and the turns it allows (only wild guessing runs out). */
const MEMORY_PAIRS = 3;
const MEMORY_TURNS = MEMORY_PAIRS * 2 + 3;

function tile(word: PhraseWord): LangTile {
  return { text: word.text, say: word.text, ...(word.roman ? { roman: word.roman } : {}) };
}

/** Dictation: the phrase is heard, not shown — build what you hear. */
export function dictate(env: Env, phrase: Phrase): Question | null {
  const question = build(env, phrase);
  if (!question) return null;
  return {
    ...question,
    prompt: LANG.engine.dictate,
    dedupeKey: `lang:dictate:${phrase.id}`,
    payload: { ...question.payload, task: "dictate", listen: true, explain: means(phrase) },
  };
}

/** True when `words` can be laid out with the bank's tiles (each tile used once). */
function spells(words: PhraseWord[], bank: PhraseWord[]): boolean {
  const left = bank.map((word) => word.text);
  return words.every((word) => {
    const at = left.indexOf(word.text);
    if (at < 0) return false;
    left.splice(at, 1);
    return true;
  });
}

/**
 * A scene as a chat. The bank holds the words of the model reply (and of one
 * more right reply, when it is short) plus decoys that belong to no right
 * reply. Every phrase the scene accepts that the bank can spell is right.
 */
export function chat(env: Env, moment: Scene): Question | null {
  const { lang } = env.params;
  const find = (ids: string[] | undefined) => (ids ?? []).map((id) => phraseOf(env, id)).filter((phrase): phrase is Phrase => Boolean(phrase));
  const replies = find(moment.reply);
  const model = replies[0];
  if (!model) return null;
  const line = phraseOf(env, moment.line);
  const fine = [...replies, ...find(moment.alsoOk)];
  // Anything that means the same as a fine reply is fine too.
  const accepted = env.pool.filter((phrase) => fine.some((item) => item.id === phrase.id || clashes(item, phrase)));

  const bank = [...tileWords(model, lang)];
  const second = replies.slice(1).find((reply) => tileWords(reply, lang).length <= 3);
  for (const word of second ? tileWords(second, lang) : []) {
    if (bank.length < BANK_MAX - 2 && !bank.some((taken) => bare(taken.text) === bare(word.text))) bank.push(word);
  }
  const closed = new Set<string>();
  for (const phrase of [...accepted, ...(line ? [line] : [])]) closedWords(phrase, tileWords(phrase, lang), env.pool).forEach((word) => closed.add(word));
  const wanted = Math.min(BANK_MAX - bank.length, env.ctx.easier ? 1 : 2 + Number(env.ctx.difficulty > 0.6));
  const decoys: PhraseWord[] = [];
  for (const word of shuffle(env.rng, env.pool.flatMap((phrase) => tileWords(phrase, lang)))) {
    if (decoys.length >= wanted) break;
    const known = [...bank, ...decoys].some((taken) => bare(taken.text) === bare(word.text));
    if (!known && !closed.has(bare(word.text)) && !/\s/.test(word.text)) decoys.push(word);
  }
  if (bank.length + decoys.length < 3) return null; // nothing to choose between

  const all = [...bank, ...decoys];
  const texts = (phrase: Phrase) => tileWords(phrase, lang).map((word) => word.text);
  const accept = [texts(model)];
  for (const phrase of accepted) {
    const reply = texts(phrase);
    if (spells(tileWords(phrase, lang), all) && !accept.some((taken) => taken.join("\u0001") === reply.join("\u0001"))) accept.push(reply);
  }
  return make("scene", moment.id, LANG.engine.scene, SAID, {
    ...base(env, "scene", moment.id, phraseCard(model), means(model), model.tip), tour: "lang-chat",
    setup: moment.setup, ...(moment.who ? { who: moment.who } : {}), ...(line ? { line: phraseCard(line) } : {}),
    tiles: shuffle(env.rng, all).map(tile), accept, rtl: lang === "ar",
  });
}

/** Single things with a picture: what Pogo can ask for. */
export function pictured(pool: Phrase[]): Phrase[] {
  return pool.filter((phrase) => phrase.art && !phrase.words);
}

/** Pogo asks for a thing; the child hands him its picture. */
export function give(env: Env, phrase: Phrase): Question | null {
  if (!phrase.art || phrase.words) return null;
  const rest: Phrase[] = [];
  const wanted = env.ctx.easier ? 2 : 3;
  for (const other of others(phrase, pictured(env.pool), pictured(env.pool).length, env.rng)) {
    if (rest.length >= wanted) break;
    if (other.art !== phrase.art && !rest.some((taken) => taken.art === other.art)) rest.push(other);
  }
  if (rest.length < 2) return null;
  const card = phraseCard(phrase);
  return make("give", phrase.id, LANG.engine.give, phrase.id, {
    ...base(env, "give", phrase.id, card, means(phrase), phrase.tip), tour: "lang-give",
    ask: card, items: shuffle(env.rng, [phrase, ...rest]).map(phraseCard),
  });
}

/** Sentences of three or more different words: one of them can be "caught". */
export function spottable(pool: Phrase[]): Phrase[] {
  return pool.filter((phrase) => {
    const words = (phrase.words ?? []).map((word) => bare(word.text));
    return words.length >= 3 && new Set(words).size === words.length;
  });
}

/** A sentence is shown; one word is heard — tap it. */
export function spot(env: Env, phrase: Phrase): Question | null {
  if (!spottable([phrase]).length) return null;
  const words = tileWords(phrase, env.params.lang);
  const heard = Math.floor(env.rng() * words.length);
  return make("spot", `${phrase.id}:${heard}`, LANG.engine.spot, spotAnswer(heard), {
    ...base(env, "spot", phrase.id, phraseCard(phrase), sayIt(phrase), phrase.tip), tour: "lang-spot",
    words: words.map(tile), heard, rtl: env.params.lang === "ar",
  });
}

/** Cards face down: find each phrase and its meaning. */
export function memory(env: Env, phrase: Phrase): Question | null {
  const rest = companions(env, phrase, MEMORY_PAIRS - 1);
  if (rest.length < MEMORY_PAIRS - 1) return null;
  const set = [phrase, ...rest];
  const cards = set.flatMap((item): MemoryCard[] => {
    const card = phraseCard(item);
    return [{ pair: item.id, side: "phrase", card }, { pair: item.id, side: "meaning", card }];
  });
  const key = set.map((item) => item.id).sort().join("+");
  return make("memory", key, LANG.engine.memory, FOUND, {
    ...base(env, "memory", phrase.id, phraseCard(phrase), means(phrase)), tour: "lang-memory",
    cards: shuffle(env.rng, cards), turns: MEMORY_TURNS,
  });
}

/** Short single words that can be spelled from letter tiles. */
export function spellable(pool: Phrase[]): Phrase[] {
  return pool.filter((phrase) => !phrase.words && !/[\s'’-]/.test(phrase.text.trim()) && Array.from(bare(phrase.text)).length >= 3 && Array.from(bare(phrase.text)).length <= 7);
}

export { buildable };
