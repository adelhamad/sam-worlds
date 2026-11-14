// The live Star Dust meter. What a lesson has banked is DERIVED from the
// session (so it survives a reload); this hook only turns each increase into
// a "+N ✨" token that flies to the chip, and lets the chip tick up when the
// token lands. The number it shows never goes down.
import { useCallback, useState } from "react";
import { lessonSound } from "./lessonSound";

export interface DustTokenSpec {
  /** Unique per token: the meter total it brings the chip to. */
  id: number;
  amount: number;
  /** A slot solved after a hint banks less: a smaller, quieter token. */
  small: boolean;
  /** Where it takes off: the feedback sheet (or the board) / the gift box. */
  origin: "slot" | "gift";
}

export interface DustMeterState {
  /** The number on the chip (it lags the bank until the token lands). */
  shown: number;
  /** Grows with every landing — replays the chip's bump. */
  bumps: number;
  tokens: DustTokenSpec[];
  land: (token: DustTokenSpec) => void;
}

interface Seen {
  banked: number;
  missed: number;
  gift: number;
}

/**
 * @param banked  Star Dust the finished slots have earned (runningPayout).
 * @param missed  Finished slots that were not first-try.
 * @param gift    Gift Star Dust collected in this sitting.
 */
export function useDustMeter(banked: number, missed: number, gift: number): DustMeterState {
  // A restored session starts with its bank already on the chip: no token.
  const [seen, setSeen] = useState<Seen>({ banked, missed, gift });
  const [shown, setShown] = useState(banked + gift);
  const [bumps, setBumps] = useState(0);
  const [tokens, setTokens] = useState<DustTokenSpec[]>([]);

  // Derived-state step (during render, as React recommends): compare with the
  // high-water marks and launch a token for whatever was added.
  if (banked > seen.banked || gift > seen.gift || missed !== seen.missed) {
    const launched: DustTokenSpec[] = [];
    if (gift > seen.gift) {
      launched.push({ id: seen.banked + gift, amount: gift - seen.gift, small: false, origin: "gift" });
    }
    if (banked > seen.banked) {
      launched.push({ id: banked + Math.max(gift, seen.gift), amount: banked - seen.banked, small: missed > seen.missed, origin: "slot" });
    }
    setSeen({ banked: Math.max(banked, seen.banked), missed, gift: Math.max(gift, seen.gift) });
    if (launched.length > 0) setTokens([...tokens, ...launched]);
  }

  const land = useCallback((token: DustTokenSpec) => {
    setTokens((list) => list.filter((item) => item.id !== token.id));
    setShown((value) => Math.max(value, token.id));
    setBumps((count) => count + 1);
    lessonSound.bank(token.small);
  }, []);

  return { shown, bumps, tokens, land };
}
