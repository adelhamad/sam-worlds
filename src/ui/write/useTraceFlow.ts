// The tracer's state machine: which stroke is next, slips, the hint, the
// memory-mode guide, the Watch demo and the final verdict. Every lift is
// judged by judgeGlyphStroke() and the answer by traceVerdict(), with the same
// guide level, so the canvas and the verdict cannot disagree.
import { useCallback, useEffect, useRef, useState } from "react";
import { judgeGlyphStroke } from "../../engine/write/judge";
import { MAX_SLIPS } from "../../engine/write/tolerance";
import type { GlyphStrokes, GuideLevel, Point, SlipReason, TraceAttempt } from "../../engine/write/types";
import { traceVerdict } from "../../engine/write/verdict";
import type { TraceStrokeEvent } from "./TraceCanvas";
import { useInk } from "./useInk";

/** Letters that already played their automatic "Watch" in this session. */
const watchedOnce = new Set<string>();
const FADE_MS = 480;
const POP_MS = 600;
const OVERVIEW_MS = 4000;

export interface TraceFlowOptions {
  glyph: GlyphStrokes;
  guide: GuideLevel;
  disabled: boolean;
  autoWatch: boolean;
  /** Reduced motion: "Watch" shows the numbered strokes for a few seconds instead. */
  reduced: boolean;
  onStroke?: (event: TraceStrokeEvent) => void;
  onProgress?: (done: number, total: number) => void;
  onDone?: (verdict: string, attempts: TraceAttempt[]) => void;
}

function useFontReady(glyph: GlyphStrokes): boolean {
  const [ready, setReady] = useState(() => typeof document === "undefined" || !document.fonts);
  useEffect(() => {
    let alive = true;
    if (typeof document === "undefined" || !document.fonts) return;
    const spec = `${glyph.font.weight} 100px "${glyph.font.family}"`;
    const done = () => {
      if (alive) setReady(true);
    };
    document.fonts.load(spec, glyph.char).then(done, done);
    return () => {
      alive = false;
    };
  }, [glyph]);
  return ready;
}

export function useTraceFlow({ glyph, guide, disabled, autoWatch, reduced, onStroke, onProgress, onDone }: TraceFlowOptions) {
  const total = glyph.strokes.length;
  const [done, setDone] = useState(0);
  const [hint, setHint] = useState<SlipReason | null>(null);
  const [helped, setHelped] = useState(false);
  const [watching, setWatching] = useState(() => autoWatch && !watchedOnce.has(glyph.id));
  const [verdict, setVerdict] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [popped, setPopped] = useState(-1);
  const fontReady = useFontReady(glyph);
  const progress = useRef({ done: 0, slips: 0, attempts: [] as TraceAttempt[] });
  const timers = useRef<number[]>([]);
  const fadeTimer = useRef<number | null>(null);
  const callbacks = useRef({ onStroke, onProgress, onDone });
  useEffect(() => {
    callbacks.current = { onStroke, onProgress, onDone };
  });
  useEffect(() => {
    if (watching) watchedOnce.add(glyph.id);
  }, [watching, glyph.id]);
  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const finish = useCallback((result: string) => {
    setVerdict(result);
    callbacks.current.onDone?.(result, [...progress.current.attempts]);
  }, []);

  const ink = useInk({
    box: glyph.box,
    width: glyph.width * 0.62,
    enabled: !disabled && !watching && verdict === null && fontReady,
    onDown: () => {
      if (watching) setWatching(false);
      setHint(null);
      // A new stroke right after a slip: drop the fade so the new ink shows at once.
      if (fadeTimer.current !== null) {
        window.clearTimeout(fadeTimer.current);
        fadeTimer.current = null;
        setFading(false);
      }
    },
    onLift: (points: Point[]) => {
      const p = progress.current;
      const index = p.done;
      p.attempts.push({ stroke: index, points });
      const judged = judgeGlyphStroke(glyph, index, points, guide);
      if (judged.ok) {
        p.done = index + 1;
        ink.clear();
        setDone(p.done);
        setPopped(index);
        setHelped(false);
        later(() => setPopped(-1), POP_MS);
      } else {
        p.slips += 1;
        const canvas = ink.element();
        ink.recolor((canvas && getComputedStyle(canvas).getPropertyValue("--write-slip").trim()) || "#ffb454");
        setFading(true);
        fadeTimer.current = window.setTimeout(() => {
          fadeTimer.current = null;
          ink.clear();
          setFading(false);
        }, FADE_MS);
        setHint(judged.reason ?? "shape");
        if (guide === "memory") setHelped(true);
      }
      callbacks.current.onStroke?.({ index, ok: judged.ok, reason: judged.reason, done: p.done, total, slips: p.slips });
      if (judged.ok) callbacks.current.onProgress?.(p.done, total);
      if (p.done === total || p.slips > MAX_SLIPS) finish(traceVerdict(glyph, p.attempts, guide));
    },
  });

  const endWatch = useCallback(() => setWatching(false), []);
  useEffect(() => {
    if (!watching || !reduced) return;
    const t = window.setTimeout(() => setWatching(false), OVERVIEW_MS);
    return () => window.clearTimeout(t);
  }, [watching, reduced]);

  return { done, hint, helped, watching, setWatching, endWatch, verdict, fading, popped, fontReady, attachInk: ink.attach };
}

export type TraceFlow = ReturnType<typeof useTraceFlow>;
