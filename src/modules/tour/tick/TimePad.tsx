// The time pad: a big "H : MM" display with two tappable fields and a number
// pad (0–9 in two rows of five, so it fits under a clock on a small phone) with
// a rub-out key beside the display. Typing rules: ./padRules.ts. Reports
// `timeKey` of the typed time once both parts are complete, else null.
import { useState } from "react";
import { TICK } from "../../../strings/tick";
import { tourSound, useDraft } from "../exercises/shared";
import { padReducer, padStart, padValue, type PadAction, type PadField, type PadState } from "./padRules";
import { EraseGlyph } from "./TickGlyphs";

const S = TICK.exercise;
const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export interface TimePadProps {
  /** Whole-hour lessons: minutes are "00" and cannot be changed. */
  lockMinutes: boolean;
  disabled: boolean;
  onDraft: (value: string | null) => void;
}

function Slots({ text, count, caret }: { text: string; count: number; caret: boolean }) {
  const cells = Array.from({ length: Math.max(count, text.length) }, (_, i) => text[i] ?? "");
  return (
    <>
      {cells.map((ch, i) => (
        <span key={i} className={`tk-slot ${ch === "" ? "is-empty" : ""} ${caret && i === text.length ? "is-caret" : ""}`}>{ch}</span>
      ))}
    </>
  );
}

function Field({ field, s, disabled, onFocus }: { field: PadField; s: PadState; disabled: boolean; onFocus: (f: PadField) => void }) {
  const hour = field === "hour";
  const active = s.field === field && !disabled;
  const locked = !hour && s.lockMinutes;
  const text = hour ? s.hour : s.minute;
  // the hour may still grow ("1" → "12"): show a waiting slot after a lone 1
  const grows = hour ? text === "" || text === "1" : text.length < 2;
  const caret = active && !s.fresh && grows;
  const extra = caret && text !== "" ? 1 : 0;
  const count = hour ? Math.max(1, text.length + extra) : 2;
  return (
    <button
      type="button" className={`tk-field is-${field} ${active ? "is-active" : ""} ${active && s.fresh ? "is-fresh" : ""} ${locked ? "is-locked" : ""}`}
      disabled={disabled || locked} onClick={() => onFocus(field)}
      aria-label={hour ? S.hourField : S.minuteField} aria-pressed={active} data-testid={`tick-field-${field}`}
    >
      <span key={s.shakeField === field ? s.shake : 0} className={`tk-field-in ${s.shake > 0 && s.shakeField === field ? "is-shake" : ""}`}>
        <Slots text={text} count={count} caret={caret} />
      </span>
    </button>
  );
}

export function TimePad({ lockMinutes, disabled, onDraft }: TimePadProps) {
  const [s, setS] = useState(() => padStart(lockMinutes));
  const value = padValue(s);
  useDraft(onDraft, value);

  const act = (action: PadAction) => {
    if (disabled) return;
    const next = padReducer(s, action);
    if (next.shake === s.shake && next !== s) tourSound.pop();
    setS(next);
  };

  return (
    <div className={`tk-pad ${disabled ? "is-disabled" : ""}`}>
      <div className="tk-pad-top">
        <div className="tk-display" data-testid="tick-display" data-value={value ?? ""} role="group" aria-label={S.timeDisplay}>
          <Field field="hour" s={s} disabled={disabled} onFocus={(field) => act({ type: "focus", field })} />
          <span className="tk-colon" aria-hidden="true">:</span>
          <Field field="minute" s={s} disabled={disabled} onFocus={(field) => act({ type: "focus", field })} />
        </div>
        <button
          type="button" className="tbtn tk-erase" disabled={disabled || (s.hour === "" && (lockMinutes || s.minute === ""))}
          onClick={() => act({ type: "back" })} aria-label={S.erase} data-testid="tick-pad-back"
        >
          <EraseGlyph size={30} />
        </button>
      </div>
      <div className="tk-keys">
        {KEYS.map((digit) => (
          <button
            key={digit} type="button" className="tbtn tk-key" disabled={disabled}
            onClick={() => act({ type: "digit", digit })} data-testid={`tick-pad-${digit}`}
          >
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
}
