// Pogo's cheer near the end of a lesson: he bounces in BIG with a burst of
// sparkles — "Almost there, Sam! Just 2 more!" — and leaves by himself a
// moment later (or at once on a tap). A friend showing up, never a gate.
import { useEffect, useRef, useState } from "react";
import { Pogo } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { useCompact } from "./useCompact";

/** On screen, then the hop out: together ≈ 2.2 s. */
const STAY_MS = 1950;
const LEAVE_MS = 250;
/** CONTINUE was just under the finger: a double tap must not shoo Pogo away. */
const TAP_GUARD_MS = 450;

const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + (i % 2) * 0.22;
  const reach = i % 2 === 0 ? 1 : 0.72;
  return {
    x: (Math.cos(angle) * reach).toFixed(3),
    y: (Math.sin(angle) * reach).toFixed(3),
    delay: `${120 + (i % 4) * 70}ms`,
    glyph: i % 3 === 0 ? "★" : "✦",
  };
});

interface CheerBreakProps {
  id: number;
  /** Slots still to play. */
  left: number;
  onDone: (id: number) => void;
}

export function CheerBreak({ id, left, onDone }: CheerBreakProps) {
  const compact = useCompact();
  const [leaving, setLeaving] = useState(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    shownAtRef.current = Date.now();
    const out = setTimeout(() => setLeaving(true), STAY_MS);
    const done = setTimeout(() => onDone(id), STAY_MS + LEAVE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(done);
    };
  }, [id, onDone]);

  const size = compact ? 150 : 220;
  return (
    <button
      className={`tl-break tl-cheer ${leaving ? "is-leaving" : ""}`}
      onClick={() => { if (Date.now() - shownAtRef.current >= TAP_GUARD_MS) onDone(id); }}
    >
      <span className="tl-cheer-bubble" role="status">
        <b>{TOUR.lesson.cheerAlmost}</b>
        <span>{TOUR.lesson.cheerLeft(left)}</span>
      </span>
      <span className="tl-cheer-hero" style={{ width: size, height: size, "--tl-reach": `${Math.round(size * 0.95)}px` } as React.CSSProperties}>
        <span className="tl-cheer-glow" aria-hidden="true" />
        <span className="tl-cheer-sparks" aria-hidden="true">
          {SPARKS.map((spark, i) => (
            <i key={i} style={{ "--tl-sx": spark.x, "--tl-sy": spark.y, "--tl-sd": spark.delay } as React.CSSProperties}>
              {spark.glyph}
            </i>
          ))}
        </span>
        <span className="tl-cheer-pogo"><Pogo mood="cheer" size={size} /></span>
      </span>
    </button>
  );
}
