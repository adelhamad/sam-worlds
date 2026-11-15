// Pogo — the World Tour mascot: a small violet visitor from Sam's space base
// with one glowing amber antenna. Sam is the guide; Pogo is the curious learner.
// The drawing lives in PogoArt.tsx, the moods in pogoPoses.ts, the motion in
// pogo.css and pogo-moods.css.
import { useEffect, useState, type ReactNode } from "react";
import "./tour-base.css";
import "./pogo.css";
import "./pogo-moods.css";
import { PogoArt } from "./PogoArt";
import type { PogoMood } from "./pogoPoses";

export { Confetti } from "./Confetti";

export type { PogoMood } from "./pogoPoses";

export interface PogoProps {
  mood?: PogoMood;
  /** Rendered height in px (the box is square). */
  size?: number;
  className?: string;
  /** Change this to replay a one-shot mood (`happy`, `wow`) without leaving it. */
  replayKey?: number | string;
  /** Hold the pose without motion (dense lists, thumbnails). */
  still?: boolean;
}

export function Pogo({ mood = "idle", size = 120, className = "", replayKey, still = false }: PogoProps) {
  const cls = ["pogo", `pogo-${mood}`, still ? "pogo-still" : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} style={{ width: size, height: size }} aria-hidden="true">
      <PogoArt key={replayKey} mood={mood} />
    </span>
  );
}

export interface PogoSayProps extends PogoProps {
  /** Speech bubble text (≤ 8 simple words per line). */
  text: string;
  /** Which side of Pogo the bubble sits on. */
  side?: "right" | "top";
  /** Optional content inside the bubble after the text (e.g. a 🔊 button). */
  children?: ReactNode;
}

/** True for a moment after `text` changes — long enough to "say" the line. */
function useSpeaking(text: string): boolean {
  const [spoken, setSpoken] = useState<string | null>(null);
  useEffect(() => {
    const ms = Math.min(2600, Math.max(1100, text.length * 60));
    const t = setTimeout(() => setSpoken(text), ms);
    return () => clearTimeout(t);
  }, [text]);
  return spoken !== text;
}

/** Pogo with a speech bubble. Without an explicit `mood`, Pogo talks while a
    new line pops in and then settles to idle. */
export function PogoSay({ text, side = "right", children, mood, ...pogo }: PogoSayProps) {
  const speaking = useSpeaking(text);
  return (
    <div className={`pogo-say pogo-say-${side}`}>
      <Pogo {...pogo} mood={mood ?? (speaking ? "talk" : "idle")} />
      <div key={text} className="pogo-bubble">
        <span className="pogo-bubble-text">{text}</span>
        {children}
      </div>
    </div>
  );
}
