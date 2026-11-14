// World Tour — the Duolingo-style lesson mode. This file is the CONTRACT shared
// by the question planner (engine), the exercise widgets (UI) and the lesson
// screen. Every tour question is a normal engine `Question` with
// `inputMode: "tour"`, `repeatable: true` and one of the payloads below, so the
// global answer-integrity flow (store.answer → answerTransition) judges it by
// plain `typed === question.answer` like every other world.
import type { Question } from "../generators/types";

export type TourKind = "pick" | "pairs" | "build" | "map" | "sort" | "paint";

/** Stage params for a tour lesson (StageDef.params). */
export interface TourParams {
  /** Countries this lesson introduces / centres on (ISO-3 codes). */
  focus: string[];
  /** Earlier countries mixed in for spaced review. */
  review: string[];
  /** Exercise kinds this lesson may use. */
  kinds: TourKind[];
}

interface TourBase {
  tour: TourKind;
  /** Countries a first-try correct answer earns passport credit for. */
  codes: string[];
  /** Tap-guessable exercises demand a second correct answer after a miss. */
  guessable?: boolean;
}

/** Hear / read a country, tap its card. answer = the country code. */
export interface PickPayload extends TourBase {
  tour: "pick";
  /** What the prompt shows next to the question. "name" is also spoken. */
  ask: "name" | "flag" | "outline";
  /** What the four option cards show. */
  show: "flag" | "outline";
  code: string;
  /** Option country codes, shuffled, includes `code`. */
  options: string[];
}

/** Tap-to-match board. answer = pairsAnswer(left). */
export interface PairsPayload extends TourBase {
  tour: "pairs";
  /** What the left column shows; the right column always shows names. */
  leftKind: "flag" | "outline";
  /** Left column country codes, shuffled. */
  left: string[];
  /** Right column country codes, shuffled; may hold decoys not in `left`. */
  right: string[];
}

/** Build the country name from chunk tiles. answer = buildAnswer(correct tiles). */
export interface BuildPayload extends TourBase {
  tour: "build";
  /** What is shown above the tiles. */
  from: "flag" | "outline";
  code: string;
  /** Shuffled upper-case chunks, including decoys. Duplicates are possible. */
  tiles: string[];
  /** Letter count of each word of the name, e.g. [5, 6] for SAUDI ARABIA. */
  words: number[];
}

/** Tap the country on a zoomed map. answer = the country code. */
export interface MapPayload extends TourBase {
  tour: "map";
  /** Prompt shows the country's name or only its flag. */
  ask: "name" | "flag";
  code: string;
  /** SVG viewBox [x, y, w, h] in the 360×180 world coordinate space. */
  view: [number, number, number, number];
  /** Tappable country codes drawn inside the view (includes `code`). */
  targets: string[];
}

/** Sort country cards into continent buckets. answer = sortAnswer(...). */
export interface SortPayload extends TourBase {
  tour: "sort";
  /** Continent names, in display order. */
  buckets: string[];
  /** Country codes to sort, shuffled. */
  cards: string[];
}

/** Paint the bands of a striped flag. answer = paintAnswer(colors). */
export interface PaintPayload extends TourBase {
  tour: "paint";
  code: string;
  /** "v" = side-by-side bands (left→right), "h" = stacked (top→bottom). */
  dir: "v" | "h";
  /** Relative size of each band; its length is the band count. */
  weights: number[];
  /** Paint colour ids on offer (see PAINT_COLORS), shuffled. */
  palette: string[];
  /** Easy mode: the real flag stays visible to copy. */
  peek: boolean;
}

export type TourPayload =
  | PickPayload
  | PairsPayload
  | BuildPayload
  | MapPayload
  | SortPayload
  | PaintPayload;

/** Narrow a generic question to its tour payload (null for other worlds). */
export function tourPayload(q: Question | null | undefined): TourPayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" ? (q.payload as unknown as TourPayload) : null;
}
