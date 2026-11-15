// The teaching overlays of an opening demo, for whatever the clock shows now
// (they follow the hands while the demo plays AND while the child plays).
import type { TickIntro } from "../../../content/tick/intros";
import type { ClockOverlay } from "../../../ui/clock/ClockArt";
import { mod } from "../../../ui/clock/clockGeo";
import { timeOf } from "./tickClock";

export function overlayFor(show: TickIntro["show"], total: number): ClockOverlay {
  const { hour, minute } = timeOf(total);
  let wedge: ClockOverlay["wedge"] = null;
  if (show.wedge && minute > 0) wedge = minute <= 30 ? { from: 0, to: minute } : { from: minute, to: 60 };
  return {
    wedge,
    ring: show.ring,
    ringLit: show.ringLit ? minute : null,
    hourMark: show.hourMark ? hour : null,
    // the single-minute marks since the last number: 9:13 lights 11, 12, 13
    ticks: show.ticks && minute > 0 ? { from: minute - mod(minute - 1, 5), to: minute } : null,
  };
}
