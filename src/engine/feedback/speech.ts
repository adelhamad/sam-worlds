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
