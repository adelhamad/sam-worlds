// The scripts of Pogo's lesson-complete entrance (FinishEntrance.tsx): what
// happens when, as data. Timings match the keyframes in finish.css.
import { pogoVoice } from "../../../engine/feedback/pogoVoice";
import type { PogoMood } from "../../../ui/tour/Pogo";

export type EntranceAct = "splat" | "drop" | "peek";
const ACTS: EntranceAct[] = ["splat", "drop", "peek"];

/** The act for a lesson — cosmetic variety, fixed by the session seed. */
export function entranceAct(seed: number): EntranceAct {
  return ACTS[Math.abs(Math.trunc(seed)) % ACTS.length];
}

/** True when the device asks for less motion: the entrance is skipped. */
export function entranceOff(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface Beat {
  /** Milliseconds from the start. */
  at: number;
  phase?: string;
  mood?: PogoMood;
  sound?: () => void;
}

export interface Script {
  beats: Beat[];
  /** When the act is over and the results may show. */
  end: number;
}

export const SCRIPTS: Record<EntranceAct, Script> = {
  splat: {
    end: 2750,
    beats: [
      { at: 0, phase: "fly", mood: "zoom", sound: () => pogoVoice.zoom(0.6) },
      { at: 600, phase: "hit", mood: "splat", sound: () => pogoVoice.bonk() },
      { at: 1500, phase: "slide", mood: "dizzy", sound: () => pogoVoice.squeak(1) },
    ],
  },
  drop: {
    end: 2700,
    beats: [
      { at: 0, phase: "fall", mood: "wow", sound: () => pogoVoice.whistle(0.5) },
      { at: 520, sound: () => pogoVoice.boing(0) },
      { at: 1050, sound: () => pogoVoice.boing(1) },
      { at: 1450, sound: () => pogoVoice.boing(2) },
      { at: 1700, phase: "daze", mood: "dizzy", sound: () => pogoVoice.dizzy() },
      { at: 2300, phase: "leap", mood: "cheer", sound: () => pogoVoice.boing(0) },
    ],
  },
  peek: {
    end: 2600,
    beats: [
      { at: 0, phase: "rise", mood: "idle", sound: () => pogoVoice.wow() },
      { at: 1050, phase: "pop", mood: "wave", sound: () => pogoVoice.hey() },
      { at: 2000, phase: "duck", mood: "happy", sound: () => pogoVoice.giggle() },
    ],
  },
};
