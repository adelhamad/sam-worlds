// Tapping Pogo: he giggles, hops, turns round or squishes — a different
// reaction each tap so repeated taps stay fun — and the voice is rate-limited
// so a drum roll of taps never becomes a wall of noise.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PogoMood } from "./pogoPoses";

/** The mood each tap reaction holds, in turn (the wrapper motion is pogo-poke-N). */
const POKE_MOODS: PogoMood[] = ["giggle", "happy", "giggle", "wow"];
/** How long one reaction holds before Pogo goes back to what he was doing. */
const POKE_MS = 1000;
/** At most one giggle per this many ms. */
const VOICE_GAP_MS = 700;

export interface PogoPoke {
  /** The reaction's mood while it plays (null: not reacting). */
  mood: PogoMood | null;
  /** Taps so far — restarts the wrapper motion. */
  count: number;
  poke: () => void;
}

/** `voice` plays the giggle; `enabled` false ignores taps (e.g. while a sheet shows). */
export function usePogoPoke(voice: () => void, enabled = true): PogoPoke {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVoice = useRef(0);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const poke = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastVoice.current >= VOICE_GAP_MS) {
      lastVoice.current = now;
      voice();
    }
    setCount((n) => n + 1);
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), POKE_MS);
  }, [enabled, voice]);

  const mood = active && enabled && count > 0 ? POKE_MOODS[(count - 1) % POKE_MOODS.length] : null;
  return { mood, count, poke };
}
