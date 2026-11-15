// Finger ink for the tracer: native Pointer Events on a <canvas>, pointer
// capture, coalesced events, device-pixel-ratio aware, drawn straight to the
// canvas (no React state per move). One finger at a time: other pointers that
// land while one is drawing (a palm, a second finger) are ignored. On lift the
// trail is handed over in design-box units.
import { useCallback, useEffect, useRef } from "react";
import type { Point } from "../../engine/write/types";

export interface InkOptions {
  box: number;
  /** Ink line width, design units. */
  width: number;
  enabled: boolean;
  /** A finger went down (also while not enabled — e.g. to skip the demo). */
  onDown?: () => void;
  /** The finger lifted: its trail in design units (one point for a tap). */
  onLift: (points: Point[]) => void;
}

export interface Ink {
  /** Callback ref for the <canvas>. */
  attach: (canvas: HTMLCanvasElement | null) => void;
  /** The canvas element, once mounted (read it in handlers, not while rendering). */
  element: () => HTMLCanvasElement | null;
  /** Wipes the canvas. */
  clear: () => void;
  /** Redraws the last trail in `color` (a slip shows amber) — call before fading it out. */
  recolor: (color: string) => void;
}

function setup(canvas: HTMLCanvasElement, box: number): CanvasRenderingContext2D | null {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width * dpr));
  if (canvas.width !== w || canvas.height !== w) {
    canvas.width = w;
    canvas.height = w;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(w / box, 0, 0, w / box, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return ctx;
}

function strokeTrail(ctx: CanvasRenderingContext2D, pts: readonly Point[], from: number): void {
  // Quadratic curves through the midpoints: smooth ink with no lag behind the finger.
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  const start = Math.max(1, from);
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = start === 1 ? pts[0] : mid(pts[start - 2], pts[start - 1]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = start; i < pts.length; i++) {
    const m = mid(pts[i - 1], pts[i]);
    ctx.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], m[0], m[1]);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
}


interface Wiring {
  live: React.MutableRefObject<InkOptions>;
  trail: React.MutableRefObject<Point[]>;
  clear: () => void;
  paint: (color: string, from: number) => void;
}

/** Wires the pointer listeners to a canvas; returns the function that removes them. */
function listen(canvas: HTMLCanvasElement, { live, trail, clear, paint }: Wiring): () => void {
  let active: number | null = null;
  const ink = () => getComputedStyle(canvas).getPropertyValue("--write-ink").trim() || "#f2f6ff";
  const toBox = (e: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    const box = live.current.box;
    return [((e.clientX - rect.left) / rect.width) * box, ((e.clientY - rect.top) / rect.height) * box];
  };
  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (active !== null) return; // palm or second finger
    live.current.onDown?.();
    if (!live.current.enabled) return;
    active = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // synthetic pointers cannot be captured; the canvas still gets their events
    }
    clear();
    trail.current = [toBox(e)];
    paint(ink(), 1);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    e.preventDefault();
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const from = trail.current.length;
    for (const c of events.length ? events : [e]) trail.current.push(toBox(c));
    paint(ink(), from);
  };
  const end = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    active = null;
    const points = trail.current;
    if (e.type === "pointercancel") {
      trail.current = [];
      clear();
      return;
    }
    live.current.onLift(points);
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", end);
    canvas.removeEventListener("pointercancel", end);
  };
}

export function useInk(options: InkOptions): Ink {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef(options);
  const trail = useRef<Point[]>([]);
  useEffect(() => {
    live.current = options;
  });

  const paint = useCallback((color: string, from: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setup(canvas, live.current.box);
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = live.current.width;
    strokeTrail(ctx, trail.current, from);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && setup(canvas, live.current.box);
    if (ctx) ctx.clearRect(0, 0, live.current.box, live.current.box);
  }, []);

  const recolor = useCallback((color: string) => {
    clear();
    paint(color, 1);
  }, [clear, paint]);

  const detach = useRef<(() => void) | null>(null);
  const attach = useCallback((canvas: HTMLCanvasElement | null) => {
    detach.current?.();
    detach.current = null;
    canvasRef.current = canvas;
    if (canvas) detach.current = listen(canvas, { live, trail, clear, paint });
  }, [clear, paint]);
  const element = useCallback(() => canvasRef.current, []);

  return { attach, element, clear, recolor };
}
