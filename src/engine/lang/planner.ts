// Language lesson planner — the entry point the course registry calls
// (engine/courses/planners.ts). A whole lesson is planned at once: the tasks
// the lesson's data allows, weighted by the lesson kind, each aimed at a
// target (new phrases first, older ones for spaced review). A single question
// replaces a missed one: same task, another target when there is one.
// Everything is deterministic from the seed.
import type { GenContext, GeneratorParams, Question } from "../generators/types";
import { isFresh, kitKeys, subjectKey } from "../kit/sample";
import { mulberry32, pick, shuffle, type RNG } from "../rng";
import * as play from "./playTasks";
import * as tasks from "./tasks";
import { langPayload, type LangLessonKind, type LangParams, type LangTask, type LetterCard, type Phrase } from "./types";

/** The miss flow's pin (set by langSessionParams). */
export interface LangReplace {
  task: LangTask;
  /** The missed question's target — the replacement prefers another one. */
  target: string;
}

export type LangSessionParams = LangParams & { replace?: LangReplace };

/**
 * How a lesson is mixed. The hands-on tasks (build, dictate, chat, give, spot,
 * spell, trace, memory) carry the lesson; "tap one card" (hear, say, read,
 * sound, find) is the small rest — a word's first meeting, mostly.
 */
const WEIGHTS: Record<LangLessonKind, Partial<Record<LangTask, number>>> = {
  words: { hear: 2, give: 2, pairs: 1.5, memory: 1, build: 2, dictate: 1.5, spot: 1, spell: 1.5, scene: 1, say: 0.5, read: 0.5 },
  talk: { scene: 4, build: 2, dictate: 2, spot: 1.5, give: 0.5, hear: 0.5, pairs: 0.5 },
  letters: { trace: 4, spell: 3, dictate: 1, build: 1, sound: 1, find: 1, read: 0.5, memory: 0.5, give: 0.5 },
  review: { scene: 2, build: 2, dictate: 2, spot: 1, give: 1, spell: 1, memory: 1, pairs: 1, hear: 1, trace: 1, read: 0.5 },
};

/** A lesson never has more than this many of a task (the long or samey ones). */
const CAPS: Partial<Record<LangTask, number>> = { memory: 1, give: 2, pairs: 2, hear: 3, say: 1, read: 1 };

/** Gentlest first: what a lesson opens with. */
const OPENERS: LangTask[] = ["hear", "trace", "give", "sound", "pairs", "find", "say", "read", "memory", "spot", "dictate", "scene", "build", "spell"];
/** What a lesson ends on: making something. */
const CLOSERS: LangTask[] = ["scene", "build", "dictate", "spell", "trace", "give", "say"];
const RECENT = 16;
const TRIES = 14;

/** The tasks this lesson's data can make a fair question for. */
export function lessonTasks(params: LangParams): LangTask[] {
  const phrases = params.teach.length + params.review.length;
  const out: LangTask[] = [];
  const pool = [...params.review, ...params.teach];
  if (phrases >= 3) out.push("hear", "say", "pairs", "memory");
  if (phrases >= 3 && params.reads) out.push("read");
  if (tasks.buildable(pool).length) out.push("build", "dictate");
  if (play.spottable(pool).length) out.push("spot");
  if (new Set(play.pictured(pool).map((phrase) => phrase.art)).size >= 3) out.push("give");
  if (params.scenes.length && phrases >= 3) out.push("scene");
  if (spellPool(params).length) out.push("spell");
  if (params.letters.length) out.push("trace");
  if (params.letters.length && params.alphabet.length >= 3) out.push("sound", "find");
  return out;
}

/** Words this lesson may ask to spell: the author's list, plus any short word where that is allowed. */
function spellPool(params: LangParams): Phrase[] {
  if (!params.spellAny) return params.spell;
  const recent = [...params.review.slice(-RECENT), ...params.teach];
  return [...new Set([...params.spell, ...play.spellable(recent)])];
}

