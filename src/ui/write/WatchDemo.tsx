// "Watch": the whole letter written stroke by stroke, in order and in the
// right direction, with a glowing dot leading the ink. Animated with one
// requestAnimationFrame loop that writes straight to the SVG (no React state
// per frame).
import { useEffect, useRef } from "react";
import type { GlyphStrokes } from "../../engine/write/types";
import { InkStroke } from "./TraceGuide";
import { lengthOf, poseAt } from "./paths";

/** Writing speed, design units per second, and the pause between strokes. */
const SPEED = 620;
const GAP_MS = 320;
const DOT_MS = 260;

interface Step { start: number; duration: number; length: number }

function timeline(glyph: GlyphStrokes): { steps: Step[]; total: number } {
  let t = 250;
  const steps = glyph.strokes.map((stroke) => {
    const length = stroke.kind === "line" ? lengthOf(stroke.points) : 0;
    const duration = stroke.kind === "line" ? (length / SPEED) * 1000 : DOT_MS;
    const step = { start: t, duration, length };
    t += duration + GAP_MS;
    return step;
  });
  return { steps, total: t + 200 };
}

export function WatchDemo({ glyph, onEnd }: { glyph: GlyphStrokes; onEnd: () => void }) {
  const strokes = useRef<Array<SVGPathElement | SVGCircleElement | null>>([]);
  const lead = useRef<SVGCircleElement | null>(null);
  const done = useRef(onEnd);
  useEffect(() => {
    done.current = onEnd;
  });

  useEffect(() => {
    const { steps, total } = timeline(glyph);
    let frame = 0;
    const began = performance.now();
    const draw = (now: number) => {
      const t = now - began;
      let leadAt: { x: number; y: number } | null = null;
      steps.forEach((step, i) => {
        const el = strokes.current[i];
        const p = Math.max(0, Math.min(1, (t - step.start) / step.duration));
        const stroke = glyph.strokes[i];
        if (!el) return;
        if (stroke.kind === "dot") {
          el.style.opacity = String(p);
          el.style.transform = `scale(${0.4 + 0.6 * p})`;
        } else {
          el.style.strokeDasharray = `${step.length} ${step.length + 10}`;
          el.style.strokeDashoffset = String(step.length * (1 - p));
          el.style.opacity = p > 0 ? "1" : "0";
        }
        if (p > 0 && p < 1) leadAt = stroke.kind === "dot" ? { x: stroke.points[0][0], y: stroke.points[0][1] } : poseAt(stroke.points, step.length * p);
      });
      const dot = lead.current;
      if (dot) {
        const at = leadAt as { x: number; y: number } | null;
        dot.style.opacity = at ? "1" : "0";
        if (at) {
          dot.setAttribute("cx", String(at.x));
          dot.setAttribute("cy", String(at.y));
        }
      }
      if (t < total) frame = requestAnimationFrame(draw);
      else done.current();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [glyph]);

  return (
    <g className="write-demo" data-testid="write-demo">
      {glyph.strokes.map((stroke, i) => (
        <InkStroke key={i} glyph={glyph} stroke={stroke} className="write-demo-ink"
          ref={(el) => {
            strokes.current[i] = el;
          }} />
      ))}
      <circle ref={lead} className="write-demo-lead" r={30} cx={-100} cy={-100} />
    </g>
  );
}
