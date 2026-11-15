// Read-aloud via the Web Speech API (on-device, no network). Best-effort: it
// silently does nothing where speech synthesis isn't available.
import { pickVoice, rankVoices } from "./voiceRank";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Strip emoji and arrows so the voice reads the words, not the symbols. */
function clean(text: string): string {
  return text
    .replace(/️/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(text: string): void {
  if (!speechSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean(text));
    u.rate = 0.95;
    u.pitch = 1.1;
    u.lang = "en-US";
    synth.speak(u);
  } catch {
    // ignore — read-aloud is a nice-to-have
  }
}

// ---------------------------------------------------------------- languages
// The language courses speak Arabic and French with the device's own voices
// (on-device, no network). The best installed voice is chosen by voiceRank.ts
// (never a novelty voice when a natural one exists); the parent can choose
// another and a speed in Parent Section → Voices. A device without a voice for
// the language simply has none: the lesson then shows the words instead (unless
// the parent recorded them — see clips.ts and useVoice).
export type SpokenLang = "ar" | "fr";

/** Speech rates: normal and "slowly", before the parent's speed scales them. */
export const SPEECH_RATES = { normal: 0.85, slow: 0.55 } as const;

/** The parent's choices (pushed in by the store; the engine never reads the store). */
let prefs: { pick: Record<string, string>; speed: number } = { pick: {}, speed: 1 };

export function setVoicePrefs(pick: Record<string, string> | undefined, speed: number | undefined): void {
  prefs = { pick: pick ?? {}, speed: speed && speed > 0 ? speed : 1 };
}

/** The rate an utterance is spoken at. */
export function speechRate(slow: boolean): number {
  return (slow ? SPEECH_RATES.slow : SPEECH_RATES.normal) * prefs.speed;
}

function installedVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

/** Every installed voice for the language, best first (novelty voices last). Read fresh each time. */
export function rankedVoices(lang: SpokenLang): SpeechSynthesisVoice[] {
  return rankVoices(installedVoices(), lang);
}

/** The parent's chosen voice if still installed, else the best ranked one, else null. Never cached. */
export function voiceFor(lang: SpokenLang): SpeechSynthesisVoice | null {
  return pickVoice(installedVoices(), lang, prefs.pick[lang]);
}

/** Calls `onChange` when the device's voice list (re)loads. Returns the unsubscribe. */
export function onVoicesChanged(onChange: () => void): () => void {
  if (!speechSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  synth.addEventListener?.("voiceschanged", onChange);
  // Safari does not always fire "voiceschanged": look again a few times.
  const timers = [300, 1000, 3000].map((ms) => window.setTimeout(onChange, ms));
  return () => {
    synth.removeEventListener?.("voiceschanged", onChange);
    for (const timer of timers) window.clearTimeout(timer);
  };
}

let primed = false;

/**
 * iOS only lets a page speak after it has spoken once inside a tap. Call this
 * from a tap handler (it says nothing) so later lines can speak on their own.
 */
export function primeSpeech(): void {
  if (primed || !speechSupported()) return;
  primed = true;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore — speech stays a nice-to-have
  }
}

/** Say `text` in the language (with `voice`, or the one voiceFor picks). False when there is no voice. */
export function speakIn(lang: SpokenLang, text: string, slow = false, voice = voiceFor(lang)): boolean {
  if (!voice || !text.trim()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = speechRate(slow);
    u.pitch = 1;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}
