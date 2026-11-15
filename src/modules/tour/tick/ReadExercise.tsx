// tick-read — a clock is shown; the child types the time on the time pad.
// "later-read": a chip under the clock says the jump ("30 minutes later") and
// the child types the LATER time. Draft = timeKey of the typed time, or null
// until both hour and minutes are complete.
import { addMinutes, jumpWords } from "../../../engine/tick/clock";
import type { ReadPayload } from "../../../engine/tick/types";
import { TICK } from "../../../strings/tick";
import { ClockFace } from "../../../ui/clock/ClockFace";
import type { WidgetProps } from "../exercises/shared";
import { LaterGlyph } from "./TickGlyphs";
import { TimePad } from "./TimePad";

const S = TICK.exercise;

function helpOf(payload: ReadPayload): string {
  if (payload.jump > 0) return S.help.later;
  return payload.step === 60 ? S.help.readHour : S.help.read;
}

export function ReadExercise({ payload, disabled, onDraft }: WidgetProps<ReadPayload>) {
  const later = payload.jump > 0;
  // whole-hour lessons type only the hour — unless the answer is not on the hour
  const lockMinutes = payload.step === 60 && addMinutes(payload.shown, payload.jump).minute === 0;
  return (
    <div className={`tk tk-read ${later ? "is-later" : ""}`} data-testid="tick-read">
      <p className="tk-help">{helpOf(payload)}</p>
      <div className="tk-read-clock">
        <ClockFace time={payload.shown} />
      </div>
      {later && (
        <div className="tk-jump" data-testid="tick-jump">
          <LaterGlyph size={26} />
          <span>{S.later(jumpWords(payload.jump))}</span>
        </div>
      )}
      <TimePad lockMinutes={lockMinutes} disabled={disabled} onDraft={onDraft} />
    </div>
  );
}
