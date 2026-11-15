// How a language course speaks a card: the parent's own recording when there
// is one (Parent Section → Voices), else the device's best voice. Voices can
// arrive late (iOS), so this re-checks; the recordings index can load or change
// while a lesson is open, so it re-renders then too.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { cardClipKey } from "../../../engine/feedback/clipKeys";
import { clipsVersion, hasClip, onClipsChanged, playClip, stopClip } from "../../../engine/feedback/clips";
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
  /** This card can be heard: it has a recording, or the device has a voice (and it is not a silent card). */
  canSay: (card: SayCard | null | undefined) => boolean;
  /** Say a card (recording first, then the device voice), or plain text (word tiles: device voice). */
  say: (what: SayCard | string, slow?: boolean) => void;
}

function sayWithDevice(lang: LangCode, text: string, slow: boolean): void {
  stopClip();
  speakIn(lang, text, slow);
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
    (card: SayCard | null | undefined) => Boolean(card?.say) && (ready || hasClip(cardClipKey(lang, card as SayCard))),
    // `clips` keeps the answer fresh when a recording is added or removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, ready, clips],
  );

  // Stable per language (autoplay effects depend on it); the index is read at call time.
  const say = useCallback((what: SayCard | string, slow = false) => {
    unlockAudio();
    if (typeof what === "string") {
      sayWithDevice(lang, what, slow);
      return;
    }
    if (!what.say) return; // a silent card stays silent
    const key = cardClipKey(lang, what);
    if (!hasClip(key)) {
      sayWithDevice(lang, what.say, slow);
      return;
    }
    void playClip(key, slow).then((played) => {
      if (!played) sayWithDevice(lang, what.say, slow);
    });
  }, [lang]);

  return { ready, canSay, say };
}
