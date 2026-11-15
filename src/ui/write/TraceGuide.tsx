// The tracer's SVG layers, all in design-box units: the writing line, the
// faint font letter (drawn with the same font, size, anchor and baseline the
// strokes were built from, so they coincide), the strokes already written and
// the guide for the current one (dashed path, moving dashes, chevrons, a
// pulsing start dot and its number).
import { forwardRef } from "react";
import type { GlyphStrokes, Point, Stroke } from "../../engine/write/types";
import { badgeSpot, chevronD, chevrons, dotRadius, pathD } from "./paths";

export function GlyphLetter({ glyph, className = "write-letter" }: { glyph: GlyphStrokes; className?: string }) {
  const { font } = glyph;
  return (
    <text className={className} x={glyph.x} y={font.baseline} fontFamily={`"${font.family}"`} fontWeight={font.weight}
      fontSize={font.size} textAnchor="middle" direction="rtl" lang="ar">
      {glyph.draw ?? glyph.char}
    </text>
  );
}

interface InkStrokeProps { glyph: GlyphStrokes; stroke: Stroke; className?: string }

/** A written stroke in solid ink (the letter's own stroke width). */
export const InkStroke = forwardRef<SVGPathElement & SVGCircleElement, InkStrokeProps>(function InkStroke({ glyph, stroke, className }, ref) {
  if (stroke.kind === "dot") {
    const [x, y] = stroke.points[0];
    return <circle ref={ref} className={className} cx={x} cy={y} r={dotRadius(glyph)} style={{ transformOrigin: `${x}px ${y}px` }} />;
  }
  return <path ref={ref} className={className} d={pathD(stroke.points)} strokeWidth={glyph.width} />;
});

/** A stroke's number; a dot's badge is pushed away from `away` (the middle of the letter's dots) so neighbours do not collide. */
export function StrokeBadge({ stroke, n, away }: { stroke: Stroke; n: number; away?: Point }) {
  const [x, y] = badgeSpot(stroke.points, stroke.kind === "dot" ? 62 : 70, away);
  return (
    <g className="write-badge" transform={`translate(${x} ${y})`}>
      <circle r={30} />
      <text y={11} textAnchor="middle">{n}</text>
    </g>
  );
}

/** The middle of a letter's dots (dot badges are pushed away from it so they never overlap). */
function dotsMiddle(glyph: GlyphStrokes): Point | undefined {
  const dots = glyph.strokes.filter((s) => s.kind === "dot").map((s) => s.points[0]);
  if (!dots.length) return undefined;
  return [dots.reduce((a, p) => a + p[0], 0) / dots.length, dots.reduce((a, p) => a + p[1], 0) / dots.length];
}

/** Dashed centre line, chevrons and a start dot: how to write `stroke`. */
export function StrokeGuide({ glyph, stroke, n, still }: { glyph: GlyphStrokes; stroke: Stroke; n: number; still?: boolean }) {
  const [sx, sy] = stroke.points[0];
  const line = stroke.kind === "line";
  return (
    <g className={`write-guide${still ? " write-guide--still" : ""}`} data-testid="write-guide">
      {line && <path className="write-guide-path" d={pathD(stroke.points)} />}
      {line && chevrons(stroke.points, 130).map((c, i) => (
        <path key={i} className="write-guide-chevron" d={chevronD(34)} transform={`translate(${c.x} ${c.y}) rotate(${(c.angle * 180) / Math.PI})`} />
      ))}
      <circle className="write-start-halo" cx={sx} cy={sy} r={line ? 44 : dotRadius(glyph) + 14} />
      <circle className="write-start" cx={sx} cy={sy} r={line ? 26 : dotRadius(glyph)} />
      <StrokeBadge stroke={stroke} n={n} away={dotsMiddle(glyph)} />
    </g>
  );
}

/** Every stroke at once, numbered, with its direction — the reduced-motion "Watch". */
export function StrokeOverview({ glyph }: { glyph: GlyphStrokes }) {
  return (
    <g className="write-overview" data-testid="write-overview">
      {glyph.strokes.map((stroke, i) => <StrokeGuide key={i} glyph={glyph} stroke={stroke} n={i + 1} still />)}
    </g>
  );
}

export function WritingLine({ glyph }: { glyph: GlyphStrokes }) {
  const y = glyph.font.baseline;
  return <line className="write-baseline" x1={40} x2={glyph.box - 40} y1={y} y2={y} />;
}
