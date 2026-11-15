// <TraceCanvas> — trace one letter with a finger, stroke by stroke, in order.
// Self-contained (no store, no sound imports): it reports through callbacks and
// never judges by itself — every lift goes through judgeGlyphStroke() and the
// final answer through traceVerdict() (src/engine/write/).
//
//   <TraceCanvas glyph={arabicGlyph("ba")} guide="guided" onDone={(verdict) => submit(verdict)} />
//
// The letter reports once: TRACE_DONE when every stroke was written in order
// with at most MAX_SLIPS slips, or "miss:slips:N" as soon as a slip goes past
// MAX_SLIPS (the lesson then teaches and moves on). Remount it (React `key`) for
// a fresh try; changing `glyph` or `guide` starts over by itself.
import "@fontsource-variable/noto-sans-arabic";
import "../tour/tour-base.css";
import "./write.css";
import { useState, type CSSProperties } from "react";
import type { GlyphStrokes, GuideLevel, SlipReason, Stroke, TraceAttempt } from "../../engine/write/types";
import { TRACE_DONE } from "../../engine/write/verdict";
import { WRITE } from "../../strings/write";
import { GlyphLetter, InkStroke, StrokeGuide, StrokeOverview, WritingLine } from "./TraceGuide";
import { useTraceFlow, type TraceFlow } from "./useTraceFlow";
import { WatchDemo } from "./WatchDemo";

export interface TraceStrokeEvent {
  /** The stroke that was attempted (0-based). */
  index: number;
  ok: boolean;
  reason?: SlipReason;
  /** Strokes written so far / in the letter, and slips so far. */
  done: number;
  total: number;
  slips: number;
}

export interface TraceCanvasProps {
  glyph: GlyphStrokes;
  /** "guided" (default): path, arrows and start dot. "memory": the faint letter only, guide after a slip. */
  guide?: GuideLevel;
  /** Ignore the finger (e.g. while a feedback sheet is up). */
  disabled?: boolean;
  /** Play "Watch" by itself the first time this letter is shown in the session (default true). */
  autoWatch?: boolean;
  /** Largest size in px (default: 340 on phones, 460 on tablets). */
  maxSize?: number;
  /** Every lift: a sound hook (ok → chime, slip → soft "aww"). */
  onStroke?: (event: TraceStrokeEvent) => void;
  onProgress?: (done: number, total: number) => void;
  /** Once per letter: TRACE_DONE or "miss:…", plus the attempts it was judged from. */
  onDone?: (verdict: string, attempts: TraceAttempt[]) => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function PlayIcon() {
  return (
    <svg className="write-play" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}

export function TraceCanvas(props: TraceCanvasProps) {
  return <TraceBoard key={`${props.glyph.id}:${props.guide ?? "guided"}`} {...props} />;
}

function hintFor(hint: SlipReason | null, current: Stroke | undefined): string | null {
  if (!hint) return null;
  return current?.kind === "dot" && hint === "start" ? WRITE.tapDot : WRITE.hint[hint];
}

interface LayersProps { glyph: GlyphStrokes; flow: TraceFlow; guide: GuideLevel; reduced: boolean }

/** Everything drawn under the ink canvas (SVG, design units). */
function PadLayers({ glyph, flow, guide, reduced }: LayersProps) {
  const { done, helped, watching, verdict, popped, fontReady, endWatch } = flow;
  const current = verdict === null ? glyph.strokes[done] : undefined;
  const showGuide = !!current && !watching && (guide === "guided" || helped);
  return (
    <svg className="write-svg" viewBox={`0 0 ${glyph.box} ${glyph.box}`} aria-hidden="true">
      <WritingLine glyph={glyph} />
      {fontReady && <GlyphLetter glyph={glyph} />}
      {!watching && (
        <g className="write-written">
          {glyph.strokes.slice(0, done).map((stroke, i) => (
            <InkStroke key={i} glyph={glyph} stroke={stroke} className={`write-ink-done${i === popped ? " write-pop" : ""}`} />
          ))}
        </g>
      )}
      {showGuide && current && <StrokeGuide glyph={glyph} stroke={current} n={done + 1} still={reduced} />}
      {watching && fontReady && (reduced ? <StrokeOverview glyph={glyph} /> : <WatchDemo glyph={glyph} onEnd={endWatch} />)}
    </svg>
  );
}

function TraceBoard({ glyph, guide = "guided", disabled = false, autoWatch = true, maxSize, onStroke, onProgress, onDone }: TraceCanvasProps) {
  const total = glyph.strokes.length;
  const [reduced] = useState(prefersReducedMotion);
  const flow = useTraceFlow({ glyph, guide, disabled, autoWatch, reduced, onStroke, onProgress, onDone });
  const { done, hint, watching, setWatching, verdict, fading, fontReady, attachInk } = flow;
  const style = maxSize ? ({ "--write-max": `${maxSize}px` } as CSSProperties) : undefined;
  const hintText = hintFor(hint, verdict === null ? glyph.strokes[done] : undefined);
  const finished = verdict === TRACE_DONE;
  return (
    <div className="tour write" style={style} data-testid="trace-canvas" data-letter={glyph.id} data-done={done}
      data-total={total} data-verdict={verdict ?? ""} data-watching={watching ? "1" : "0"}>
      <div className={`write-pad${finished ? " write-pad--done" : ""}`}>
        <PadLayers glyph={glyph} flow={flow} guide={guide} reduced={reduced} />
        <canvas ref={attachInk} className={`write-ink${fading ? " write-ink--fade" : ""}`} role="img"
          aria-label={WRITE.areaLabel} data-testid="write-ink" />
        {hintText && <div className="write-hint" role="status" data-testid="write-hint" data-reason={hint}>{hintText}</div>}
      </div>
      <div className="write-bar">
        <button type="button" className="tbtn tbtn-ghost write-watch" data-testid="write-watch"
          disabled={watching || verdict !== null || !fontReady} onClick={() => setWatching(true)}>
          <PlayIcon />
          {watching ? WRITE.watching : WRITE.watch}
        </button>
        <span className="write-count" data-testid="write-count">
          {finished ? WRITE.done : WRITE.strokeOf(Math.min(done + 1, total), total)}
        </span>
      </div>
    </div>
  );
}
