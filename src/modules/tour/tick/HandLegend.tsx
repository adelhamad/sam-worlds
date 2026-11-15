// "short hand: hour" / "long hand: minutes" — the two hands named in their
// colours. Used by the teach card and the "hands" opening demo.
import { TICK } from "../../../strings/tick";
import { HandSwatch } from "./TickGlyphs";

const S = TICK.exercise;

export function HandLegend({ active = null, className = "" }: { active?: "hour" | "minute" | null; className?: string }) {
  return (
    <ul className={`tk-legend ${className}`}>
      {(["hour", "minute"] as const).map((hand) => (
        <li key={hand} className={`tk-legend-item is-${hand} ${active === hand ? "is-active" : ""} ${active && active !== hand ? "is-quiet" : ""}`}>
          <HandSwatch hand={hand} size={26} />
          <span>{hand === "hour" ? S.hourHand : S.minuteHand}</span>
        </li>
      ))}
    </ul>
  );
}
