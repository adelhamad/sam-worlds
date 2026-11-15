// Handwriting tracer engine — pure, no React. See docs/ARABIC_WRITING.md.
export type { GlyphFont, GlyphStrokes, GuideLevel, Point, RawGlyph, SlipReason, Stroke, StrokeJudgement, StrokeKind, TraceAttempt } from "./types";
export { judgeGlyphStroke, judgeStroke, JUDGE_SAMPLES, type JudgeOptions } from "./judge";
export { traceTally, traceVerdict, TRACE_DONE, type TraceTally } from "./verdict";
export { MAX_SLIPS, TOLERANCE, type Tolerance } from "./tolerance";
export { polyLength, resampleN } from "./geom";
