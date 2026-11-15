// Course Kit audit — static checks on the authored DATA: pools at the guide's
// minimums, variety, wording limits, one defensible answer, pictures, intro
// slides. Used by scripts/audit-kit.ts.
//
// NO EMOJI: the game does not use emoji. A card's picture is `art` (a named
// icon from src/content/iconNames.ts, or a clock); everything else is words.
// The old `emoji` field is forbidden and any emoji character in any text fails.
import { ICON_NAMES } from "../src/content/iconNames";
import { cardKey } from "../src/engine/kit/cards";
import type {
  BuildTemplate, KitArt, KitItem, KitSlide, KitTemplate, NumberTemplate, OrderTemplate, PairsTemplate, PickTemplate, SortTemplate,
} from "../src/engine/kit/types";
import { VARIETY_MIN, templateVariety } from "../src/engine/kit/variety";

const CARD_CHARS = 28;
const LIST_CHARS = 60;
const TILE_CHARS = 14;
const PROMPT_WORDS = 9;
const EXPLAIN_WORDS = 14;
const TITLE_WORDS = 5;
const FORBIDDEN = /\b(wrong|fail|fails|failed|failing)\b/i;
/** Emoji, flags (regional indicators), the emoji variation selector and keycaps. */
const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{20E3}]/u;
const ICONS = new Set<string>(ICON_NAMES);

export const wordsIn = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const norm = (text: string) => text.trim().toLowerCase();

/** Never an emoji character. */
function checkNoEmoji(text: string, what: string, out: string[]): void {
  if (EMOJI.test(text)) out.push(`${what} "${text}" contains an emoji (the game uses named icons or words, never emoji)`);
}

/** Non-blank, short enough, no emoji and never "wrong" / "fail". */
function checkText(text: string | undefined, what: string, limit: { words?: number; chars?: number }, out: string[]): void {
  if (typeof text !== "string" || !text.trim()) {
    out.push(`${what} is blank`);
    return;
  }
  if (limit.words && wordsIn(text) > limit.words) out.push(`${what} "${text}" has ${wordsIn(text)} words (max ${limit.words})`);
  if (limit.chars && text.length > limit.chars) out.push(`${what} "${text}" has ${text.length} characters (max ${limit.chars})`);
  if (FORBIDDEN.test(text)) out.push(`${what} "${text}" uses a forbidden word (wrong / fail)`);
  checkNoEmoji(text, what, out);
}

/** A picture: a known icon name, or a clock with hour 1–12 and minute 0–59. */
export function checkArt(art: KitArt, what: string, out: string[]): void {
  const raw = art as { kind?: unknown; name?: unknown; hour?: unknown; minute?: unknown };
  if (raw.kind === "icon") {
    if (typeof raw.name !== "string" || !ICONS.has(raw.name)) out.push(`${what}: icon "${String(raw.name)}" is not in ICON_NAMES (use words, or ask for a new icon)`);
    return;
  }
  if (raw.kind === "clock") {
    const hour = Number(raw.hour);
    const minute = Number(raw.minute);
    if (!Number.isInteger(hour) || hour < 1 || hour > 12) out.push(`${what}: clock hour ${String(raw.hour)} (need 1–12)`);
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) out.push(`${what}: clock minute ${String(raw.minute)} (need 0–59)`);
    return;
  }
  out.push(`${what}: unknown art kind "${String(raw.kind)}"`);
}

/** One card: an id, no `emoji` field, a label or a picture (or both), a valid picture. */
export function checkItem(item: KitItem, what: string, chars: number, out: string[]): void {
  if (typeof item.id !== "string" || !item.id.trim()) out.push(`${what}: an item has a blank id`);
  if ("emoji" in item) out.push(`${what} "${item.id}": the emoji field is forbidden — use art: { kind: "icon", name } or words`);
  if (typeof item.label !== "string") {
    out.push(`${what} "${item.id}": label must be a string ("" for a picture-only card)`);
    return;
  }
  if (item.art) checkArt(item.art, `${what} "${item.id}"`, out);
  if (!item.label.trim()) {
    if (!item.art) out.push(`${what} "${item.id}" has neither a label nor art`);
    return; // picture-only cards are exempt from the label rules
  }
  checkText(item.label, `${what} label`, { chars }, out);
}

