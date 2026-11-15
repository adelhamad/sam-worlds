// What a whole letter reports to a lesson. Pure: it re-judges every attempt
// itself, so the verdict never depends on what a widget believed.
import { judgeGlyphStroke } from "./judge";
import { MAX_SLIPS } from "./tolerance";
import type { GlyphStrokes, GuideLevel, TraceAttempt } from "./types";

/** The answer of every tracing question: every stroke written, in order, with few slips. */
export const TRACE_DONE = "traced";

export interface TraceTally {
  /** Strokes completed, in order. */
  done: number;
  /** Failed attempts. */
  slips: number;
  /** An attempt aimed at a stroke other than the next one. */
  outOfOrder: boolean;
}

export function traceTally(glyph: GlyphStrokes, attempts: readonly TraceAttempt[], guide: GuideLevel = "guided"): TraceTally {
  let done = 0;
  let slips = 0;
  let outOfOrder = false;
  for (const attempt of attempts) {
    if (attempt.stroke !== done || done >= glyph.strokes.length) {
      outOfOrder = true;
      continue;
    }
    if (judgeGlyphStroke(glyph, done, attempt.points, guide).ok) done++;
    else slips++;
  }
  return { done, slips, outOfOrder };
}

/**
 * TRACE_DONE when every stroke was completed in order with at most MAX_SLIPS
 * failed attempts in total; otherwise `miss:<detail>` (`miss:order`,
 * `miss:unfinished:2/4`, `miss:slips:5`).
 */
export function traceVerdict(glyph: GlyphStrokes, attempts: readonly TraceAttempt[], guide: GuideLevel = "guided"): string {
  const { done, slips, outOfOrder } = traceTally(glyph, attempts, guide);
  if (outOfOrder) return "miss:order";
  if (slips > MAX_SLIPS) return `miss:slips:${slips}`;
  if (done < glyph.strokes.length) return `miss:unfinished:${done}/${glyph.strokes.length}`;
  return TRACE_DONE;
}
