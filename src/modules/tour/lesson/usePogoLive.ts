// Pogo playing along while the child works on a question: his eyes (and a
// slight lean of his head) follow the child's finger, he perks up when the
// answer is ready, fidgets after a quiet while and waves at the puzzle after a
// longer one. No timer is ever shown and any touch ends it at once.
// Performance: one passive pointer listener; the gaze is written as CSS
// variables on the host element inside requestAnimationFrame — never React
// state per move.
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import type { PogoMood } from "../../../ui/tour/Pogo";

/** No touch for this long: Pogo looks around and taps a foot. */
const FIDGET_MS = 10_000;
/** ...and for this long: a small encouraging wave at the puzzle. */
const BECKON_MS = 20_000;
const BECKON_FOR_MS = 3_500;
/** Pupils drift back this long after the last move. */
const GAZE_REST_MS = 1_200;
/** How far the pupils travel (viewBox units; the eye leaves ~7.5 x 10 of room). */
const GAZE_X = 5.5;
const GAZE_Y = 4;
/** Head lean toward the finger, degrees. */
const LEAN_DEG = 5;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Pupils and head follow the pointer while `active`. */
export function usePogoGaze(hostRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !active || reducedMotion()) return;
    let eye: { x: number; y: number; size: number } | null = null;
    let point: { x: number; y: number } | null = null;
    let frame = 0;
    let rest: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      const art = host.querySelector(".pogo-svg");
      if (!art) return;
      const box = art.getBoundingClientRect();
      eye = { x: box.left + box.width / 2, y: box.top + box.height * 0.46, size: Math.max(40, box.width) };
    };
    const paint = () => {
      frame = 0;
      if (!point || !eye) return;
      const dx = point.x - eye.x;
      const dy = point.y - eye.y;
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, distance / eye.size);
      const ux = (dx / distance) * reach;
      const uy = (dy / distance) * reach;
      host.style.setProperty("--pg-gx", `${(ux * GAZE_X).toFixed(2)}px`);
      host.style.setProperty("--pg-gy", `${(uy * GAZE_Y).toFixed(2)}px`);
      host.style.setProperty("--pg-lean", `${(ux * LEAN_DEG).toFixed(2)}deg`);
      host.dataset.pogoGaze = "";
    };
    const release = () => {
      point = null;
      eye = null;
      delete host.dataset.pogoGaze;
      host.style.removeProperty("--pg-lean");
    };
    const onMove = (event: PointerEvent) => {
      if (!eye) measure();
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
      clearTimeout(rest);
      rest = setTimeout(release, GAZE_REST_MS);
    };
    const onDown = (event: PointerEvent) => {
      measure(); // Pogo may have moved since the last touch (resize, rotation)
      onMove(event);
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      clearTimeout(rest);
      release();
    };
  }, [hostRef, active]);
}

/** 0 = the child is busy, 1 = quiet for a while (fidget), 2 = a little wave. */
type Quiet = 0 | 1 | 2;

/** How long the child has left the question alone (only while `active`). */
function useQuiet(active: boolean, questionId: string): Quiet {
  const [quiet, setQuiet] = useState<{ id: string; level: Quiet }>({ id: questionId, level: 0 });
  useEffect(() => {
    if (!active) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const arm = () => {
      timers.forEach(clearTimeout);
      const to = (level: Quiet, ms: number) => setTimeout(() => setQuiet({ id: questionId, level }), ms);
      timers = [to(1, FIDGET_MS), to(2, BECKON_MS), to(1, BECKON_MS + BECKON_FOR_MS)];
    };
    const wake = () => {
      setQuiet({ id: questionId, level: 0 });
      arm();
    };
    arm();
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [active, questionId]);
  return active && quiet.id === questionId ? quiet.level : 0;
}

export interface PogoLive {
  /** A mood that replaces the talking/idle default (the little wave), or null. */
  mood: PogoMood | null;
  /** Modifier classes for Pogo: perked up (answer ready) / fidgeting. */
  className: string;
}

/** Everything Pogo does while the child works. `ready` must only ever say
    whether an answer exists — never anything about the answer itself. */
export function usePogoLive(hostRef: RefObject<HTMLElement | null>, questionId: string, active: boolean, ready: boolean): PogoLive {
  usePogoGaze(hostRef, active);
  const quiet = useQuiet(active, questionId);
  const perked = active && ready;
  return {
    mood: quiet === 2 ? "beckon" : null,
    className: [perked ? "pogo-ready" : "", !perked && quiet === 1 ? "pogo-fidget" : ""].filter(Boolean).join(" "),
  };
}

// ---------------------------------------------------------------- size

/** Pogo's drawn size in the lesson, by screen. The layout box is smaller (see
    `.tl-ask` in lesson.css): the art's empty edges overlap the gutters. */
const SIZES: [string, number][] = [
  ["(max-height: 500px)", 96], // landscape phone
  ["(min-width: 700px) and (min-height: 1000px)", 184], // portrait tablet
  ["(min-width: 700px) and (min-height: 761px)", 148], // landscape tablet, desktop
  ["(min-height: 800px)", 120], // tall phone
];
const SMALL = 104;

function sizeNow(): number {
  return SIZES.find(([query]) => window.matchMedia(query).matches)?.[1] ?? SMALL;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useLessonPogoSize(): number {
  return useSyncExternalStore(subscribe, sizeNow, () => SMALL);
}
