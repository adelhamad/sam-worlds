import { useEffect, useRef, useState } from "react";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";
import { drawShapePath, scoreTrace, SIZE, INK_W, type Stroke } from "./traceGfx";

/** Draw-the-answer input: the child traces a faint number / letter / shape. */
export function TraceCanvas({ question, disabled, onSubmit }: {
  question: Question;
  disabled: boolean;
  onSubmit: (v: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const glyph = String(question.payload?.glyph ?? question.answer);
  const kind = String(question.payload?.kind ?? "glyph");

  function paint() {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    if (kind === "shape") {
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(159,176,216,0.55)";
      drawShapePath(ctx, glyph);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(159,176,216,0.22)";
      ctx.font = 'bold 240px "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, SIZE / 2, SIZE / 2 + 12);
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = INK_W;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const st of strokes.current) {
      if (!st.length) continue;
      ctx.beginPath();
      st.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Paint the faint guide once on mount. (PlayStage keys this input by question
  // id, so a fresh component — empty strokes — mounts for every new glyph.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { paint(); }, []);

  function at(e: React.PointerEvent): [number, number] {
    const r = ref.current!.getBoundingClientRect();
    return [(e.clientX - r.left) * (SIZE / r.width), (e.clientY - r.top) * (SIZE / r.height)];
  }
  function down(e: React.PointerEvent) {
    if (disabled) return;
    drawing.current = true;
    strokes.current.push([at(e)]);
    ref.current?.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    strokes.current[strokes.current.length - 1].push(at(e));
    paint();
  }
  function up() {
    drawing.current = false;
  }

  function check() {
    if (disabled) return;
    const s = scoreTrace(glyph, kind, strokes.current);
    if (s.pass) {
      setFeedback(null);
      onSubmit(question.answer);
    } else {
      sfx.wrong();
      setFeedback(s.coverage < 0.35 ? "Trace right over the shape! ✏️" : "Almost — fill in a bit more!");
    }
  }
  function clear() {
    strokes.current = [];
    setFeedback(null);
    paint();
  }

  return (
    <div className="trace-wrap">
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        className="trace-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      {feedback && <div className="trace-feedback">{feedback}</div>}
      <div className="trace-actions">
        <button className="btn btn-secondary" disabled={disabled} onClick={clear}>↺ Clear</button>
        <button className="btn btn-primary" disabled={disabled} onClick={check}>✓ Check</button>
      </div>
    </div>
  );
}
