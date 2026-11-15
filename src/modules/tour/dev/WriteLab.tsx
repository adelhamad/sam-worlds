// DEV-only test bench for the handwriting tracer (route /tour/lab/write).
// Top: the whole alphabet, each letter's faint font glyph with its strokes on
// top — numbered, start dots, direction chevrons — to check shape, order and
// direction by eye. Below: a live <TraceCanvas> for the selected letter.
//   ?letter=ba            selected letter          ?guide=memory   memory mode
//   ?view=grid|trace      one half only             ?sheet=1..4     7 letters per sheet, big (screenshots)
//   ?auto=0               no automatic Watch
import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "@fontsource-variable/noto-sans-arabic";
import "../../../ui/tour/tour-base.css";
import "../../../ui/write/write.css";
import { ARABIC_LETTERS, ARABIC_LETTER_BY_ID } from "../../../content/arabic/letters";
import type { GlyphStrokes, GuideLevel, Point, TraceAttempt } from "../../../engine/write/types";
import { TraceCanvas, type TraceStrokeEvent } from "../../../ui/write/TraceCanvas";
import { GlyphLetter, StrokeBadge } from "../../../ui/write/TraceGuide";
import { chevronD, chevrons, dotRadius, pathD } from "../../../ui/write/paths";

const HUES = [190, 45, 300, 120, 20, 260];
const LAB_CSS = ".lab-letter { fill: #9db4d6; opacity: 0.55; } .lab-badge .write-badge circle { fill: #fff; stroke: currentColor; stroke-width: 6; } .lab-badge .write-badge text { fill: #222; font-family: var(--t-font); font-weight: 900; font-size: 34px; }";

