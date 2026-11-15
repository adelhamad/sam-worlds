// Speaking practice in the language lessons ("Your turn — say it!"): the child
// records himself, then hears the MODEL (the parent's recording, else the
// device voice) and then HIS take, back to back. No React, no judging, no score.
// His takes are never stored: they live in memory for the playback only and
// are dropped (object URL revoked) when the slide or the lesson ends.
// When the microphone cannot be used, the lesson quietly hides the mic for the
// rest of this visit; the reason is kept here (memory only) for the Voices page.
import type { LangCode } from "../lang/types";
import { cardClipKey } from "./clipKeys";
import { hasClip, playBlob, playClip, playVoiceFile, whenPlaybackEnds } from "./clips";
import { voiceFileUrl } from "./voiceFiles";
import type { MicProblem } from "./recorder";
import { speakInUntilDone } from "./speech";

/** One take stops by itself after this long. */
export const SPEAK_MAX_MS = 4000;
/** The breath between the model and the take. */
export const SPEAK_GAP_MS = 350;

export interface MicTrouble {
  problem: MicProblem;
  /** Met in a lesson (the child's tap) or by the parent's "Try the microphone". */
  where: "lesson" | "parent";
  at: number;
}

let trouble: MicTrouble | null = null;
const listeners = new Set<() => void>();

/** The microphone failed (memory only; shown on the Voices page): lessons hide the mic. */
export function noteMicTrouble(problem: MicProblem, where: MicTrouble["where"] = "lesson"): void {
  trouble = { problem, where, at: Date.now() };
  for (const listener of listeners) listener();
}

/** The parent fixed it (or switched the practice off and on): show the mic again. */
export function clearMicTrouble(): void {
  if (!trouble) return;
  trouble = null;
  for (const listener of listeners) listener();
}

export function micTrouble(): MicTrouble | null {
  return trouble;
}

/** Re-render hook for React (useSyncExternalStore). */
export function onMicTrouble(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Play the model of a card and resolve when it is over: the parent's clip, else the shipped voice file, else the device voice. */
export async function playModel(lang: LangCode, card: { id: string; say: string; letter?: boolean }): Promise<boolean> {
  if (!card.say) return false;
  if (hasClip(cardClipKey(lang, card)) && (await playClip(cardClipKey(lang, card)))) {
    await whenPlaybackEnds();
    return true;
  }
  const url = voiceFileUrl(cardClipKey(lang, card));
  if (url && (await playVoiceFile(url))) {
    await whenPlaybackEnds();
    return true;
  }
  return speakInUntilDone(lang, card.say);
}

/** Play the child's take (unsaved) and resolve when it is over. */
export async function playTake(blob: Blob): Promise<boolean> {
  if (!(await playBlob(blob))) return false;
  await whenPlaybackEnds(SPEAK_MAX_MS + 3000);
  return true;
}
