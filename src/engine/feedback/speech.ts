// Read-aloud via the Web Speech API (on-device, no network). Best-effort: it
// silently does nothing where speech synthesis isn't available.
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
// (on-device, no network). A device without a voice for the language simply
// has none: the lesson then shows the words to read out loud instead.

export type SpokenLang = "ar" | "fr";

/** Locales tried in order; the first voice that matches wins. */
const LOCALES: Record<SpokenLang, string[]> = {
  ar: ["ar-SA", "ar-AE", "ar-EG", "ar"],
  fr: ["fr-FR", "fr-CA", "fr-BE", "fr"],
};

/** The best installed voice for the language, or null. Voices load late on some devices. */
export function voiceFor(lang: SpokenLang): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const norm = (code: string) => code.replace("_", "-").toLowerCase();
  for (const locale of LOCALES[lang]) {
    const wanted = locale.toLowerCase();
    const match = voices.filter((voice) => (wanted.includes("-") ? norm(voice.lang) === wanted : norm(voice.lang).startsWith(wanted)));
    // An on-device voice keeps the "no network" promise; a network voice is the last resort.
    const best = match.find((voice) => voice.localService) ?? match[0];
    if (best) return best;
  }
  return null;
}

/** Calls `onChange` when the device's voice list (re)loads. Returns the unsubscribe. */
export function onVoicesChanged(onChange: () => void): () => void {
  if (!speechSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  synth.addEventListener?.("voiceschanged", onChange);
  return () => synth.removeEventListener?.("voiceschanged", onChange);
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

/** Say `text` in the language. Returns false when the device has no voice for it. */
export function speakIn(lang: SpokenLang, text: string, slow = false): boolean {
  const voice = voiceFor(lang);
  if (!voice || !text.trim()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = slow ? 0.55 : 0.85;
    u.pitch = 1;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}
