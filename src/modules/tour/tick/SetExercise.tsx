// tick-set — the goal is written large ("half past 4", "3:30", or for
// "later-set" the jump next to the "before" clock); the child turns the hands
// from `start` and presses CHECK. Draft = timeKey of what the hands show, but
// only once they have been moved (CHECK cannot be pressed on the untouched start).
import { useState } from "react";
import { timeKey, toMinutes } from "../../../engine/tick/clock";
import type { SetPayload } from "../../../engine/tick/types";
import { TICK } from "../../../strings/tick";
import { ClockFace } from "../../../ui/clock/ClockFace";
import { useDraft, type WidgetProps } from "../exercises/shared";
import { HandClock } from "./HandClock";
import { timeOf } from "./tickClock";
import { ArrowGlyph } from "./TickGlyphs";

const S = TICK.exercise;

function helpOf(payload: SetPayload): string {
  if (payload.jump > 0) return S.help.laterSet;
  return payload.step === 60 ? S.help.setHour : S.help.set;
}

export function SetExercise({ payload, disabled, onDraft }: WidgetProps<SetPayload>) {
  const [hands, setHands] = useState({ total: toMinutes(payload.start), moved: false });
  useDraft(onDraft, hands.moved ? timeKey(timeOf(hands.total)) : null);
  const later = payload.jump > 0;
  return (
    <div className={`tk tk-set ${later ? "is-later" : ""}`} data-testid="tick-set">
      <p className="tk-help">{helpOf(payload)}</p>
      <div className="tk-goal" data-testid="tick-goal">
        {later && (
          <>
            <span className="tk-goal-now">
              <ClockFace time={payload.start} size={46} />
              <b>{timeKey(payload.start)}</b>
            </span>
            <ArrowGlyph size={24} className="tk-goal-arrow" />
          </>
        )}
        <strong className="tk-goal-say">{payload.say}</strong>
      </div>
      <HandClock
        total={hands.total} step={payload.step} disabled={disabled}
        onTotal={(total) => setHands({ total, moved: true })} className="tk-set-clock"
      />
    </div>
  );
}