const css: Record<string, CSSProperties> = {
  page: { minHeight: "100dvh", background: "var(--t-bg)", padding: 16, display: "flex", flexDirection: "column", gap: 18, boxSizing: "border-box" },
  grid: { display: "grid", gap: 10 },
  cell: { background: "#fbfaf6", borderRadius: 14, padding: 4, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", border: "3px solid transparent" },
  name: { color: "#333", fontSize: 13, fontWeight: 800, textAlign: "center", lineHeight: 1.2 },
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", color: "var(--t-ink)" },
  log: { fontFamily: "ui-monospace, monospace", fontSize: 13, color: "var(--t-ink-dim)", whiteSpace: "pre-wrap", wordBreak: "break-all" },
};

/** One letter with its strokes drawn over the font glyph (for checking by eye). */
function StrokeMap({ glyph }: { glyph: GlyphStrokes }) {
  const dots = glyph.strokes.filter((s) => s.kind === "dot").map((s) => s.points[0]);
  const middle: Point | undefined = dots.length ? [dots.reduce((a, p) => a + p[0], 0) / dots.length, dots.reduce((a, p) => a + p[1], 0) / dots.length] : undefined;
  return (
    <svg viewBox={`0 0 ${glyph.box} ${glyph.box}`} style={{ width: "100%", display: "block" }} data-testid={`map-${glyph.id}`}>
      <line x1={30} x2={970} y1={glyph.font.baseline} y2={glyph.font.baseline} stroke="#c9c3b5" strokeWidth={3} strokeDasharray="10 12" />
      <GlyphLetter glyph={glyph} className="lab-letter" />
      {glyph.strokes.map((stroke, i) => {
        const colour = `hsl(${HUES[i % HUES.length]} 80% 38%)`;
        const [sx, sy] = stroke.points[0];
        return (
          <g key={i} style={{ color: colour }}>
            {stroke.kind === "line" && (
              <>
                <path d={pathD(stroke.points)} fill="none" stroke={colour} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
                {chevrons(stroke.points, 95, 60).map((c, j) => (
                  <path key={j} d={chevronD(30)} fill="none" stroke={colour} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
                    transform={`translate(${c.x} ${c.y}) rotate(${(c.angle * 180) / Math.PI})`} />
                ))}
              </>
            )}
            <circle cx={sx} cy={sy} r={stroke.kind === "dot" ? dotRadius(glyph) * 0.7 : 20} fill={colour} />
            <g className="lab-badge"><StrokeBadge stroke={stroke} n={i + 1} away={middle} /></g>
          </g>
        );
      })}
    </svg>
  );
}

function Grid({ letters, columns, selected, onPick }: { letters: typeof ARABIC_LETTERS; columns: number; selected: string; onPick: (id: string) => void }) {
  return (
    <section style={{ ...css.grid, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} data-testid="write-grid">
      {letters.map((letter) => (
        <button key={letter.id} type="button" onClick={() => onPick(letter.id)}
          style={{ ...css.cell, borderColor: letter.id === selected ? "var(--t-go)" : "transparent" }}>
          <StrokeMap glyph={letter.glyph} />
          <span style={css.name}>{letter.name} · {letter.glyph.strokes.length}</span>
        </button>
      ))}
    </section>
  );
}

function TraceBench({ letterId, guide, auto, onGuide }: { letterId: string; guide: GuideLevel; auto: boolean; onGuide: (g: GuideLevel) => void }) {
  const [log, setLog] = useState<string[]>([]);
  const [verdict, setVerdict] = useState("");
  const [round, setRound] = useState(0);
  const letter = ARABIC_LETTER_BY_ID.get(letterId)!;
  const onStroke = (e: TraceStrokeEvent) => setLog((l) => [...l, `stroke ${e.index + 1}: ${e.ok ? "ok" : e.reason} (done ${e.done}/${e.total}, slips ${e.slips})`]);
  const onDone = (v: string, attempts: TraceAttempt[]) => setVerdict(`${v} after ${attempts.length} attempts`);
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }} data-testid="write-trace">
      <div style={css.bar}>
        <strong style={{ fontSize: 22 }}>{letter.glyph.draw ?? letter.char} {letter.name}</strong>
        <span style={{ color: "var(--t-ink-dim)" }}>sounds like: {letter.sound}</span>
      </div>
      <div style={css.bar}>
        {(["guided", "memory"] as const).map((g) => (
          <button key={g} type="button" className={`tbtn ${g === guide ? "tbtn-go" : "tbtn-ghost"}`} onClick={() => onGuide(g)}>{g}</button>
        ))}
        <button type="button" className="tbtn tbtn-ghost" onClick={() => { setRound((r) => r + 1); setLog([]); setVerdict(""); }}>reset</button>
      </div>
      <TraceCanvas key={round} glyph={letter.glyph} guide={guide} autoWatch={auto} onStroke={onStroke} onDone={onDone} />
      <div style={css.log} data-testid="write-log">{`verdict: ${verdict || "(writing)"}\n${log.join("\n")}`}</div>
    </section>
  );
}

export default function WriteLab() {
  const [params, setParams] = useSearchParams();
  const selected = ARABIC_LETTER_BY_ID.has(params.get("letter") ?? "") ? (params.get("letter") as string) : "ba";
  const guide: GuideLevel = params.get("guide") === "memory" ? "memory" : "guided";
  const view = params.get("view");
  const sheet = Number(params.get("sheet") ?? 0);
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  if (sheet > 0) {
    return (
      <div className="tour" style={{ ...css.page, background: "#fff", padding: 8 }}>
        <style>{LAB_CSS}</style>
        <Grid letters={ARABIC_LETTERS.slice((sheet - 1) * 7, sheet * 7)} columns={2} selected="" onPick={() => {}} />
      </div>
    );
  }
  return (
    <div className="tour" style={css.page}>
      <style>{LAB_CSS}</style>
      {view !== "grid" && (
        <TraceBench key={`${selected}:${guide}`} letterId={selected} guide={guide} auto={params.get("auto") !== "0"} onGuide={(g) => set("guide", g)} />
      )}
      {view !== "trace" && <Grid letters={ARABIC_LETTERS} columns={4} selected={selected} onPick={(id) => set("letter", id)} />}
    </div>
  );
}
