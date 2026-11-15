// Voice choices made in Parent Section → Voices: the device voice per language
// (by voiceURI) and a speed. They ride the SettingsRow (no schema bump; the
// localStorage backup mirrors the settings row) and are pushed into the speech
// engine, which never reads the store. The recordings themselves are not here:
// they live in the voiceClips table (src/engine/feedback/clips.ts). Speaking
// practice (the child records himself next to the model) is one switch here,
// off by default; the child's takes are never stored anywhere.
import { logEvent } from "../engine/save/db";
import { setVoicePrefs } from "../engine/feedback/speech";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

/** Speeds the parent can choose (multiplies the speech rates). */
export const VOICE_SPEEDS = { slower: 0.8, normal: 1 } as const;

export interface VoiceSlice {
  /** voiceURI per language code; a missing language = the best installed voice. */
  voicePick: Record<string, string>;
  voiceSpeed: number;
  /** "Speaking practice": a microphone button on the lesson slides (and one speaking break). */
  speakPractice: boolean;
  /** null = back to the automatic choice. */
  setVoicePick: (lang: string, voiceURI: string | null) => void;
  setVoiceSpeed: (speed: number) => void;
  setSpeakPractice: (on: boolean) => void;
}

export const voiceInitial = {
  voicePick: {} as Record<string, string>,
  voiceSpeed: 1,
  speakPractice: false,
};

export function voiceActions(set: Set, get: Get) {
  return {
    setVoicePick: (lang: string, voiceURI: string | null) => {
      const voicePick = { ...get().voicePick };
      if (voiceURI) voicePick[lang] = voiceURI;
      else delete voicePick[lang];
      set({ voicePick });
      setVoicePrefs(voicePick, get().voiceSpeed);
      persistSettings(get);
      logEvent("parent.voicePick", { lang, voiceURI });
    },
    setVoiceSpeed: (speed: number) => {
      const voiceSpeed = speed > 0 ? speed : 1;
      set({ voiceSpeed });
      setVoicePrefs(get().voicePick, voiceSpeed);
      persistSettings(get);
      logEvent("parent.voiceSpeed", { speed: voiceSpeed });
    },
    setSpeakPractice: (on: boolean) => {
      set({ speakPractice: on });
      persistSettings(get);
      logEvent("parent.speakPractice", { on });
    },
  };
}
