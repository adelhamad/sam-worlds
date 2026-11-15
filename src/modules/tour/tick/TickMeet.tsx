// The opening demo of a Tick Tock lesson, shown before the first question:
// teach by showing. Pogo says the idea, a big clock plays a short loop that
// demonstrates it (content/tick/intros.ts), two lines explain, and the child
// can grab the hands at any moment and play — the toy is the "aha". A big
// button skips ahead at once.
import type { CSSProperties } from "react";
import { TICK_INTROS } from "../../../content/tick/intros";
import { hasWords, timeKey, timeWords } from "../../../engine/tick/clock";
import type { TickIntroKey } from "../../../engine/tick/types";
import { TICK } from "../../../strings/tick";
import { PogoSay } from "../../../ui/tour/Pogo";
import "../../../ui/tour/tour-base.css";
import { useCompact } from "../lesson/useCompact";
import { HandClock } from "./HandClock";
import { HandLegend } from "./HandLegend";
import { timeOf } from "./tickClock";
import { overlayFor } from "./tickOverlay";
import { useTickDemo } from "./useTickDemo";
import "./tick.css";

const M = TICK.meet;

export interface TickMeetProps {
  /** What to demonstrate (TickParams.intro). */
  intro: TickIntroKey;
  /** Called when the child taps the start button. */
  onStart: () => void;
}

export function TickMeet({ intro, onStart }: TickMeetProps) {
  const data = TICK_INTROS[intro] ?? TICK_INTROS.hands;
  const compact = useCompact();
  const demo = useTickDemo(data);
  const time = timeOf(demo.total);
  return (
    <div className={`tl-meet tk-meet is-${intro}`} data-testid="tick-meet" data-intro={intro}>
      <PogoSay mood="wave" size={compact ? 80 : 112} text={data.title} />
      <div className="tk-meet-stage">
        <HandClock
          total={demo.total} onTotal={demo.set} onGrab={demo.grab} step={data.step} buttons={false}
          overlay={overlayFor(data.show, demo.total)} pulse={demo.pulse} spin={data.show.spin}
          glide={demo.glide} testId="tick-meet-clock" className="tk-meet-clock"
        />
        {data.caption === "legend" ? (
          <HandLegend active={demo.pulse} className="is-meet" />
        ) : (
          <output className={`tk-meet-caption ${data.caption === "words" && hasWords(time) ? "is-named" : ""}`} data-testid="tick-meet-caption">
            {data.caption === "words" ? timeWords(time) : timeKey(time)}
          </output>
        )}
        <p className={`tk-try ${demo.toying ? "is-done" : ""}`}>
          <span className="tk-try-dot" aria-hidden="true" />
          {data.step === 60 ? M.tryHour : M.tryIt}
        </p>
      </div>
      <ul className="tk-meet-lines">
        {data.lines.map((line, i) => (
          <li key={line} style={{ "--i": i } as CSSProperties}>{line}</li>
        ))}
      </ul>
      <button type="button" className="tbtn tbtn-go tbtn-wide tk-meet-start" onClick={onStart} data-testid="tick-meet-start">
        {M.letsGo}
      </button>
    </div>
  );
}
