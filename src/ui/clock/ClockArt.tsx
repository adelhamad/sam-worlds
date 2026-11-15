// The drawing of the Tick Tock clock: a chunky toy classroom clock — violet rim
// with a pressable bottom edge, cream face, bold numbers, 60 ticks, a SHORT
// THICK indigo hour hand and a LONG coral minute hand. Hands are rotated with
// CSS transforms (so they can glide); angles are passed in already unwrapped by
// the caller. Teaching overlays: a painted wedge, a minute ring on the rim, a
// highlighted hour number, lit minute ticks, a pulsing hand.
// Colours are presentation attributes so the clock draws right anywhere
// (Course Kit cards, outside `.tour`); clock.css only adds motion.
import type { CSSProperties, Ref } from "react";
import {
  C, FACE, HOUR_COLOR, HOURS, MINUTE_COLOR, QUARTER_HOURS, R, RING_MINUTES, TICKS, mod, polar,
} from "./clockGeo";
import "./clock.css";

export interface ClockOverlay {
  /** Paint the face from minute `from` to minute `to` (0–60), clockwise. */
  wedge?: { from: number; to: number } | null;
  /** Show the minute ring 5, 10 … 55 on the rim. */
  ring?: boolean;
  /** Ring labels up to this minute light up (with `ring`). */
  ringLit?: number | null;
  /** Highlight this hour number (the hour the short hand has passed). */
  hourMark?: number | null;
  /** Light the minute ticks from..to (inclusive). */
  ticks?: { from: number; to: number } | null;
}

export type HandName = "hour" | "minute";

export interface ClockArtProps {
  hourDeg: number;
  minuteDeg: number;
  numbers: "all" | "quarters" | "none";
  /** Tiny clock: no minute ticks, fatter hands, bigger numbers. */
  small: boolean;
  overlay?: ClockOverlay;
  /** Make one hand glow (teaching). */
  pulse?: HandName | null;
  /** Draw a round grip on this hand (interactive clock). */
  grip?: HandName | null;
  /** Hand glide time in ms (0 = jump). */
  glide?: number;
  size?: number;
  label: string;
  className?: string;
  svgRef?: Ref<SVGSVGElement>;
}

