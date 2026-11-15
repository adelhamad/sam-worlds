// Geometry and palette of the Tick Tock clock (viewBox 0 0 200 200, centre
// 100,100). Pure. The two hand colours are THE colours of the course: every
// place that talks about the hands (legends, chips, teach cards) uses them.

export const C = 100;

/** Deep indigo — the short hour hand, the numbers 1–12, anything "hour". */
export const HOUR_COLOR = "#3a2d9c";
/** A lighter tint of the hour colour for text on the dark lesson background. */
export const HOUR_TINT = "#b9b0ff";
/** Warm coral — the long minute hand, the minute ring, anything "minutes". */
export const MINUTE_COLOR = "#ff6a4d";
export const MINUTE_TINT = "#ffb09e";

export const FACE = {
  rimEdge: "#4a2fb8",
  rim: "#7c5cf5",
  rimShine: "rgba(255, 255, 255, 0.24)",
  face: "#fff8e8",
  faceEdge: "#f1e2c2",
  tickMinor: "#c4b493",
  tickMajor: "#4b4180",
  cap: "#ffd166",
  wedge: "rgba(255, 106, 77, 0.26)",
  litTick: MINUTE_COLOR,
  font: "'Nunito Variable', Nunito, 'Trebuchet MS', system-ui, sans-serif",
};

export const R = {
  rim: 94,
  face: 80,
  /** Outer end of every tick. */
  tickOut: 76,
  tickMinorIn: 72,
  tickMajorIn: 67,
  numbers: 57,
  /** Minute labels (5, 10 … 55) ride on the rim. */
  ring: 87,
};

/** Point at `r` from the centre, `deg` clockwise from 12. */
export function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
}

/** Angle (degrees clockwise from 12, 0–360) of a point relative to a centre. */
export function angleOf(dx: number, dy: number): number {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Signed shortest turn from `from` to `to`, in (-180, 180]. */
export function turnBetween(from: number, to: number): number {
  const d = (((to - from) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export interface Tick {
  m: number;
  major: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const TICKS: Tick[] = Array.from({ length: 60 }, (_, m) => {
  const major = m % 5 === 0;
  const a = polar(R.tickOut, m * 6);
  const b = polar(major ? R.tickMajorIn : R.tickMinorIn, m * 6);
  return { m, major, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
});

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
export const QUARTER_HOURS = new Set([12, 3, 6, 9]);
export const RING_MINUTES = Array.from({ length: 11 }, (_, i) => (i + 1) * 5);

/** Clocks smaller than this (px) drop the minute ticks and show 12, 3, 6, 9 only. */
export const SMALL_CLOCK = 90;
