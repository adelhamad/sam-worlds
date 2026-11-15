// lang-trace — write a letter with a finger, stroke by stroke. Self-submitting:
// the tracing canvas (src/ui/write) reports once — the letter is written, or
// too many strokes slipped — and never judges by itself (src/engine/write does).
import { TRACED, type TracePayload } from "../../../engine/lang/types";
import { TRACE_DONE } from "../../../engine/write/verdict";
import { TraceCanvas, type TraceStrokeEvent } from "../../../ui/write/TraceCanvas";
import { tourSound, type WidgetProps } from "../exercises/shared";
import { glyphOf } from "./glyphs";

const onStroke = (event: TraceStrokeEvent) => (event.ok ? tourSound.place() : tourSound.nudge());

export function LangTrace({ payload, disabled, onSubmit }: WidgetProps<TracePayload>) {
  const glyph = glyphOf(payload.letter.char);
  if (!glyph) return null;
  return (
    <div className="tx lx lx-trace" data-testid="lang-trace" data-letter={payload.letter.id} data-guide={payload.guide}>
      <TraceCanvas
        glyph={glyph} guide={payload.guide} disabled={disabled} onStroke={onStroke}
        onDone={(verdict) => onSubmit(verdict === TRACE_DONE ? TRACED : verdict)}
      />
    </div>
  );
}
