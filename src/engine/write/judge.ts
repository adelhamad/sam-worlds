// The handwriting judge: did this finger stroke write that stroke of the
// letter? Pure and deterministic — the canvas calls it on every lift and
// traceVerdict() re-runs it over the whole attempt list, so a widget never
// decides on its own. Every number comes from tolerance.ts.
import { decimate, dedupe, dist, distToPolyline, orderedDistances, polyLength, quantile, resampleN } from "./geom";
import { TOLERANCE, type Tolerance } from "./tolerance";
import type { GlyphStrokes, GuideLevel, Point, Stroke, StrokeJudgement } from "./types";

/** Samples used to compare a finger trail with a path. */
export const JUDGE_SAMPLES = 64;

export interface JudgeOptions {
  guide?: GuideLevel;
  /** Overrides the level's tolerance (tests and tuning). */
  tolerance?: Tolerance;
  /** For a dot: the letter's other dots — a tap nearer one of them is not this dot. */
  avoid?: readonly Point[];
}

function tol(opts?: JudgeOptions): Tolerance {
  return opts?.tolerance ?? TOLERANCE[opts?.guide ?? "guided"];
}

function judgeDot(target: Stroke, drawn: Point[], t: Tolerance, avoid: readonly Point[]): StrokeJudgement {
  const dot = target.points[0];
  const centre: Point = [drawn.reduce((s, p) => s + p[0], 0) / drawn.length, drawn.reduce((s, p) => s + p[1], 0) / drawn.length];
  const near = dist(centre, dot);
  if (near > t.dotRadius || avoid.some((other) => dist(centre, other) < near)) return { ok: false, reason: "start" };
  if (polyLength(drawn) > t.dotTravel) return { ok: false, reason: "long" };
  return { ok: true };
}

function startProblem(drawn: Point[], path: Point[], t: Tolerance): StrokeJudgement | null {
  const first = drawn[0];
  const start = path[0];
  const end = path[path.length - 1];
  if (dist(first, start) <= t.start) return null;
  // Began at the far end and headed for the start: the direction, not the place, is off.
  const reversed = dist(first, end) <= t.start && dist(drawn[drawn.length - 1], start) <= t.end;
  return { ok: false, reason: reversed ? "direction" : "start" };
}

/** The share of `path` samples that the trail passes within `reach` of. */
function coverage(path: Point[], trail: Point[], reach: number): number {
  let near = 0;
  for (const p of path) if (distToPolyline(p, trail) <= reach) near++;
  return near / path.length;
}

function judgeLine(target: Stroke, drawn: Point[], t: Tolerance): StrokeJudgement {
  const pathLength = polyLength(target.points);
  const trailLength = polyLength(drawn);
  const startIssue = startProblem(drawn, target.points, t);
  if (startIssue) return startIssue;
  if (drawn.length < 2 || trailLength < pathLength * t.minLength * 0.5) return { ok: false, reason: "short" };

  const trail = resampleN(drawn, JUDGE_SAMPLES);
  const path = resampleN(target.points, JUDGE_SAMPLES);
  const offsets = trail.map((p) => distToPolyline(p, target.points));
  const mean = offsets.reduce((s, d) => s + d, 0) / offsets.length;
  if (mean > t.mean || quantile(offsets, 0.9) > t.p90) return { ok: false, reason: "shape" };

  const end = path[path.length - 1];
  if (coverage(path, trail, t.cover) < t.minCover || trailLength < pathLength * t.minLength) {
    return { ok: false, reason: "short" };
  }
  if (trailLength > pathLength * t.maxLength + t.lengthSlack) return { ok: false, reason: "long" };
  const last = trail[trail.length - 1];
  if (dist(last, end) > t.end) {
    // Stopped on the path before its end → short; ran on off the path → long.
    return { ok: false, reason: distToPolyline(last, target.points) > t.cover ? "long" : "short" };
  }
  if (quantile(orderedDistances(trail, path), 0.9) > t.order) return { ok: false, reason: "direction" };
  return { ok: true };
}

/**
 * Judges one finger stroke against one target stroke (design-box units).
 * A `line` must start near its start, stay near the path, cover most of it,
 * end near its end and run the right way; a `dot` takes a tap or a tiny dab.
 */
export function judgeStroke(target: Stroke, drawnRaw: readonly Point[], opts?: JudgeOptions): StrokeJudgement {
  const t = tol(opts);
  const drawn = decimate(dedupe(drawnRaw), t.minSpacing);
  if (!drawn.length) return { ok: false, reason: "short" };
  return target.kind === "dot" ? judgeDot(target, drawn, t, opts?.avoid ?? []) : judgeLine(target, drawn, t);
}

/**
 * Judges stroke `index` of a whole letter — the one entry point the canvas and
 * traceVerdict share, so they can never disagree (it supplies a dot's sibling dots).
 */
export function judgeGlyphStroke(glyph: GlyphStrokes, index: number, drawn: readonly Point[], guide: GuideLevel): StrokeJudgement {
  const target = glyph.strokes[index];
  const avoid = target.kind === "dot"
    ? glyph.strokes.filter((s, i) => i !== index && s.kind === "dot").map((s) => s.points[0])
    : [];
  return judgeStroke(target, drawn, { guide, avoid });
}
