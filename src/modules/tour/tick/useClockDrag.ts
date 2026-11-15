// Turning a clock hand with a finger. Pressing ANYWHERE on the face grabs the
// minute hand (it jumps to the finger the short way round), then it follows the
// finger around the centre. The turn is accumulated as an UNSNAPPED running
// total (so slow drags at step 15 or 30 still get there) and reported snapped to
// `step`. Several turns work, and so does going backwards: the hour hand follows
// like real gears. At step 60 the HOUR hand is grabbed instead (2 minutes per
// degree, snapping to whole hours). Move/up listeners live on `window` while a
// finger is down, so synthetic pointer events (bots) work wherever they land.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { TickStep } from "../../../engine/tick/types";
import { angleOf, mod, turnBetween } from "../../../ui/clock/clockGeo";

/** Presses this close to the centre (fraction of the radius) do not steer: the angle is meaningless there. */
const DEAD_ZONE = 0.15;

export interface ClockDragOptions {
  total: number;
  step: TickStep;
  enabled: boolean;
  /** A new snapped running total. */
  onMove: (total: number) => void;
  /** A finger went down on the face. */
  onGrab?: () => void;
}

export interface ClockDrag {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  dragging: boolean;
}

export function useClockDrag(options: ClockDragOptions): ClockDrag {
  const live = useRef(options);
  useEffect(() => {
    live.current = options;
  });
  const [dragging, setDragging] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const o = live.current;
    if (!o.enabled || stop.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    const face = event.currentTarget;
    const pointer = event.pointerId;
    try {
      face.setPointerCapture(pointer);
    } catch {
      // synthetic events have no active pointer: the window listeners still work
    }
    const hourMode = o.step === 60;
    const perDegree = hourMode ? 2 : 1 / 6;
    let raw = o.total;
    let shown = o.total;
    let last: number | null = hourMode ? mod(o.total, 720) * 0.5 : mod(o.total, 60) * 6;

    const steer = (x: number, y: number) => {
      const rect = face.getBoundingClientRect();
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) < (rect.width / 2) * DEAD_ZONE) {
        last = null;
        return;
      }
      const angle = angleOf(dx, dy);
      if (last === null) {
        last = angle;
        return;
      }
      raw += turnBetween(last, angle) * perDegree;
      last = angle;
      const step = live.current.step;
      const snapped = Math.round(raw / step) * step;
      if (snapped !== shown) {
        shown = snapped;
        live.current.onMove(snapped);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId === pointer) steer(e.clientX, e.clientY);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId === pointer) stop.current?.();
    };
    stop.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      stop.current = null;
      setDragging(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    setDragging(true);
    o.onGrab?.();
    steer(event.clientX, event.clientY);
  }, []);

  return { onPointerDown, dragging };
}