function noTriples(sequence: LangTask[]): boolean {
  return !sequence.some((task, i) => i >= 2 && task === sequence[i - 1] && task === sequence[i - 2]);
}

/** Tasks over their cap give their extra slots to the heaviest tasks that still have room. */
function capTasks(bag: LangTask[], able: LangTask[], weight: (task: LangTask) => number): void {
  const amount = (task: LangTask) => bag.filter((item) => item === task).length;
  const room = (task: LangTask) => (CAPS[task] ?? Infinity) - amount(task);
  for (const task of able) {
    while (room(task) < 0) {
      const open = able.filter((other) => room(other) > 0).sort((a, b) => weight(b) / (amount(b) + 1) - weight(a) / (amount(a) + 1));
      if (!open.length) return; // every task is at its cap: a short lesson keeps what it has
      bag[bag.indexOf(task)] = open[0];
    }
  }
}

/** The task of every slot: shares by weight (largest remainder), a gentle opener, a making closer. */
export function planTasks(params: LangParams, count: number, rng: RNG): LangTask[] {
  const able = lessonTasks(params);
  if (!able.length) return [];
  const weight = (task: LangTask) => WEIGHTS[params.kind][task] ?? 0.5;
  const total = able.reduce((sum, task) => sum + weight(task), 0);
  const shares = able.map((task) => ({ task, exact: (weight(task) / total) * count }));
  const bag: LangTask[] = shares.flatMap(({ task, exact }) => Array.from({ length: Math.floor(exact) }, () => task));
  const byRemainder = [...shares].sort((a, b) => (b.exact % 1) - (a.exact % 1));
  const missing = count - bag.length;
  for (let i = 0; i < missing; i++) bag.push(byRemainder[i % byRemainder.length].task);
  capTasks(bag, able, weight);

  const opener = OPENERS.find((task) => bag.includes(task)) ?? bag[0];
  bag.splice(bag.indexOf(opener), 1);
  const closer = CLOSERS.find((task) => bag.includes(task));
  if (closer) bag.splice(bag.indexOf(closer), 1);
  let middle = shuffle(rng, bag);
  for (let attempt = 0; attempt < 30 && !noTriples([opener, ...middle, ...(closer ? [closer] : [])]); attempt++) middle = shuffle(rng, bag);
  return [opener, ...middle, ...(closer ? [closer] : [])].slice(0, count);
}

/** What a lesson (or a replacement) has used so far. */
interface Fill {
  env: tasks.Env;
  /** Targets each task has already asked about. */
  used: Map<LangTask, Set<string>>;
  /** Identity keys (kitKeys) of every question already in the session. */
  seen: Set<string>;
  /** How often each letter has been traced. */
  traced: Map<string, number>;
  /** Phrases that have appeared anywhere so far (as a target, an option, a pair). */
  met: Set<string>;
}

/** Every phrase / letter a question puts in front of the child. */
function shownIn(question: Question): string[] {
  const payload = langPayload(question);
  if (!payload) return [];
  if (payload.tour === "lang-pairs") return payload.left.map((card) => card.id);
  if (payload.tour === "lang-choose") return [payload.model.id, ...payload.options.map((card) => card.id)];
  if (payload.tour === "lang-give") return payload.items.map((card) => card.id);
  if (payload.tour === "lang-memory") return payload.cards.map((card) => card.pair);
  return [payload.model.id];
}

function usedBy(fill: Fill, task: LangTask): Set<string> {
  const set = fill.used.get(task) ?? new Set<string>();
  fill.used.set(task, set);
  return set;
}

