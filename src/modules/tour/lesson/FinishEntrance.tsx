// Pogo's entrance on the lesson-complete screen — a few seconds of slapstick
// before the results show. Three acts, picked from the lesson's seed so the
// same joke does not play every time:
//   splat — flies at the screen on the jet boots, hits the glass, slides down
//   drop  — falls in from the top, bounces to a stop, shakes it off, leaps out
//   peek  — rises from the bottom edge, pops up to say hello, ducks away
// A tap anywhere skips it. The script (what happens when) is data; the motion
// is in finish.css, keyed by `tl-enter-<act>` and `is-<phase>`.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pogo, type PogoMood } from "../../../ui/tour/Pogo";
import { SCRIPTS, type EntranceAct } from "./finishActs";
import "./finish.css";

/** Pogo's drawn size before the act scales it up. */
function baseSize(): number {
  return Math.round(Math.min(window.innerWidth * 0.42, window.innerHeight * 0.3, 260));
}

const CRACKS = [
  "M0 0 L-64 -92 L-58 -150", "M0 0 L52 -78 L96 -96", "M0 0 L104 -8 L150 30", "M0 0 L60 74 L52 132",
  "M0 0 L-30 98 L-70 124", "M0 0 L-108 22 L-152 -6", "M-64 -92 L-110 -100", "M60 74 L104 96",
];

/** The star-shaped crack the bump leaves on the glass. */
function Cracks() {
  return (
    <svg className="tl-enter-cracks" viewBox="-170 -170 340 340" aria-hidden="true">
      <circle className="tl-enter-flash" r={120} />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {CRACKS.map((d, i) => <path key={d} d={d} pathLength={1} style={{ animationDelay: `${i * 18}ms` }} />)}
      </g>
    </svg>
  );
}

interface FinishEntranceProps {
  act: EntranceAct;
  /** The act is over (or was tapped away): show the results. */
  onDone: () => void;
}

export function FinishEntrance({ act, onDone }: FinishEntranceProps) {
  const script = SCRIPTS[act];
  const [step, setStep] = useState<{ phase: string; mood: PogoMood }>(() => ({
    phase: script.beats[0].phase ?? "start", mood: script.beats[0].mood ?? "idle",
  }));
  const [size] = useState(baseSize);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const timers = script.beats.map((beat) => setTimeout(() => {
      beat.sound?.();
      if (beat.phase || beat.mood) setStep((now) => ({ phase: beat.phase ?? now.phase, mood: beat.mood ?? now.mood }));
    }, beat.at));
    timers.push(setTimeout(() => done.current(), script.end));
    return () => timers.forEach(clearTimeout);
  }, [script]);

  return (
    <div
      className={`tl-enter tl-enter-${act} is-${step.phase}`} data-testid="finish-entrance"
      style={{ "--enter-size": `${size}px` } as CSSProperties} onPointerDown={() => done.current()}
    >
      <div className="tl-enter-stage">
        {act === "splat" && step.phase !== "fly" && <Cracks />}
        <div className="tl-enter-pogo">
          <div className="tl-enter-squash">
            <Pogo mood={step.mood} size={size} />
          </div>
        </div>
      </div>
    </div>
  );
}
