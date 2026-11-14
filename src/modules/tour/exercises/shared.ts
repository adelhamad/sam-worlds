// Shared, non-component bits for the World Tour exercise widgets.
import { useCallback, useEffect, useRef } from "react";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import type { ExerciseProps } from "./contract";

/** Props every widget receives: the shell contract + its narrowed payload. */
export type WidgetProps<P> = ExerciseProps & { payload: P };

/** The widgets' sound palette (tourSfx already respects the global mute). */
export const tourSound = {
  /** A tile, card or pot was picked up / selected. */
  pop: (): void => tourSfx.pop(),
  /** Something landed: tile in a slot, card in a bucket, paint on a band, pin on the map. */
  place: (): void => tourSfx.place(),
  /** A pair matched. */
  match: (): void => tourSfx.match(),
  /** A gentle "not that one" (pairs mismatch) — never harsh. */
  nudge: (): void => tourSfx.nudge(),
};

/** Report the current draft to the shell whenever it changes (never during render). */
export function useDraft(onDraft: (value: string | null) => void, value: string | null): void {
  const latest = useRef(onDraft);
  useEffect(() => {
    latest.current = onDraft;
  });
  useEffect(() => {
    latest.current(value);
  }, [value]);
}

/** `later(fn, ms)` — timeouts that are cancelled automatically on unmount. */
export function useTimers(): (fn: () => void, ms: number) => void {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), []);
  return useCallback((fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms));
  }, []);
}

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Flag canvas size in SVG units (3:2). */
export const FLAG_W = 300;
export const FLAG_H = 200;

export interface BandRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Split the 3:2 flag canvas into bands: "v" = left→right, "h" = top→bottom. */
export function bandRects(dir: "v" | "h", weights: number[]): BandRect[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let offset = 0;
  return weights.map((weight) => {
    const share = weight / total;
    const rect = dir === "v"
      ? { x: offset * FLAG_W, y: 0, w: share * FLAG_W, h: FLAG_H }
      : { x: 0, y: offset * FLAG_H, w: FLAG_W, h: share * FLAG_H };
    offset += share;
    return rect;
  });
}
