// Pogo during a "Your turn — say it!": listening (head tilt) while the child
// records and while both takes play, then glad — a different cheer each take.
// Always warm: practice is never judged.
import type { PogoMood } from "../../../ui/tour/Pogo";
import { LANG } from "../../../strings/lang";

const S = LANG.meet.speak;
const DONE_MOODS: PogoMood[] = ["proud", "cheer", "happy", "wow"];

export type SpeakPhase = "idle" | "starting" | "recording" | "model" | "take" | "done";

/** Recording or playing: nothing else may talk now. */
export function speakBusy(phase: SpeakPhase): boolean {
  return phase !== "idle" && phase !== "done";
}

/** What Pogo does and says during a turn (null = the screen's own line). */
export function speakPogo(phase: SpeakPhase, takes: number): { mood: PogoMood; text: string } | null {
  if (phase === "starting" || phase === "recording") return { mood: "think", text: S.listening };
  if (phase === "model") return { mood: "think", text: S.model };
  if (phase === "take") return { mood: "think", text: S.you };
  if (phase === "done") {
    const n = Math.max(0, takes - 1);
    return { mood: DONE_MOODS[n % DONE_MOODS.length], text: S.cheers[n % S.cheers.length] };
  }
  return null;
}
