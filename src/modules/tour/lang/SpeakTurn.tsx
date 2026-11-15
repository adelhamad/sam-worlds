// The "Your turn — say it!" controls: two little ears (the model, then you)
// that light up as each one plays, and a big round microphone — cyan, it is
// the interactive thing — that becomes a ring pulsing with his voice while it
// records. After the playback: Again (a new take) and Hear both. Never a score.
import type { RefObject } from "react";
import { LANG } from "../../../strings/lang";
import { speakPogo, type SpeakPhase } from "./speakPogo";
import "./speak.css";

const S = LANG.meet.speak;

/** A microphone, drawn (no icon name exists for it). */
export function MicGlyph({ size = 40 }: { size?: number }) {
  return (
    <svg className="sp-glyph" width={size} height={size} viewBox="0 0 48 48" focusable="false" aria-hidden="true">
      <rect x="16" y="5" width="16" height="26" rx="8" fill="currentColor" />
      <path d="M10 23a14 14 0 0 0 28 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 37v6M17 43h14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function EarGlyph() {
  return (
    <svg className="sp-ear-glyph" width="22" height="22" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        d="M5.5 9a6.5 6.5 0 0 1 13 0c0 5.5-5.5 6-5.5 9.5a3.5 3.5 0 0 1-7 0" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M14.5 9a2.5 2.5 0 0 0-5 0v1a2 2 0 0 1 0 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Always laid out (hidden until the first take) so nothing jumps when they appear. */
function Ears({ phase }: { phase: SpeakPhase }) {
  const lit = (which: "model" | "take") => {
    if (phase === which) return "is-on";
    return phase === "done" ? "is-heard" : "";
  };
  return (
    <div className={`sp-ears ${phase === "idle" ? "is-hidden" : ""}`} aria-hidden="true">
      <span className={`sp-ear ${lit("model")}`} data-testid="speak-ear-model"><EarGlyph />{S.earModel}</span>
      <span className="sp-ear-dot" />
      <span className={`sp-ear is-you ${lit("take")}`} data-testid="speak-ear-you"><EarGlyph />{S.earYou}</span>
    </div>
  );
}

function labelOf(phase: SpeakPhase): string {
  if (phase === "recording" || phase === "starting") return S.stop;
  if (phase === "done") return S.again;
  return phase === "idle" ? S.mic : "";
}

interface SpeakPanelProps {
  phase: SpeakPhase;
  takes: number;
  tapMic: () => void;
  replay: () => void;
  levelRef: RefObject<HTMLButtonElement>;
  /** Not yet heard the model: keep the room, show it a moment later. */
  waiting?: boolean;
  compact?: boolean;
}

export function SpeakPanel({ phase, takes, tapMic, replay, levelRef, waiting = false, compact = false }: SpeakPanelProps) {
  const recording = phase === "recording" || phase === "starting";
  const playing = phase === "model" || phase === "take";
  const status = speakPogo(phase, takes)?.text ?? "";
  return (
    <div
      className={`sp ${waiting ? "is-waiting" : ""} ${compact ? "is-compact" : ""} is-${phase}`}
      data-testid="speak-panel" data-phase={phase} aria-hidden={waiting || undefined}
    >
      <span className="sp-sr" role="status">{status}</span>
      <Ears phase={phase} />
      <div className="sp-row">
        <div className="sp-mic-col">
          <button
            type="button" ref={levelRef}
            className={`sp-mic ${recording ? "is-live" : ""}`} disabled={waiting || playing} tabIndex={waiting ? -1 : undefined}
            aria-label={recording ? S.stopLabel : S.micLabel} onClick={tapMic} data-testid="speak-mic"
          >
            <span className="sp-ring" aria-hidden="true" />
            <span className="sp-mic-face">
              {recording ? <span className="sp-stop" aria-hidden="true" /> : <MicGlyph size={compact ? 34 : 40} />}
            </span>
          </button>
          <span className="sp-label" aria-hidden="true">{labelOf(phase)}</span>
        </div>
        {phase === "done" && (
          <button type="button" className="sp-both" onClick={replay} data-testid="speak-both">
            <EarGlyph />{S.both}
          </button>
        )}
      </div>
    </div>
  );
}
