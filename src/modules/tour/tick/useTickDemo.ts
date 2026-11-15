// The opening demo's brain: plays the intro's frames on a loop until the
// child grabs the clock; from then on the child owns the hands (a toy) and the
// overlays keep following them.
import { useEffect, useState } from "react";
import type { TickFrame, TickIntro } from "../../../content/tick/intros";

export interface TickDemo {
  total: number;
  /** Glide time of the hands into this frame (ms). */
  glide: number;
  pulse: TickFrame["pulse"] | null;
  /** The child has taken over. */
  toying: boolean;
  grab: () => void;
  set: (total: number) => void;
}

export function useTickDemo(intro: TickIntro): TickDemo {
  const [i, setI] = useState(0);
  const [toy, setToy] = useState<number | null>(null);
  const { frames } = intro;
  const frame = frames[i] ?? frames[0];

  useEffect(() => {
    if (toy !== null) return undefined;
    const id = window.setTimeout(() => setI((n) => (n + 1) % frames.length), frame.ms);
    return () => window.clearTimeout(id);
  }, [frame, frames.length, toy]);

  if (toy !== null) {
    return { total: toy, glide: 260, pulse: null, toying: true, grab: () => undefined, set: setToy };
  }
  const glide = i === 0 ? 0 : Math.min(frames[i - 1].ms, 420);
  return { total: frame.at, glide, pulse: frame.pulse ?? null, toying: false, grab: () => setToy(frame.at), set: setToy };
}