function checkItems(items: KitItem[], what: string, chars: number, out: string[]): void {
  for (const item of items) checkItem(item, what, chars, out);
}

function checkUniqueIds(items: KitItem[], what: string, out: string[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) out.push(`${what}: item id "${item.id}" is used twice`);
    seen.add(item.id);
  }
}

/** How a card reads in a message: its label, or its picture. */
const shown = (item: KitItem) => item.label.trim() || cardKey(item).slice(1);

/** Cards (label + picture) that appear in more than one of `groups`. */
function sharedCards(groups: KitItem[][]): string[] {
  const owner = new Map<string, number>();
  const shared = new Set<string>();
  groups.forEach((group, index) => group.forEach((item) => {
    const key = cardKey(item);
    if (owner.has(key) && owner.get(key) !== index) shared.add(shown(item));
    owner.set(key, owner.get(key) ?? index);
  }));
  return [...shared];
}

/** Cards that look the same (same label AND same picture) inside one list. */
function duplicateCards(items: KitItem[]): string[] {
  const keys = items.map(cardKey);
  return [...new Set(items.filter((_, index) => keys.indexOf(keys[index]) !== index).map(shown))];
}

// ------------------------------------------------------------------ kinds

function checkPick(t: PickTemplate, out: string[]): void {
  if (t.right.length < 2 || t.wrong.length < 4) out.push(`pool too small: ${t.right.length} right (min 2), ${t.wrong.length} wrong (min 4)`);
  const chars = t.layout === "list" ? LIST_CHARS : CARD_CHARS;
  checkItems([...t.right, ...t.wrong], "option", chars, out);
  if (t.hero) checkItems([t.hero], "hero", chars, out);
  checkUniqueIds([...(t.hero ? [t.hero] : []), ...t.right, ...t.wrong], "pick", out);
  for (const card of sharedCards([t.right, t.wrong])) out.push(`card "${card}" is both right and wrong`);
  for (const card of duplicateCards([...t.right, ...t.wrong])) out.push(`two options look the same ("${card}")`);
}

function checkPairs(t: PairsTemplate, out: string[]): void {
  if (t.pairs.length < 6) out.push(`pool too small: ${t.pairs.length} pairs (min 6)`);
  const left = t.pairs.map((pair) => pair.left);
  const right = t.pairs.map((pair) => pair.right);
  checkItems([...left, ...right], "pair card", CARD_CHARS, out);
  // Left and right ids must differ too: a decoy keeps its own id, so it must not equal a left card's.
  checkUniqueIds([...left, ...right], "pairs", out);
  for (const card of duplicateCards(left)) out.push(`two left cards look the same ("${card}") — a match must be unambiguous`);
  for (const card of duplicateCards(right)) out.push(`two right cards look the same ("${card}") — a match must be unambiguous`);
}

function checkOrder(t: OrderTemplate, out: string[]): void {
  const longest = Math.max(0, ...t.sequences.map((steps) => steps.length));
  if (t.sequences.length < 3 && longest < 6) out.push(`pool too small: ${t.sequences.length} sequence(s), longest ${longest} steps (need ≥ 3 sequences or one of ≥ 6 steps)`);
  t.sequences.forEach((steps, index) => {
    if (steps.length < 3) out.push(`sequence ${index + 1} has ${steps.length} steps (min 3)`);
    for (const card of duplicateCards(steps)) out.push(`sequence ${index + 1} repeats the card "${card}"`);
  });
  checkItems(t.sequences.flat(), "step", CARD_CHARS, out);
  checkUniqueIds(t.sequences.flat(), "order", out);
}

function checkSort(t: SortTemplate, out: string[]): void {
  if (t.buckets.length < 2 || t.buckets.length > 3) out.push(`${t.buckets.length} buckets (need 2–3)`);
  t.buckets.forEach((entry) => {
    if (entry.items.length < 4) out.push(`pool too small: bucket "${shown(entry.bucket)}" has ${entry.items.length} items (min 4)`);
  });
  const buckets = t.buckets.map((entry) => entry.bucket);
  checkItems([...buckets, ...t.buckets.flatMap((entry) => entry.items)], "sort card", CARD_CHARS, out);
  checkUniqueIds([...buckets, ...t.buckets.flatMap((entry) => entry.items)], "sort", out);
  for (const card of sharedCards(t.buckets.map((entry) => entry.items))) out.push(`card "${card}" is in two buckets`);
}

