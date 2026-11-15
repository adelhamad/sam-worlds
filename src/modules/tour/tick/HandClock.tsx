// The interactive clock: the child turns the hands with a finger (or the big
// − / + buttons, press-and-hold repeats). Controlled: the parent owns the
// RUNNING TOTAL of minutes (see tickClock.ts) and gets every snapped change.
// The root carries `data-time` (timeKey of what it shows); in DEV a bot can set
// it without a drag: `el.dispatchEvent(new CustomEvent("tick-set", { detail: { hour, minute } }))`.
import { useEffect, useRef, type KeyboardEvent } from "react";
import { timeKey } from "../../../engine/tick/clock";
import type { TickStep } from "../../../engine/tick/types";
import { TICK } from "../../../strings/tick";
import { ClockArt, type ClockOverlay, type HandName } from "../../../ui/clock/ClockArt";
import { PlusMinusGlyph } from "./TickGlyphs";
import { crossSound, handDegs, nearestTotal, timeOf } from "./tickClock";
import { useClockDrag } from "./useClockDrag";
import { useHold } from "./useHold";

const S = TICK.exercise;

export type MoveHow = "drag" | "button" | "dev";

export interface HandClockProps {
  /** Running total of minutes (unwrapped). */
  total: number;
  onTotal: (total: number, how: MoveHow) => void;
  /** The hands snap to this; 60 = the child turns the HOUR hand. */
  step: TickStep;
  disabled?: boolean;
  /** Default "tick-clock" (the lesson bot drives it). */
  testId?: string;
  overlay?: ClockOverlay;
  pulse?: HandName | null;
  /** Let the long hand turn whole circles when the hour changes (default: not at step 60). */
  spin?: boolean;
  /** Glide time of the hands when not dragged (ms). */
  glide?: number;
  /** Show the − / + buttons (default true). */
  buttons?: boolean;
  /** Show the time in digits under the clock (off while setting: reading the hands is the lesson). */
  digital?: boolean;
  /** A finger went down on the face. */
  onGrab?: () => void;
  className?: string;
}

function StepButton({ plus, step, disabled, onStep }: { plus: boolean; step: TickStep; disabled: boolean; onStep: (d: number) => void }) {
  const hold = useHold(() => onStep(plus ? step : -step), !disabled);
  const hours = step === 60;
  const n = hours ? 1 : step;
  const unit = hours ? S.unitHour : S.unitMin;
  return (
    <button
      type="button" className={`tbtn tk-step ${plus ? "is-plus" : "is-minus"}`} disabled={disabled} {...hold}
      aria-label={plus ? S.plus(n, unit) : S.minus(n, unit)} data-testid={plus ? "tick-plus" : "tick-minus"}
    >
      <PlusMinusGlyph plus={plus} size={22} />
      <span className="tk-step-n">{n}</span>
      <span className="tk-step-unit">{unit}</span>
    </button>
  );
}

export function HandClock(props: HandClockProps) {
  const { total, step, disabled = false, testId = "tick-clock", overlay, pulse, glide = 260, buttons = true, digital = false, className = "" } = props;
  const spin = props.spin ?? step !== 60;
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  });
  const root = useRef<HTMLDivElement>(null);

  const move = (next: number, how: MoveHow) => {
    const now = live.current;
    if (next === now.total || now.disabled) return;
    if (how !== "dev") crossSound(now.total, next, now.step);
    now.onTotal(next, how);
  };
  const drag = useClockDrag({ total, step, enabled: !disabled, onMove: (t) => move(t, "drag"), onGrab: props.onGrab });

  useEffect(() => {
    const el = root.current;
    if (!import.meta.env.DEV || !el) return undefined;
    const onSet = (event: Event) => {
      const detail = (event as CustomEvent<{ hour?: unknown; minute?: unknown }>).detail;
      const hour = Number(detail?.hour);
      const minute = Number(detail?.minute);
      if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) return;
      const now = live.current;
      if (!now.disabled) now.onTotal(nearestTotal({ hour, minute }, now.total), "dev");
    };
    el.addEventListener("tick-set", onSet);
    return () => el.removeEventListener("tick-set", onSet);
  }, []);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (!dir) return;
    event.preventDefault();
    move(total + dir * step, "button");
  };

  const time = timeOf(total);
  const key = timeKey(time);
  const deg = handDegs(total, spin);
  const grip: HandName = step === 60 ? "hour" : "minute";
  return (
    <div ref={root} className={`tk-hand ${disabled ? "is-disabled" : ""} ${className}`} data-testid={testId} data-time={key}>
      <div
        className={`tk-hand-face ${drag.dragging ? "is-dragging" : ""}`} onPointerDown={drag.onPointerDown} onKeyDown={onKey}
        tabIndex={disabled ? -1 : 0} role="slider" aria-label={S.clockSet(key)} aria-valuetext={key}
        aria-valuemin={0} aria-valuemax={719} aria-valuenow={((total % 720) + 720) % 720}
      >
        <ClockArt
          hourDeg={deg.hour} minuteDeg={deg.minute} numbers="all" small={false} overlay={overlay} pulse={pulse}
          grip={disabled ? null : grip} glide={drag.dragging ? 0 : glide} label={S.clock(key)}
        />
      </div>
      {digital && <output className="tk-digital" data-testid="tick-digital">{key}</output>}
      {buttons && (
        <div className="tk-steps">
          <StepButton plus={false} step={step} disabled={disabled} onStep={(d) => move(live.current.total + d, "button")} />
          <StepButton plus step={step} disabled={disabled} onStep={(d) => move(live.current.total + d, "button")} />
        </div>
      )}
    </div>
  );
}