/** A phrase for `task`: a new one it has not asked about, else a recent older one, else any. */
function nextPhrase(fill: Fill, task: LangTask, from: Phrase[], avoid?: string): Phrase | undefined {
  const { rng, params } = fill.env;
  const used = usedBy(fill, task);
  const open = (list: Phrase[]) => list.filter((phrase) => from.includes(phrase) && !used.has(phrase.id) && phrase.id !== avoid);
  const fresh = open(params.teach);
  // A new phrase the lesson has not shown at all yet comes first: none is left out.
  const unmet = fresh.filter((phrase) => !fill.met.has(phrase.id));
  if (unmet.length) return pick(rng, unmet);
  if (fresh.length) return pick(rng, fresh);
  const recent = open(params.review.slice(-RECENT));
  const older = open(params.review);
  if (recent.length && (rng() < 0.7 || !older.length)) return pick(rng, recent);
  if (older.length) return pick(rng, older);
  const any = from.filter((phrase) => phrase.id !== avoid);
  return any.length ? pick(rng, any) : from[0];
}

function nextLetter(fill: Fill, task: LangTask, avoid?: string): LetterCard | undefined {
  const { rng, params } = fill.env;
  const used = usedBy(fill, task);
  const open = params.letters.filter((letter) => !used.has(letter.id) && letter.id !== avoid);
  if (open.length) return pick(rng, open);
  const others = params.letters.filter((letter) => letter.id !== avoid);
  return others.length ? pick(rng, others) : params.letters[0];
}

type PhraseTask = Exclude<LangTask, "trace" | "sound" | "find" | "scene">;

const PHRASE_TASKS: Record<PhraseTask, (env: tasks.Env, phrase: Phrase) => Question | null> = {
  hear: tasks.hear, say: tasks.say, read: tasks.read, pairs: tasks.pairs, build: tasks.build, spell: tasks.spell,
  dictate: play.dictate, give: play.give, spot: play.spot, memory: play.memory,
};

/** The phrases a task can be about. */
function phrasesFor(task: PhraseTask, pool: Phrase[], params: LangParams): Phrase[] {
  if (task === "build" || task === "dictate") return tasks.buildable(pool);
  if (task === "spot") return play.spottable(pool);
  if (task === "give") return play.pictured(pool);
  if (task === "spell") return spellPool(params);
  return pool;
}

/** Tasks that can show any single word, gentlest first. */
const COVERING: PhraseTask[] = ["hear", "pairs", "memory", "say"];

/**
 * No new phrase is left out: when the slots that remain are only just enough
 * for the new phrases the lesson has not shown yet, a slot whose task cannot
 * show one of them (a chat, a sentence to build) becomes one that can.
 */
function coverTask(task: LangTask, unmet: Phrase[], slotsLeft: number, pool: Phrase[], params: LangParams): LangTask {
  if (!unmet.length || unmet.length < slotsLeft - 1) return task;
  const reaches = (candidate: LangTask) =>
    candidate in PHRASE_TASKS && phrasesFor(candidate as PhraseTask, pool, params).some((phrase) => unmet.includes(phrase));
  if (reaches(task)) return task;
  const able = lessonTasks(params);
  return COVERING.find((candidate) => able.includes(candidate) && reaches(candidate)) ?? task;
}

function buildOne(fill: Fill, task: LangTask, avoid?: string): Question | null {
  const { env } = fill;
  const { params, rng } = env;
  if (task === "trace" || task === "sound" || task === "find") {
    const letter = nextLetter(fill, task, avoid);
    if (!letter) return null;
    usedBy(fill, task).add(letter.id);
    if (task === "sound") return tasks.sound(env, letter);
    if (task === "find") return tasks.find(env, letter);
    const times = fill.traced.get(letter.id) ?? 0;
    fill.traced.set(letter.id, times + 1);
    return tasks.trace(env, letter, times > 0 && env.ctx.difficulty > 0.35 && !env.ctx.easier ? "memory" : "guided");
  }
  if (task === "scene") {
    const used = usedBy(fill, task);
    const open = params.scenes.filter((moment) => !used.has(moment.id) && moment.id !== avoid);
    const others = params.scenes.filter((moment) => moment.id !== avoid);
    const unmet = open.filter((item) => params.teach.some((phrase) => phrase.id === item.reply[0] && !fill.met.has(phrase.id)));
    const choice = [unmet, open, others, params.scenes].find((list) => list.length) ?? params.scenes;
    const moment = pick(rng, choice);
    used.add(moment.id);
    return play.chat(env, moment);
  }
  const phrase = nextPhrase(fill, task, phrasesFor(task, env.pool, params), avoid);
  if (!phrase) return null;
  usedBy(fill, task).add(phrase.id);
  return PHRASE_TASKS[task](env, phrase);
}