function checkBuild(t: BuildTemplate, out: string[]): void {
  if (t.sentences.length < 4) out.push(`pool too small: ${t.sentences.length} sentences (min 4)`);
  if (t.hero) checkItems([t.hero], "hero", CARD_CHARS, out);
  t.sentences.forEach(({ words, decoys }, index) => {
    const what = `sentence ${index + 1}`;
    if (words.length < 3 || words.length > 7) out.push(`${what} has ${words.length} words (need 3–7)`);
    for (const tile of [...words, ...decoys]) checkText(tile, `${what} tile`, { chars: TILE_CHARS }, out);
    const own = new Set(words.map(norm));
    for (const decoy of decoys) if (own.has(norm(decoy))) out.push(`${what}: decoy "${decoy}" is also a word of the sentence`);
  });
  const sentences = t.sentences.map(({ words }) => norm(words.join(" ")));
  if (new Set(sentences).size !== sentences.length) out.push("two sentences are the same");
}

function checkNumber(t: NumberTemplate, out: string[]): void {
  if (t.variants.length < 6) out.push(`pool too small: ${t.variants.length} variants (min 6)`);
  t.variants.forEach((variant, index) => {
    const what = `variant ${index + 1}`;
    if (!Number.isInteger(variant.answer) || variant.answer < 0) out.push(`${what}: answer ${variant.answer} is not a whole number ≥ 0`);
    checkItems(variant.items, `${what} item`, CARD_CHARS, out);
    if (variant.caption !== undefined) checkText(variant.caption, `${what} caption`, { chars: LIST_CHARS }, out);
  });
}

function checkKind(t: KitTemplate, out: string[]): void {
  switch (t.kind) {
    case "pick": return checkPick(t, out);
    case "pairs": return checkPairs(t, out);
    case "order": return checkOrder(t, out);
    case "sort": return checkSort(t, out);
    case "build": return checkBuild(t, out);
    case "number": return checkNumber(t, out);
    default: out.push(`unknown kind "${(t as { kind?: string }).kind}"`);
  }
}

/** Every static rule for one template; failures are prefixed with `label`. */
export function checkTemplate(t: KitTemplate, label: string, failures: string[]): void {
  const out: string[] = [];
  checkText(t.prompt, "prompt", { words: PROMPT_WORDS }, out);
  checkText(t.explain, "explain", { words: EXPLAIN_WORDS }, out);
  checkKind(t, out);
  const variety = templateVariety(t);
  if (variety < VARIETY_MIN) out.push(`variety ${variety} (min ${VARIETY_MIN} distinct samples)`);
  failures.push(...out.map((message) => `${label} template "${t.id}" (${t.kind}): ${message}`));
}

/** Teach-first slides: 1–4 slides, a title of ≤ 5 words, 1–2 lines of ≤ 9 words, optional art. */
export function checkIntro(slides: KitSlide[] | undefined, label: string, failures: string[]): void {
  if (slides === undefined) return;
  const out: string[] = [];
  if (!Array.isArray(slides) || slides.length < 1 || slides.length > 4) out.push(`${slides?.length ?? 0} intro slides (need 1–4)`);
  (Array.isArray(slides) ? slides : []).forEach((slide, index) => {
    const what = `slide ${index + 1}`;
    if ("emoji" in slide) out.push(`${what}: the emoji field is forbidden — use art: { kind: "icon", name }`);
    if (slide.art) checkArt(slide.art, what, out);
    checkText(slide.title, `${what} title`, { words: TITLE_WORDS }, out);
    const lines = Array.isArray(slide.lines) ? slide.lines : [];
    if (lines.length < 1 || lines.length > 2) out.push(`${what} has ${lines.length} lines (need 1–2)`);
    lines.forEach((line) => checkText(line, `${what} line`, { words: PROMPT_WORDS }, out));
  });
  failures.push(...out.map((message) => `${label} intro: ${message}`));
}
