// Course Kit — CONTRACT for data-driven courses. A kit course needs no new
// engine code and no new React: its lessons are lists of TEMPLATES (below), and
// the kit planner turns each template into fresh questions by sampling from the
// pools the author wrote. Every kit question is a normal engine `Question`
// with `inputMode: "tour"`, `repeatable: true` and a `kit-*` payload; the store
// judges it with plain `typed === question.answer` (serialisers: ./answers.ts).
import type { IconName } from "../../content/iconNames";
import type { Question } from "../generators/types";

/**
 * A picture on a card or slide. The game does NOT use emoji: a picture is a
 * drawn icon by name (src/content/iconNames.ts) or generated art (a clock).
 * No icon fits? Use words — never emoji, never a new icon name of your own.
 */
export type KitArt =
  | { kind: "icon"; name: IconName }
  /** An analog clock face showing this time (hour 1–12, minute 0–59). */
  | { kind: "clock"; hour: number; minute: number };

/** One card: words and/or a picture. Ids are unique inside a template. */
export interface KitItem {
  id: string;
  /** Short text on the card (≤ 28 characters for grid cards; sentences use `layout: "list"`).
   * May be "" when the card is a picture only (then `art` is required). */
  label: string;
  /** Optional picture. Two cards are different when their label OR their art differs. */
  art?: KitArt;
}

// ---------------------------------------------------------------- templates

interface TemplateBase {
  /** Unique inside the course; replacements stay on the same template. */
  id: string;
  /** What Pogo asks (≤ 9 simple words). */
  prompt: string;
  /** One warm line that teaches the idea — shown on the "Almost — look at this." card. */
  explain: string;
}

/** Tap the one right card. Pools: ≥ 2 right, ≥ 4 wrong (variety for replacements). */
export interface PickTemplate extends TemplateBase {
  kind: "pick";
  /** Optional big card above the options: the thing being asked about. */
  hero?: KitItem;
  right: KitItem[];
  wrong: KitItem[];
  /** "list" = full-width rows for sentences; default "grid" (tiles: a picture and/or a short label). */
  layout?: "grid" | "list";
}

/** Match each left card to its partner. Pool: ≥ 6 pairs; 3–5 are shown. */
export interface PairsTemplate extends TemplateBase {
  kind: "pairs";
  pairs: Array<{ left: KitItem; right: KitItem }>;
}

/** Put the cards in order. Each sequence is already in the RIGHT order; give ≥ 3
 * sequences, or one long one (≥ 6 steps) from which ordered subsets are drawn. */
export interface OrderTemplate extends TemplateBase {
  kind: "order";
  sequences: KitItem[][];
}

/** Drop each card into its bucket. 2–3 buckets, ≥ 4 items per bucket. */
export interface SortTemplate extends TemplateBase {
  kind: "sort";
  buckets: Array<{ bucket: KitItem; items: KitItem[] }>;
}

/** Build a sentence from word tiles. ≥ 4 sentences; each lists its own decoy tiles. */
export interface BuildTemplate extends TemplateBase {
  kind: "build";
  hero?: KitItem;
  sentences: Array<{ words: string[]; decoys: string[] }>;
}

/** Type a number. ≥ 6 variants; `items` are drawn above the pad (things to count / read). */
export interface NumberTemplate extends TemplateBase {
  kind: "number";
  variants: Array<{ items: KitItem[]; answer: number; caption?: string }>;
}

export type KitTemplate = PickTemplate | PairsTemplate | OrderTemplate | SortTemplate | BuildTemplate | NumberTemplate;

/** A teach-first slide shown before the first question of a lesson. */
export interface KitSlide {
  /** The picture in the slide's big badge (optional: without one, Pogo presents alone). */
  art?: KitArt;
  title: string;
  /** One or two short lines (≤ 9 simple words each). */
  lines: string[];
}

/** Stage params of a kit lesson (StageDef.params). */
export interface KitParams {
  /** Templates this lesson draws from. */
  templates: KitTemplate[];
  /** Templates of earlier lessons, mixed in for spaced review. */
  review: KitTemplate[];
  /** Teach-first slides ("Meet the idea"). */
  intro?: KitSlide[];
}

// ----------------------------------------------------------------- payloads

export type KitKind = "kit-pick" | "kit-pairs" | "kit-order" | "kit-sort" | "kit-build" | "kit-number";

interface KitBase {
  tour: KitKind;
  /** Template the question came from. */
  template: string;
  /** Shown on the teach card after a miss. */
  explain: string;
  guessable?: boolean;
}

/** answer = the right option's id. */
export interface KitPickPayload extends KitBase {
  tour: "kit-pick";
  hero?: KitItem;
  options: KitItem[];
  layout: "grid" | "list";
}

/** Partners share an id. answer = pairsAnswer(left ids). Right may hold one decoy. */
export interface KitPairsPayload extends KitBase {
  tour: "kit-pairs";
  left: KitItem[];
  right: KitItem[];
}

/** answer = orderAnswer(ids in the right order). `cards` arrive shuffled. */
export interface KitOrderPayload extends KitBase {
  tour: "kit-order";
  cards: KitItem[];
}

/** answer = sortAnswer(bucket ids, { cardId: bucketId }). */
export interface KitSortPayload extends KitBase {
  tour: "kit-sort";
  buckets: KitItem[];
  cards: KitItem[];
}

/** answer = sentenceAnswer(words in order). `tiles` arrive shuffled, decoys included. */
export interface KitBuildPayload extends KitBase {
  tour: "kit-build";
  hero?: KitItem;
  tiles: string[];
}

/** answer = String(number). */
export interface KitNumberPayload extends KitBase {
  tour: "kit-number";
  items: KitItem[];
  caption?: string;
}

export type KitPayload =
  | KitPickPayload
  | KitPairsPayload
  | KitOrderPayload
  | KitSortPayload
  | KitBuildPayload
  | KitNumberPayload;

/** Narrow a generic question to its kit payload (null for everything else). */
export function kitPayload(q: Question | null | undefined): KitPayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" && p.tour.startsWith("kit-")
    ? (q.payload as unknown as KitPayload)
    : null;
}