function sector(from: number, to: number, r: number): string {
  const span = Math.max(0, Math.min(60, to - from));
  if (span >= 60) return `M ${C} ${C - r} A ${r} ${r} 0 1 1 ${C - 0.01} ${C - r} Z`;
  const a = polar(r, from * 6);
  const b = polar(r, to * 6);
  return `M ${C} ${C} L ${a.x} ${a.y} A ${r} ${r} 0 ${span > 30 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
}

interface HandShape {
  w: number;
  tip: number;
  tail: number;
}

function handRect({ w, tip, tail }: HandShape) {
  return { x: C - w / 2, y: C - tip, width: w, height: tip + tail, rx: w / 2 };
}

function shapes(small: boolean): Record<HandName, HandShape> {
  return small
    ? { hour: { w: 17, tip: 42, tail: 10 }, minute: { w: 10, tip: 68, tail: 12 } }
    : { hour: { w: 13, tip: 46, tail: 12 }, minute: { w: 6.5, tip: 72, tail: 15 } };
}

function rotate(deg: number, glide: number): CSSProperties {
  return {
    transform: `rotate(${deg}deg)`,
    transition: glide > 0 ? `transform ${glide}ms cubic-bezier(0.3, 1.25, 0.5, 1)` : "none",
  };
}

function Hand({ name, deg, shape, glide, pulse, grip }: { name: HandName; deg: number; shape: HandShape; glide: number; pulse: boolean; grip: boolean }) {
  const color = name === "hour" ? HOUR_COLOR : MINUTE_COLOR;
  const knob = polar(name === "hour" ? shape.tip - 9 : shape.tip - 1, 0);
  return (
    <g className={`tclock-hand tclock-${name}`} style={rotate(deg, glide)}>
      {pulse && <rect {...handRect(shape)} className="tclock-halo" fill="none" stroke="#ffd166" strokeWidth={9} />}
      <rect {...handRect(shape)} fill={color} />
      {grip && (
        <g className="tclock-grip">
          <circle cx={knob.x} cy={knob.y} r={22} fill="transparent" />
          <circle cx={knob.x} cy={knob.y} r={name === "hour" ? 10.5 : 8.5} fill={color} stroke="#fff" strokeWidth={3.5} />
        </g>
      )}
    </g>
  );
}

function Numbers({ numbers, small, hourMark }: { numbers: ClockArtProps["numbers"]; small: boolean; hourMark: number | null }) {
  if (numbers === "none") return null;
  const quarters = numbers === "quarters" || small;
  const r = small ? 52 : R.numbers;
  let size = 20;
  if (quarters) size = small ? 36 : 27;
  return (
    <g>
      {HOURS.filter((h) => !quarters || QUARTER_HOURS.has(h)).map((h) => {
        const p = polar(r, h * 30);
        const lit = hourMark === h;
        return (
          <g key={h}>
            {lit && <circle cx={p.x} cy={p.y} r={size * 0.78} fill={HOUR_COLOR} className="tclock-mark" />}
            <text
              x={p.x} y={p.y + size * 0.05} textAnchor="middle" dominantBaseline="central"
              fontFamily={FACE.font} fontWeight={900} fontSize={size} fill={lit ? "#fff" : HOUR_COLOR}
            >
              {h}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function inRange(m: number, range: { from: number; to: number } | null | undefined): boolean {
  return Boolean(range) && m >= (range?.from ?? 0) && m <= (range?.to ?? -1);
}

function Ticks({ small, lit }: { small: boolean; lit: ClockOverlay["ticks"] }) {
  return (
    <g strokeLinecap="round">
      {TICKS.filter((t) => t.major || !small).map((t) => {
        const on = inRange(t.m === 0 && lit && lit.to >= 60 ? 60 : t.m, lit);
        let stroke = t.major ? FACE.tickMajor : FACE.tickMinor;
        if (on) stroke = FACE.litTick;
        let width = t.major ? 3 : 1.6;
        if (small) width = 5;
        if (on) width += 1.4;
        return <line key={t.m} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={stroke} strokeWidth={width} />;
      })}
    </g>
  );
}

function Ring({ lit }: { lit: number | null }) {
  return (
    <g>
      {RING_MINUTES.map((m) => {
        const p = polar(R.ring, m * 6);
        const on = lit !== null && m <= lit;
        return (
          <g key={m} className={on ? "tclock-ring-on" : undefined}>
            <circle cx={p.x} cy={p.y} r={8.4} fill={on ? MINUTE_COLOR : "rgba(255, 255, 255, 0.16)"} />
            <text
              x={p.x} y={p.y + 0.5} textAnchor="middle" dominantBaseline="central"
              fontFamily={FACE.font} fontWeight={900} fontSize={m >= 10 ? 9 : 10} fill="#fff"
            >
              {m}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function ClockArt(props: ClockArtProps) {
  const { hourDeg, minuteDeg, numbers, small, overlay = {}, pulse = null, grip = null, glide = 0, size, label, className = "", svgRef } = props;
  const hand = shapes(small);
  const wedge = overlay.wedge && overlay.wedge.to > overlay.wedge.from ? overlay.wedge : null;
  return (
    <svg
      ref={svgRef} viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label}
      style={size === undefined ? undefined : { width: size, height: size, flex: "none" }}
      className={`tclock ${small ? "is-small" : ""} ${className}`} data-numbers={numbers}
    >
      <circle cx={C} cy={C + 5} r={R.rim} fill={FACE.rimEdge} />
      <circle cx={C} cy={C} r={R.rim} fill={FACE.rim} />
      <circle cx={C} cy={C} r={R.rim - 4} fill="none" stroke={FACE.rimShine} strokeWidth={2.5} />
      <circle cx={C} cy={C + 2} r={R.face + 1} fill={FACE.rimEdge} opacity={0.55} />
      <circle cx={C} cy={C} r={R.face} fill={FACE.face} />
      <circle cx={C} cy={C} r={R.face - 2.5} fill="none" stroke={FACE.faceEdge} strokeWidth={5} />
      {wedge && <path d={sector(mod(wedge.from, 61), wedge.to, R.face - 1)} fill={FACE.wedge} className="tclock-wedge" />}
      <Ticks small={small} lit={overlay.ticks} />
      <Numbers numbers={numbers} small={small} hourMark={overlay.hourMark ?? null} />
      {overlay.ring && !small && <Ring lit={overlay.ringLit ?? null} />}
      <g transform="translate(1.6 3.2)" fill="rgba(36, 18, 92, 0.2)">
        <rect {...handRect(hand.hour)} style={rotate(hourDeg, glide)} className="tclock-hand" />
        <rect {...handRect(hand.minute)} style={rotate(minuteDeg, glide)} className="tclock-hand" />
      </g>
      <Hand name="hour" deg={hourDeg} shape={hand.hour} glide={glide} pulse={pulse === "hour"} grip={grip === "hour"} />
      <Hand name="minute" deg={minuteDeg} shape={hand.minute} glide={glide} pulse={pulse === "minute"} grip={grip === "minute"} />
      <circle cx={C} cy={C} r={small ? 11 : 9} fill={FACE.cap} stroke={HOUR_COLOR} strokeWidth={small ? 4 : 3} />
      <circle cx={C} cy={C} r={small ? 3.5 : 3} fill={MINUTE_COLOR} />
    </svg>
  );
}
