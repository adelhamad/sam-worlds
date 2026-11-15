// The device's voice for a language course: whether there is one, and a
// `say` that speaks a card. Voices can arrive late (iOS), so this re-checks.
import { useCallback, useEffect, useState } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { onVoicesChanged, speakIn, voiceFor } from "../../../engine/feedback/speech";
import type { LangCode } from "../../../engine/lang/types";

export interface Voice {
  /** The device can speak this language. */
  ready: boolean;
  /** Speak `text` (no-op without a voice or with empty text). */
  say: (text: string, slow?: boolean) => void;
}

export function useVoice(lang: LangCode): Voice {
  const [ready, setReady] = useState(() => voiceFor(lang) !== null);
  useEffect(() => {
    const check = () => setReady(voiceFor(lang) !== null);
    check();
    return onVoicesChanged(check);
  }, [lang]);
  const say = useCallback((text: string, slow = false) => {
    unlockAudio();
    speakIn(lang, text, slow);
  }, [lang]);
  return { ready, say };
}
