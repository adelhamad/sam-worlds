// Handwriting tracer — data contract. Pure types, no React.
// Coordinates are design-box units: a square `box` (1000) wide, y pointing down.

export type Point = [number, number];

/** `line`: follow the points in order. `dot`: a tap (or a tiny dab) on points[0]. */
export type StrokeKind = "line" | "dot";

export interface Stroke {
  kind: StrokeKind;
  points: Point[];
}

/** How to draw the guide letter so it lines up with the strokes exactly. */
export interface GlyphFont {
  family: string;
  weight: number;
  /** Font size in design units. */
  size: number;
  /** Alphabetic baseline, design units from the top of the box. */
  baseline: number;
}

/** One letter as the stroke builder writes it (src/content/arabic/strokes.gen.ts). */
export interface RawGlyph {
  char: string;
  /** Where the text is anchored (text-anchor middle / textAlign center), design units. */
  x: number;
  /** The font's stroke width for this letter, design units. */
  width: number;
  strokes: Stroke[];
}

/** Everything the tracer needs to show and judge one letter. */
export interface GlyphStrokes extends RawGlyph {
  id: string;
  box: number;
  font: GlyphFont;
}

/** `guided`: the path, start dot and arrow are shown. `memory`: only the faint letter until a slip. */
export type GuideLevel = "guided" | "memory";

/** Why a stroke did not count (each has a short hint in src/strings/write.ts). */
export type SlipReason = "start" | "direction" | "shape" | "short" | "long";

export interface StrokeJudgement {
  ok: boolean;
  reason?: SlipReason;
}

/** One finger stroke the child made while `stroke` was the stroke to write. */
export interface TraceAttempt {
  stroke: number;
  points: Point[];
}
