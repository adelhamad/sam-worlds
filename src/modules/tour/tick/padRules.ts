// The time pad's typing rules (pure). The hour fills first (1–12): a first
// digit 2–9 completes it at once; "1" waits for a possible 0–2 (10, 11, 12)
// and moves on when the next digit cannot extend it (that digit then starts
// the minutes). Minutes take two digits 00–59. An impossible digit is refused
// with a tiny wobble (`shake` counts them), never a message. When the lesson is
// about whole hours the minutes are locked to "00".
import { timeKey } from "../../../engine/tick/clock";

export type PadField = "hour" | "minute";

export interface PadState {
  hour: string;
  minute: string;
  field: PadField;
  /** The active field was tapped while filled: the next digit starts it again. */
  fresh: boolean;
  lockMinutes: boolean;
  /** Bumps on every refused digit (replays the wobble). */
  shake: number;
  shakeField: PadField;
}

export type PadAction = { type: "digit"; digit: number } | { type: "back" } | { type: "focus"; field: PadField };

export function padStart(lockMinutes: boolean): PadState {
  return { hour: "", minute: lockMinutes ? "00" : "", field: "hour", fresh: false, lockMinutes, shake: 0, shakeField: "hour" };
}

const refuse = (s: PadState, field: PadField): PadState => ({ ...s, shake: s.shake + 1, shakeField: field });

function typeMinute(s: PadState, digit: number): PadState {
  const m = s.fresh ? "" : s.minute;
  if (m.length >= 2) return refuse(s, "minute");
  if (m === "" && digit > 5) return refuse({ ...s, field: "minute" }, "minute");
  return { ...s, field: "minute", fresh: false, minute: m + digit };
}

/** The hour is done: go on to the minutes (or stay, ready to retype, when they are locked). */
function hourDone(s: PadState, hour: string): PadState {
  return s.lockMinutes ? { ...s, hour, field: "hour", fresh: true } : { ...s, hour, field: "minute", fresh: s.minute.length === 2 };
}

function typeHour(s: PadState, digit: number): PadState {
  const h = s.fresh ? "" : s.hour;
  if (h === "1") {
    if (digit <= 2) return hourDone(s, `1${digit}`);
    if (s.lockMinutes) return hourDone(s, String(digit));
    return typeMinute({ ...s, hour: "1", field: "minute", fresh: s.minute.length === 2 }, digit);
  }
  if (h === "" || h.length === 2 || s.fresh) {
    if (digit === 0) return refuse(s, "hour");
    if (digit === 1) return { ...s, hour: "1", field: "hour", fresh: false };
    return hourDone(s, String(digit));
  }
  // a single 2–9 still in the field (it was tapped and kept): start again with this digit
  return typeHour({ ...s, hour: "", fresh: false }, digit);
}

export function padReducer(s: PadState, action: PadAction): PadState {
  switch (action.type) {
    case "digit":
      return s.field === "hour" ? typeHour(s, action.digit) : typeMinute(s, action.digit);
    case "focus":
      if (action.field === "minute" && s.lockMinutes) return s;
      return { ...s, field: action.field, fresh: (action.field === "hour" ? s.hour : s.minute) !== "" };
    case "back":
      if (s.field === "minute" && s.minute !== "") return { ...s, minute: s.minute.slice(0, -1), fresh: false };
      return { ...s, field: "hour", hour: s.hour.slice(0, -1), fresh: false };
    default:
      return s;
  }
}

/** The typed time as an answer ("3:05"), or null while a part is missing. */
export function padValue(s: PadState): string | null {
  const hour = Number(s.hour);
  if (s.hour === "" || hour < 1 || hour > 12 || s.minute.length !== 2) return null;
  const minute = Number(s.minute);
  return minute <= 59 ? timeKey({ hour, minute }) : null;
}
