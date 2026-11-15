// Course Kit audit — checks ONE planned question against its template: the
// payload contract in src/engine/kit/types.ts, and the answer recomputed with
// the same helpers the widgets use (src/engine/kit/answers.ts).
// `checkKitCards` checks the cards of ANY kit payload (also the ones other
// planners build directly, like Tick Tock's clock boards): picture-only
// cards (label "", art set) are fine; a card with neither, or an emoji field, is not.
import type { Question } from "../src/engine/generators/types";
import { orderAnswer, pairsAnswer, sentenceAnswer, sortAnswer } from "../src/engine/kit/answers";
import { cardKey } from "../src/engine/kit/cards";
import { MAX_TILES } from "../src/engine/kit/sample";
import {
  kitPayload,
  type BuildTemplate, type KitBuildPayload, type KitItem, type KitNumberPayload, type KitOrderPayload, type KitPairsPayload,
  type KitPayload, type KitPickPayload, type KitSortPayload, type KitTemplate, type NumberTemplate, type OrderTemplate,
  type PairsTemplate, type PickTemplate, type SortTemplate,
} from "../src/engine/kit/types";

const idsOf = (items: KitItem[]) => items.map((item) => item.id);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const unique = (list: string[]) => new Set(list).size === list.length;

/** Every card a payload shows (hero, options, both pair sides, cards, buckets, counted items). */
function cardsOf(p: KitPayload): KitItem[] {
  switch (p.tour) {
    case "kit-pick": return [...(p.hero ? [p.hero] : []), ...p.options];
    case "kit-pairs": return [...p.left, ...p.right];
    case "kit-order": return p.cards;
    case "kit-sort": return [...p.buckets, ...p.cards];
    case "kit-build": return p.hero ? [p.hero] : [];
    default: return p.items;
  }
}

/** Card shape rules for any kit payload; returns failure messages. */
export function checkKitCards(p: KitPayload): string[] {
  const out: string[] = [];
  for (const card of cardsOf(p)) {
    const what = `card "${String(card?.id)}"`;
    if (typeof card?.id !== "string" || !card.id) out.push("a card has no id");
    else if ("emoji" in card) out.push(`${what} has an emoji field (use art)`);
    else if (typeof card.label !== "string") out.push(`${what} has no label string`);
    else if (!card.label.trim() && !card.art) out.push(`${what} has neither a label nor art`);
    else if (card.art && card.art.kind !== "icon" && card.art.kind !== "clock") out.push(`${what} has unknown art`);
  }
  return out;
}

function checkPick(q: Question, p: KitPickPayload, t: PickTemplate, out: string[]): void {
  const right = new Set(idsOf(t.right));
  const wrong = new Set(idsOf(t.wrong));
  const correct = p.options.filter((option) => right.has(option.id));
  if (correct.length !== 1) out.push(`${correct.length} right options (need exactly 1)`);
  if (correct[0] && q.answer !== correct[0].id) out.push(`answer ${q.answer} is not the right option`);
  if (p.options.some((option) => !right.has(option.id) && !wrong.has(option.id))) out.push("an option is not from the template");
  if (p.options.length < 3 || p.options.length > 4) out.push(`${p.options.length} options (need 3–4)`);
  if (!unique(idsOf(p.options))) out.push("repeated option");
  if (p.layout !== (t.layout ?? "grid")) out.push(`layout ${p.layout}`);
  if (p.guessable !== true) out.push("pick is not marked guessable");
  if (!same(p.hero, t.hero)) out.push("hero differs from the template");
}

function checkPairs(q: Question, p: KitPairsPayload, t: PairsTemplate, out: string[]): void {
  const byLeft = new Map(t.pairs.map((pair) => [pair.left.id, pair]));
  const leftIds = idsOf(p.left);
  if (p.left.length < 3 || p.left.length > 5) out.push(`${p.left.length} pairs on the board (need 3–5)`);
  if (!unique(leftIds) || !unique(idsOf(p.right))) out.push("repeated card id");
  if (leftIds.some((id) => !byLeft.has(id))) out.push("a left card is not from the template");
  for (const id of leftIds) {
    const card = p.right.find((item) => item.id === id);
    if (!card) out.push(`left card ${id} has no partner on the right`);
    else if (cardKey(card) !== cardKey(byLeft.get(id)?.right ?? card)) out.push(`partner of ${id} looks like another card`);
  }
  const decoys = p.right.filter((item) => !leftIds.includes(item.id));
  if (decoys.length > 1) out.push(`${decoys.length} decoys (max 1)`);
  const spare = new Set(t.pairs.filter((pair) => !leftIds.includes(pair.left.id)).map((pair) => pair.right.id));
  if (decoys.some((item) => !spare.has(item.id))) out.push("the decoy is not an unused partner");
  if (q.answer !== pairsAnswer(leftIds)) out.push("answer is not pairsAnswer(left ids)");
}

function checkOrder(q: Question, p: KitOrderPayload, t: OrderTemplate, out: string[]): void {
  const answer = q.answer.split(">");
  const cards = idsOf(p.cards);
  if (!same([...answer].sort(), [...cards].sort())) out.push("cards are not a permutation of the answer");
  if (cards.length >= 2 && orderAnswer(cards) === q.answer) out.push("cards arrive already in order");
  if (cards.length < Math.min(3, Math.max(...t.sequences.map((s) => s.length))) || cards.length > 5) out.push(`${cards.length} cards`);
  const home = t.sequences.find((steps) => answer.every((id) => idsOf(steps).includes(id)));
  const kept = home ? idsOf(home).filter((id) => answer.includes(id)) : [];
  if (!home || orderAnswer(kept) !== q.answer) out.push("answer does not keep the sequence's order");
}

