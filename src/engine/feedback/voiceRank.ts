// Which installed voice should speak a language course — PURE (no browser), so
// scripts/audit-voices.ts can check it against fixture voice lists. Apple
// devices list "novelty" voices (Eddy, Grandma, Zarvox…) next to the natural
// ones; picking the first voice for the locale can pick a robot. Ranking, best
// first: natural before novelty → premium → enhanced → default quality →
// on-device before network → locale preference → name (stable tiebreak).
import type { LangCode } from "../lang/types";

/** What the ranking needs from a SpeechSynthesisVoice. */
export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

/** Novelty / character voices, matched on the name before any " (" suffix. */
export const NOVELTY_VOICES: readonly string[] = [
  // Apple's "Eloquence" set (listed for many languages)
  "Eddy", "Flo", "Grandma", "Grandpa", "Reed", "Rocko", "Sandy", "Shelley",
  // the classic macOS novelty set
  "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Good News", "Jester", "Organ",
  "Superstar", "Trinoids", "Whisper", "Wobble", "Zarvox", "Fred", "Junior", "Kathy", "Ralph",
];

/** Locales tried in order of preference; any other locale of the language comes after them. */
export const VOICE_LOCALES: Record<LangCode, string[]> = {
  ar: ["ar-SA", "ar-001", "ar-AE", "ar-EG"],
  fr: ["fr-FR", "fr-CA", "fr-BE", "fr-CH"],
};

const NOVELTY = new Set(NOVELTY_VOICES.map((name) => name.toLowerCase()));

/** "en_US" / "fr-fr" → "fr-fr". */
export const normLocale = (code: string): string => code.replace(/_/g, "-").toLowerCase();

/** The voice's own name, without " (Enhanced)" / " (French (France))". */
export function baseName(name: string): string {
  const cut = name.indexOf(" (");
  return (cut < 0 ? name : name.slice(0, cut)).trim();
}

export function isNovelty(voice: Pick<VoiceInfo, "name" | "voiceURI">): boolean {
  return NOVELTY.has(baseName(voice.name).toLowerCase()) || /eloquence/i.test(voice.voiceURI);
}

export type VoiceQuality = "premium" | "enhanced" | "default";

export function voiceQuality(voice: Pick<VoiceInfo, "name" | "voiceURI">): VoiceQuality {
  const text = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (text.includes("premium")) return "premium";
  return text.includes("enhanced") ? "enhanced" : "default";
}

export function speaksLang(voice: Pick<VoiceInfo, "lang">, lang: LangCode): boolean {
  const code = normLocale(voice.lang);
  return code === lang || code.startsWith(`${lang}-`);
}

const QUALITY_RANK: Record<VoiceQuality, number> = { premium: 0, enhanced: 1, default: 2 };

function localeRank(voice: VoiceInfo, lang: LangCode): number {
  const at = VOICE_LOCALES[lang].findIndex((locale) => locale.toLowerCase() === normLocale(voice.lang));
  return at < 0 ? VOICE_LOCALES[lang].length : at;
}

/** Sort keys, compared in order (lower is better). */
function keys(voice: VoiceInfo, lang: LangCode): number[] {
  return [
    isNovelty(voice) ? 1 : 0,
    QUALITY_RANK[voiceQuality(voice)],
    voice.localService ? 0 : 1,
    localeRank(voice, lang),
  ];
}

/** Every voice for the language, best first. A device with only novelty voices still gets them (last). */
export function rankVoices<V extends VoiceInfo>(voices: readonly V[], lang: LangCode): V[] {
  const scored = voices.filter((voice) => speaksLang(voice, lang)).map((voice) => ({ voice, keys: keys(voice, lang) }));
  scored.sort((a, b) => {
    for (let i = 0; i < a.keys.length; i++) if (a.keys[i] !== b.keys[i]) return a.keys[i] - b.keys[i];
    return a.voice.name.localeCompare(b.voice.name, "en") || a.voice.voiceURI.localeCompare(b.voice.voiceURI, "en");
  });
  return scored.map((item) => item.voice);
}

/** The parent's chosen voice when it is still installed, else the best ranked one, else null. */
export function pickVoice<V extends VoiceInfo>(voices: readonly V[], lang: LangCode, chosenURI?: string | null): V | null {
  const ranked = rankVoices(voices, lang);
  return (chosenURI ? ranked.find((voice) => voice.voiceURI === chosenURI) : undefined) ?? ranked[0] ?? null;
}
