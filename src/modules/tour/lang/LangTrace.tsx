// lang-trace — write a letter with a finger. Self-submitting: the canvas
// reports once the letter is written (or after too many slips).
// PLACEHOLDER until the tracing canvas (src/ui/write) is merged: it shows the
// letter and a button, so the lesson flow can be built and tested around it.
import { TRACED, type TracePayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import type { WidgetProps } from "../exercises/shared";
import { PhraseFace } from "./LangFaces";

export function LangTrace({ payload, disabled, onSubmit }: WidgetProps<TracePayload>) {
  return (
    <div className="tx lx lx-trace" data-testid="lang-trace" data-letter={payload.letter.id} data-guide={payload.guide}>
      <div className="lx-hero is-read"><PhraseFace card={payload.model} lang={payload.lang} /></div>
      <button type="button" className="tbtn tbtn-go" disabled={disabled} onClick={() => onSubmit(TRACED)} data-testid="lang-trace-done">
        {LANG.ui.yourTurn}
      </button>
    </div>
  );
}