function checkSort(q: Question, p: KitSortPayload, t: SortTemplate, out: string[]): void {
  const owner = new Map(t.buckets.flatMap((entry) => entry.items.map((item) => [item.id, entry.bucket.id] as const)));
  const buckets = idsOf(p.buckets);
  if (!same(buckets, t.buckets.map((entry) => entry.bucket.id))) out.push("buckets differ from the template");
  if (p.cards.length < 4 || p.cards.length > 6) out.push(`${p.cards.length} cards (need 4–6)`);
  if (!unique(idsOf(p.cards))) out.push("repeated card");
  const placed: Record<string, string> = {};
  for (const card of p.cards) {
    const bucket = owner.get(card.id);
    if (bucket) placed[card.id] = bucket;
    else out.push(`card ${card.id} has no bucket`);
  }
  const filled = buckets.map((bucket) => p.cards.filter((card) => placed[card.id] === bucket).length);
  if (filled.some((n) => n === 0)) out.push("a bucket gets no card");
  if (filled.some((n) => n === p.cards.length)) out.push("one bucket holds every card");
  if (q.answer !== sortAnswer(buckets, placed)) out.push("answer is not sortAnswer(buckets, placed)");
}

/** `tiles` minus one copy of each of `remove`. */
function without(tiles: string[], remove: string[]): string[] {
  const left = [...tiles];
  for (const tile of remove) {
    const index = left.indexOf(tile);
    if (index >= 0) left.splice(index, 1);
  }
  return left;
}

function checkBuild(q: Question, p: KitBuildPayload, t: BuildTemplate, out: string[]): void {
  const sentence = t.sentences.find(({ words }) => sentenceAnswer(words) === q.answer);
  if (!sentence) {
    out.push("answer is not one of the template's sentences");
    return;
  }
  const extra = without(p.tiles, sentence.words);
  if (p.tiles.length - extra.length !== sentence.words.length) out.push("tiles do not contain the sentence");
  if (extra.some((tile) => !sentence.decoys.includes(tile))) out.push("a tile is neither a word nor a decoy");
  if (sentence.words.length <= MAX_TILES && p.tiles.length > MAX_TILES) out.push(`${p.tiles.length} tiles (max ${MAX_TILES})`);
  const placed = without(p.tiles, extra);
  if (new Set(sentence.words).size > 1 && sentenceAnswer(placed) === q.answer) out.push("tiles arrive already in order");
  if (!same(p.hero, t.hero)) out.push("hero differs from the template");
}

function checkNumber(q: Question, p: KitNumberPayload, t: NumberTemplate, out: string[]): void {
  const variant = t.variants.find((entry) => same(entry.items, p.items) && entry.caption === p.caption);
  if (!variant) out.push("items are not one of the template's variants");
  else if (q.answer !== String(variant.answer)) out.push(`answer ${q.answer} ≠ ${variant.answer}`);
}

function checkKind(q: Question, p: KitPayload, t: KitTemplate, out: string[]): void {
  if (p.tour !== `kit-${t.kind}`) {
    out.push(`payload ${p.tour} for a ${t.kind} template`);
    return;
  }
  if (t.kind === "pick") checkPick(q, p as KitPickPayload, t, out);
  else if (t.kind === "pairs") checkPairs(q, p as KitPairsPayload, t, out);
  else if (t.kind === "order") checkOrder(q, p as KitOrderPayload, t, out);
  else if (t.kind === "sort") checkSort(q, p as KitSortPayload, t, out);
  else if (t.kind === "build") checkBuild(q, p as KitBuildPayload, t, out);
  else checkNumber(q, p as KitNumberPayload, t, out);
}

/** Validate one kit question; returns its payload when it is well-formed enough to inspect. */
export function checkKitQuestion(
  q: Question, templates: ReadonlyMap<string, KitTemplate>, label: string, failures: string[],
): KitPayload | null {
  const p = kitPayload(q);
  if (!p) {
    failures.push(`${label}: not a kit question`);
    return null;
  }
  const t = templates.get(p.template);
  if (!t) {
    failures.push(`${label}: template "${p.template}" is not in this lesson`);
    return null;
  }
  const out: string[] = [];
  if (q.inputMode !== "tour" || q.repeatable !== true || q.choices.length) out.push("must be inputMode tour, repeatable, no choices");
  if (q.prompt !== t.prompt || q.hint !== t.explain || p.explain !== t.explain) out.push("prompt / hint / explain differ from the template");
  if (!q.dedupeKey?.startsWith(`kit:${t.id}:`)) out.push(`dedupeKey ${q.dedupeKey}`);
  if (!q.answer.trim()) out.push("blank answer");
  try {
    out.push(...checkKitCards(p));
    checkKind(q, p, t, out);
  } catch (error) {
    out.push(`malformed payload (${String(error)})`);
  }
  failures.push(...out.map((message) => `${label} [${t.id}]: ${message}`));
  return p;
}
