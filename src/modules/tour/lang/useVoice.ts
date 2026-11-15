// How a language course speaks: the parent's own recording when there is one
// (Parent Section → Voices), else the voice file the app ships with, else — a
// last resort, for something sayable that has no file — the device's voice. Voices can
// arrive late (iOS), so this re-checks; the recordings index can load or change
// while a lesson is open, so it re-renders then too.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { cardClipKey, wordClipKey } from "../../../engine/feedback/clipKeys";
import { clipsVersion, hasClip, onClipsChanged, playClip, playVoiceFile, stopClip } from "../../../engine/feedback/clips";
import { hasVoiceFile, voiceFileUrl } from "../../../engine/feedback/voiceFiles";
import { onVoicesChanged, speakIn, voiceFor } from "../../../engine/feedback/speech";
import type { LangCode } from "../../../engine/lang/types";

/** Something to say: a lesson card (id + what the voice reads; `letter` for a letter card). */
export interface SayCard {
  id: string;
  say: string;
  letter?: boolean;
}

export interface Voice {
  /** The device has a voice for this language. */
  ready: boolean;
  /** This card can be heard: it has a recording, a voice file, or the device has a voice (and it is not a silent card). */
  canSay: (card: SayCard | null | undefined) => boolean;
  /** This word (a tile) can be heard. */
  canSayText: (text: string) => boolean;
  /** Say a card (recording first, then the device voice), or plain text (word tiles: device voice). */
  say: (what: SayCard | string, slow?: boolean) => void;
}

function sayWithDevice(lang: LangCode, text: string, slow: boolean): void {
  stopClip();
  speakIn(lang, text, slow);
}

/** The best voice there is for `key`: the parent's recording, the shipped file, the device. */
async function sayBest(lang: LangCode, key: string, text: string, slow: boolean): Promise<void> {
  if (hasClip(key) && (await playClip(key, slow))) return;
  const url = voiceFileUrl(key);
  if (url && (await playVoiceFile(url, slow))) return;
  sayWithDevice(lang, text, slow);
}

export function useVoice(lang: LangCode): Voice {
  const [ready, setReady] = useState(() => voiceFor(lang) !== null);
  useEffect(() => {
    const check = () => setReady(voiceFor(lang) !== null);
    check();
    return onVoicesChanged(check);
  }, [lang]);
  // Re-render when the recordings index loads or changes.
  const clips = useSyncExternalStore(onClipsChanged, clipsVersion);

  const canSay = useCallback(
    (card: SayCard | null | undefined) => {
      if (!card?.say) return false;
      const key = cardClipKey(lang, card);
      return ready || hasClip(key) || hasVoiceFile(key);
    },
    // `clips` keeps the answer fresh when a recording is added or removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, ready, clips],
  );

  // Stable per language (autoplay effects depend on it); the index is read at call time.
  const say = useCallback((what: SayCard | string, slow = false) => {
    unlockAudio();
    if (typeof what === "string") {
      if (what.trim()) void sayBest(lang, wordClipKey(lang, what), what, slow);
      return;
    }
    if (!what.say) return; // a silent card stays silent
    void sayBest(lang, cardClipKey(lang, what), what.say, slow);
  }, [lang]);

  const canSayText = useCallback((text: string) => Boolean(text.trim()) && (ready || hasVoiceFile(wordClipKey(lang, text))), [lang, ready]);

  return { ready, canSay, canSayText, say };
}
