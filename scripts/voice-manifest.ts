// Lists everything the language courses can SAY, for scripts/build-voice-files.py:
// every phrase, every letter name and every word tile, with the texts a voice
// could read (the phonetic `say` first, then the plain writing). Printed as
// JSON on stdout: `bun scripts/voice-manifest.ts > manifest.json`.
// The same list drives the audit (audit-voice-files.ts): a sayable thing
// without a file fails `bun run check`.
import { LANG_SEEDS } from "../src/content/langCourses";
import { cardClipKey, wordClipKey } from "../src/engine/feedback/clipKeys";
import { tileWords } from "../src/engine/lang/tasks";
import type { LangCode } from "../src/engine/lang/types";
import { persona } from "../src/persona.config";

export interface VoiceItem {
  /** Clip key: "ar:marhaba", "ar:letter:baa", "ar:word:بدّي". */
  key: string;
  lang: LangCode;
  kind: "phrase" | "letter" | "word";
  /** Texts a voice may read, best guess first. */
  texts: string[];
  /** Contains the child's name: never sent to an online voice. */
  local: boolean;
}

/** The child's name as it is written in each course. */
const NAMES = [persona.name.toLowerCase(), "سام", "saam"];
const strip = (text: string) => text.replace(/\p{M}/gu, "").replace(/[.!?؟,،;:"«»]/g, " ").toLowerCase();
const named = (text: string) => strip(text).split(/\s+/).some((token) => NAMES.includes(token));
const unique = (texts: Array<string | undefined>) => [...new Set(texts.map((text) => text?.trim()).filter((text): text is string => Boolean(text)))];

export function voiceManifest(): VoiceItem[] {
  const items = new Map<string, VoiceItem>();
  const add = (key: string, lang: LangCode, kind: VoiceItem["kind"], texts: string[]) => {
    const known = items.get(key);
    const all = unique([...(known?.texts ?? []), ...texts]);
    if (all.length) items.set(key, { key, lang, kind, texts: all, local: all.some(named) });
  };
  for (const seed of LANG_SEEDS) {
    const { lang } = seed;
    for (const letter of seed.letters ?? []) add(cardClipKey(lang, { id: letter.id, letter: true }), lang, "letter", [letter.say ?? letter.char]);
    for (const phrase of seed.packs.flatMap((pack) => pack.phrases)) {
      add(cardClipKey(lang, phrase), lang, "phrase", [phrase.say ?? phrase.text, phrase.text]);
      const words = tileWords(phrase, lang);
      // The phonetic spelling word by word, when it lines up with the words.
      const spoken = (phrase.say ?? "").trim().split(/\s+/);
      const aligned = Boolean(phrase.words) && spoken.length === words.length;
      words.forEach((word, i) => {
        const clean = word.text.replace(/[.!?؟,،]/g, "").trim();
        // A single-word phrase is its own tile: the whole phonetic spelling steers it.
        let steer = phrase.words ? undefined : phrase.say;
        if (aligned) steer = spoken[i];
        add(wordClipKey(lang, word.text), lang, "word", [steer?.replace(/[.!?؟,،]/g, ""), clean]);
      });
    }
  }
  return [...items.values()].sort((a, b) => a.key.localeCompare(b.key));
}

if (import.meta.main) console.log(JSON.stringify(voiceManifest(), null, 1));
