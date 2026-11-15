// A static analog clock face (SVG). The exported name and props are a contract:
// the Course Kit cards and the Tick Tock widgets both draw clocks through it,
// at sizes from ~56 px to ~320 px. Below ~90 px it drops the minute ticks and
// shows 12, 3, 6, 9 only, with fatter hands, so it still reads at a glance.
import { useEffect, useState } from "react";
import { handAngles, timeKey } from "../../engine/tick/clock";
import type { ClockTime } from "../../engine/tick/types";
import { TICK } from "../../strings/tick";
import { ClockArt, type ClockOverlay, type HandName } from "./ClockArt";
import { SMALL_CLOCK } from "./clockGeo";

export interface ClockFaceProps {
  time: ClockTime;
  /** Rendered width and height in px (omit to fill the parent's width). */
  size?: number;
  /** Draw the numbers 1–12 (default "all"); small card clocks may show only 12, 3, 6, 9. */
  numbers?: "all" | "quarters" | "none";
  className?: string;
  /** Teaching overlays (wedge, minute ring, hour mark, lit ticks). */
  overlay?: ClockOverlay;
  /** Make one hand glow. */
  pulse?: HandName | null;
}

/** True when the clock renders below SMALL_CLOCK px (measured only when no `size` is given). */
function useSmall(size: number | undefined) {
  const [el, setEl] = useState<SVGSVGElement | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  useEffect(() => {
    if (size !== undefined || !el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setMeasured(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, size]);
  const px = size ?? measured;
  return { ref: setEl, small: px !== null && px > 0 && px < SMALL_CLOCK };
}

export function ClockFace({ time, size, numbers = "all", className = "", overlay, pulse }: ClockFaceProps) {
  const { hour, minute } = handAngles(time);
  const { ref, small } = useSmall(size);
  return (
    <ClockArt
      svgRef={ref} hourDeg={hour} minuteDeg={minute} numbers={numbers} small={small} size={size}
      overlay={overlay} pulse={pulse} label={TICK.exercise.clock(timeKey(time))} className={`clock-face ${className}`}
    />
  );
}
