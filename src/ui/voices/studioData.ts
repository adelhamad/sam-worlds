// What the recording studio lists for one language course: one group per unit
// (its phrases) and, for a course with an alphabet, one group of letter names.
// Read from the course seeds (LANG_SEEDS) — never a hard-coded list.
import { clipKey } from "../../engine/feedback/clipKeys";
import type { LangCourseSeed } from "../../content/langCourse";
import { VOICES } from "../../strings/voices";

export interface StudioItem {
  /** Clip key (src/engine/feedback/clipKeys.ts). */
  key: string;
  /** In the language's own writing (a letter: the letter). */
  text: string;
  /** Latin spelling (Arabic), or the letter's name. */
  roman?: string;
  /** The English meaning (a letter: its sound). */
  en: string;
  letter?: boolean;
}

export interface StudioGroup {
  id: string;
  name: string;
  /** The alphabet group (letter names), not a unit. */
  letters?: boolean;
  items: StudioItem[];
}

export function studioGroups(seed: LangCourseSeed): StudioGroup[] {
  const units = seed.packs.map((pack, i): StudioGroup => ({
    id: `${seed.id}-u${String(i + 1).padStart(2, "0")}`,
    name: `${i + 1}. ${pack.unit.name}`,
    items: pack.phrases.map((phrase) => ({
      key: clipKey(seed.lang, "phrase", phrase.id),
      text: phrase.text,
      en: phrase.en,
      ...(phrase.roman ? { roman: phrase.roman } : {}),
    })),
  }));
  if (!seed.letters?.length) return units;
  const letters: StudioGroup = {
    id: `${seed.id}-letters`,
    name: VOICES.studio.letters,
    letters: true,
    items: seed.letters.map((letter) => ({
      key: clipKey(seed.lang, "letter", letter.id),
      text: letter.draw ?? letter.char,
      roman: letter.name,
      en: letter.sound,
      letter: true,
    })),
  };
  return [...units, letters];
}

/** A phrase to say when testing the device voice: the course's first phrase. */
export function samplePhrase(seed: LangCourseSeed): string {
  const first = seed.packs[0]?.phrases[0];
  return first ? first.say ?? first.text : "";
}
