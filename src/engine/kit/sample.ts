// Course Kit sampling: turns ONE template into ONE fresh question. Which items
// a question shows is drawn with the seeded rng; the question's identity
// (dedupeKey) is the template id plus a fingerprint of WHICH items were drawn,
// so two different samples never collide and the same sample is recognised
// whatever order its cards were shuffled into.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { orderAnswer, pairsAnswer, sentenceAnswer, sortAnswer } from "./answers";
import type {
  BuildTemplate, KitItem, KitPayload, KitTemplate, NumberTemplate, OrderTemplate, PairsTemplate, PickTemplate, SortTemplate,
} from "./types";

/** At most this many tiles in a build question (sentence words + decoys). */
export const MAX_TILES = 9;
/** Bounded reshuffles before a deterministic fallback ("not already in order"). */
const RESHUFFLES = 12;

/** A drawn question plus the fingerprint of what was drawn. */
export interface Sample {
  fingerprint: string;
  question: Question;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ------------------------------------------------------------------ sizes

/** Options in a pick: 4; 3 when easier, or for a gentle sentence list. */
export function pickSize(template: PickTemplate, ctx: GenContext): number {
  const gentleList = template.layout === "list" && ctx.difficulty < 0.5;
  return ctx.easier || gentleList ? 3 : 4;
}

/** Pairs on the board: 4; 3 when easier; 5 when hard and the pool allows. */
export function pairsSize(template: PairsTemplate, ctx: GenContext): number {
  if (ctx.easier) return Math.min(3, template.pairs.length);
  if (ctx.difficulty > 0.6 && template.pairs.length >= 5) return 5;
  return Math.min(4, template.pairs.length);
}

/** Cards in an order question (before capping by the sequence length). */
export function orderSize(ctx: GenContext): number {
  if (ctx.easier) return 3;
  return ctx.difficulty > 0.6 ? 5 : 4;
}

/** Cards in a sort question: 4–6 with difficulty, 4 when easier. */
export function sortSize(ctx: GenContext): number {
  if (ctx.easier || ctx.difficulty < 1 / 3) return 4;
  return ctx.difficulty < 2 / 3 ? 5 : 6;
}

/** Decoy tiles in a build question: 1 when easier, all otherwise, never past MAX_TILES. */
export function decoyCount(words: number, decoys: number, easier: boolean): number {
  const wanted = easier ? Math.min(1, decoys) : decoys;
  return clamp(Math.min(wanted, MAX_TILES - words), 0, decoys);
}

// --------------------------------------------------------------- question

const byId = (a: string, b: string) => (a < b ? -1 : Number(a > b));
const fingerprintOf = (ids: string[]) => [...ids].sort(byId).join("+");

function finish(template: KitTemplate, fingerprint: string, answer: string, payload: KitPayload): Sample {
  return {
    fingerprint,
    question: {
      id: "", prompt: template.prompt, answer, choices: [], hint: template.explain, inputMode: "tour", repeatable: true,
      dedupeKey: `kit:${template.id}:${fingerprint}`, payload: payload as unknown as Record<string, unknown>,
    },
  };
}

const baseOf = (template: KitTemplate) => ({ template: template.id, explain: template.explain });
const heroOf = (hero: KitItem | undefined) => (hero ? { hero } : {});

/** A permutation of `list` that is not the original order (when one exists). */
function outOfOrder<T>(rng: RNG, list: T[], inOrder: (candidate: T[]) => boolean): T[] {
  let candidate = shuffle(rng, list);
  for (let i = 0; i < RESHUFFLES && inOrder(candidate); i++) candidate = shuffle(rng, list);
  if (!inOrder(candidate)) return candidate;
  const reversed = [...list].reverse();
  return inOrder(reversed) ? candidate : reversed;
}

// ---------------------------------------------------------------- samplers

function samplePick(template: PickTemplate, rng: RNG, ctx: GenContext): Sample {
  const right = pick(rng, template.right);
  const distractors = shuffle(rng, template.wrong).slice(0, pickSize(template, ctx) - 1);
  return finish(template, fingerprintOf([right.id, ...distractors.map((item) => item.id)]), right.id, {
    ...baseOf(template), tour: "kit-pick", ...heroOf(template.hero),
    options: shuffle(rng, [right, ...distractors]), layout: template.layout ?? "grid", guessable: true,
  });
}

function samplePairs(template: PairsTemplate, rng: RNG, ctx: GenContext): Sample {
  const drawn = shuffle(rng, template.pairs);
  const shown = drawn.slice(0, pairsSize(template, ctx));
  const unused = drawn.slice(shown.length);
  const left = shown.map((pair) => pair.left);
  // Partners carry their left card's id (the widget matches by id); a decoy keeps its own.
  const right = shown.map((pair) => ({ ...pair.right, id: pair.left.id }));
  if (ctx.difficulty > 0.3 && !ctx.easier && unused.length) right.push(unused[0].right);
  const ids = left.map((item) => item.id);
  return finish(template, fingerprintOf(ids), pairsAnswer(ids), {
    ...baseOf(template), tour: "kit-pairs", left: shuffle(rng, left), right: shuffle(rng, right),
  });
}

/** `size` steps of `sequence`, keeping their relative order. */
function orderedSubset(rng: RNG, sequence: KitItem[], size: number): KitItem[] {
  if (sequence.length <= size) return sequence;
  const keep = new Set(shuffle(rng, sequence.map((_, index) => index)).slice(0, size));
  return sequence.filter((_, index) => keep.has(index));
}

function sampleOrder(template: OrderTemplate, rng: RNG, ctx: GenContext): Sample {
  const steps = orderedSubset(rng, pick(rng, template.sequences), orderSize(ctx));
  const ids = steps.map((step) => step.id);
  const answer = orderAnswer(ids);
  const cards = outOfOrder(rng, steps, (candidate) => orderAnswer(candidate.map((step) => step.id)) === answer);
  return finish(template, fingerprintOf(ids), answer, { ...baseOf(template), tour: "kit-order", cards });
}

function sampleSort(template: SortTemplate, rng: RNG, ctx: GenContext): Sample {
  const owner = new Map<string, string>();
  const entries = template.buckets.map((entry) => shuffle(rng, entry.items).map((item) => ({ item, bucket: entry.bucket.id })));
  const total = entries.reduce((sum, list) => sum + list.length, 0);
  const size = Math.min(Math.max(sortSize(ctx), entries.length), total);
  // One card per bucket first (no bucket is ever empty), then any of the rest.
  const firsts = entries.filter((list) => list.length).map((list) => list[0]);
  const rest = shuffle(rng, entries.flatMap((list) => list.slice(1)));
  const chosen = [...firsts, ...rest].slice(0, size);
  chosen.forEach(({ item, bucket }) => owner.set(item.id, bucket));
  const placed = Object.fromEntries(owner);
  const buckets = template.buckets.map((entry) => entry.bucket);
  return finish(template, fingerprintOf([...owner.keys()]), sortAnswer(buckets.map((bucket) => bucket.id), placed), {
    ...baseOf(template), tour: "kit-sort", buckets, cards: shuffle(rng, chosen.map(({ item }) => item)),
  });
}

function sampleBuild(template: BuildTemplate, rng: RNG, ctx: GenContext): Sample {
  const index = Math.floor(rng() * template.sentences.length);
  const { words, decoys } = template.sentences[index];
  const extra = shuffle(rng, decoys).slice(0, decoyCount(words.length, decoys.length, ctx.easier));
  const tiles = [...words.map((text) => ({ text, word: true })), ...extra.map((text) => ({ text, word: false }))];
  const answer = sentenceAnswer(words);
  // "In order" = the sentence's own tiles already read left to right.
  const inOrder = (candidate: typeof tiles) => sentenceAnswer(candidate.filter((tile) => tile.word).map((tile) => tile.text)) === answer;
  const arranged = outOfOrder(rng, tiles, inOrder);
  return finish(template, `s${index}`, answer, {
    ...baseOf(template), tour: "kit-build", ...heroOf(template.hero), tiles: arranged.map((tile) => tile.text),
  });
}

function sampleNumber(template: NumberTemplate, rng: RNG): Sample {
  const index = Math.floor(rng() * template.variants.length);
  const variant = template.variants[index];
  return finish(template, `v${index}`, String(variant.answer), {
    ...baseOf(template), tour: "kit-number", items: variant.items,
    ...(variant.caption === undefined ? {} : { caption: variant.caption }),
  });
}

/** One random sample of `template` at the sizes `ctx` asks for. */
export function sampleTemplate(template: KitTemplate, rng: RNG, ctx: GenContext): Sample {
  switch (template.kind) {
    case "pick": return samplePick(template, rng, ctx);
    case "pairs": return samplePairs(template, rng, ctx);
    case "order": return sampleOrder(template, rng, ctx);
    case "sort": return sampleSort(template, rng, ctx);
    case "build": return sampleBuild(template, rng, ctx);
    default: return sampleNumber(template, rng);
  }
}

// ---------------------------------------------------------------- identity

export function subjectKey(dedupeKey: string): string {
  return `subject:${dedupeKey}`;
}

/**
 * Same identity keys as `questionKeys` in generators/index (which imports the
 * planner, so it cannot be imported back here). scripts/audit-kit.ts checks
 * the two never drift apart.
 */
export function kitKeys(q: Question): string[] {
  const visible = `visible:${JSON.stringify([q.prompt, q.answer, q.payload ?? null])}`;
  return q.dedupeKey ? [subjectKey(q.dedupeKey), visible] : [visible];
}

export function isFresh(q: Question, seen: ReadonlySet<string>): boolean {
  return !kitKeys(q).some((key) => seen.has(key));
}

/** The template id a kit question was sampled from. */
export function templateOf(q: Question): string {
  return (q.payload as { template?: string } | undefined)?.template ?? "";
}