/**
 * The same thing asked once more, when the lesson has truly run out of new
 * things for the task (two letters, ten questions): a numbered subject and a
 * `round` in the payload, so it is a question of its own and never a repeat.
 */
function again(question: Question, seen: ReadonlySet<string>): Question {
  const base = (question.dedupeKey ?? question.prompt).replace(/#\d+$/, "");
  let round = 2;
  while (seen.has(subjectKey(`${base}#${round}`))) round++;
  return { ...question, dedupeKey: `${base}#${round}`, payload: { ...question.payload, round } };
}

/** A question of `task` the session has not seen; when the task has run dry, the same thing once more. */
function fresh(fill: Fill, task: LangTask, avoid?: string): Question {
  let fallback: Question | null = null;
  const order = [task, ...shuffle(fill.env.rng, lessonTasks(fill.env.params).filter((other) => other !== task))];
  for (const candidate of order) {
    for (let i = 0; i < TRIES; i++) {
      const question = buildOne(fill, candidate, avoid);
      if (!question) continue; // this target had too few fair options: try another
      fallback ??= question;
      if (isFresh(question, fill.seen)) return question;
    }
    if (fallback && candidate === task) return again(fallback, fill.seen); // same task once more beats another task
  }
  if (!fallback) throw new Error("lang: this lesson has nothing to ask (no phrases, scenes or letters)");
  return again(fallback, fill.seen);
}

function newFill(params: LangParams, rng: RNG, ctx: GenContext, seen: Iterable<string>): Fill {
  return {
    env: { params, rng, ctx, pool: [...params.review, ...params.teach] },
    used: new Map(), seen: new Set(seen), traced: new Map(), met: new Set(),
  };
}

/**
 * Plan a whole lesson (`count` questions), or with `count = 1` replace a missed
 * question: the same task (`params.replace`), another target, no key in
 * `excluded`. A whole lesson ignores `excluded` (questions are repeatable; a
 * replay plans the same lesson).
 */
export function planLangLesson(
  params: LangParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const rng = mulberry32(seed);
  const replace = (params as LangSessionParams).replace;
  let questions: Question[];
  if (count === 1) {
    const fill = newFill(params, rng, ctx, excluded);
    const able = lessonTasks(params);
    const task = replace && able.includes(replace.task) ? replace.task : pick(rng, able);
    questions = [fresh(fill, task, replace?.target)];
  } else {
    const fill = newFill(params, rng, ctx, []);
    questions = planTasks(params, count, rng).map((task, index) => {
      // Lessons warm up and then stretch.
      fill.env.ctx = { ...ctx, difficulty: Math.min(1, Math.max(0, ctx.difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5))) };
      const unmet = params.teach.filter((phrase) => !fill.met.has(phrase.id));
      fill.env.unmet = unmet;
      const question = fresh(fill, coverTask(task, unmet, count - index, fill.env.pool, params));
      kitKeys(question).forEach((key) => fill.seen.add(key));
      shownIn(question).forEach((id) => fill.met.add(id));
      return question;
    });
  }
  return questions.map((question, index) => ({ ...question, id: `lang-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateLang(params: LangParams, rng: RNG, ctx: GenContext): Question {
  return planLangLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}

/** Pin a replacement to the task that was just missed ("new values, same skill"). */
export function langSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const payload = langPayload(question);
  if (!payload) return params;
  return { ...params, replace: { task: payload.task, target: payload.target } satisfies LangReplace };
}
