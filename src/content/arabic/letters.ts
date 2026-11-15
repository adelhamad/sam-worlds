// The 28 Arabic letters (isolated forms) in alphabet order, with what a
// Levantine family calls them and a sound hint a 7-year-old English reader can
// use. Shapes and strokes come from strokes.gen.ts (generated from the font —
// see docs/ARABIC_WRITING.md). Ids are saved by lessons: never rename them.
import type { GlyphStrokes } from "../../engine/write/types";
import { ARABIC_FONT, ARABIC_STROKES } from "./strokes.gen";

export interface ArabicLetter {
  id: string;
  /** Isolated form. */
  char: string;
  /** The letter's name in Latin letters. Capitals mark the "heavy" letters (Haa, Saad, Daad, Taa, Zaa). */
  name: string;
  /** How it sounds, in one short hint. */
  sound: string;
  glyph: GlyphStrokes;
}

/** Design-box size of every glyph (strokes and font layout). */
export const ARABIC_BOX = 1000;

const LETTER_INFO: Array<[id: string, name: string, sound: string]> = [
  ["alif", "alif", "a (as in 'car')"],
  ["ba", "baa", "b"],
  ["ta", "taa", "t"],
  ["tha", "thaa", "th (as in 'think')"],
  ["jeem", "jeem", "j, or zh like the s in 'treasure'"],
  ["hha", "Haa", "a strong breathy h, like fogging a mirror"],
  ["kha", "khaa", "kh (like clearing your throat)"],
  ["dal", "daal", "d"],
  ["thal", "thaal", "th (as in 'this'), often said z or d"],
  ["ra", "raa", "r (rolled, like a cat's purr)"],
  ["zay", "zaay", "z"],
  ["seen", "seen", "s"],
  ["sheen", "sheen", "sh"],
  ["sad", "Saad", "a heavy s, with a round mouth"],
  ["dad", "Daad", "a heavy d, with a round mouth"],
  ["tta", "Taa", "a heavy t, with a round mouth"],
  ["zza", "Zaa", "a heavy z, with a round mouth"],
  ["ain", "ain", "a tight 'a' squeezed deep in the throat"],
  ["ghain", "ghain", "gh (like gargling, or a French r)"],
  ["fa", "faa", "f"],
  ["qaf", "qaaf", "q (a k from deep in the throat; at home often a catch like in 'uh-oh')"],
  ["kaf", "kaaf", "k"],
  ["lam", "laam", "l"],
  ["meem", "meem", "m"],
  ["noon", "noon", "n"],
  ["ha", "haa", "h (as in 'hat')"],
  ["waw", "waaw", "w, or oo"],
  ["ya", "yaa", "y, or ee"],
];

export const ARABIC_LETTERS: ArabicLetter[] = LETTER_INFO.map(([id, name, sound]) => {
  const raw = ARABIC_STROKES[id];
  if (!raw) throw new Error(`Arabic letter ${id} has no strokes — regenerate strokes.gen.ts`);
  return { id, char: raw.char, name, sound, glyph: { ...raw, id, box: ARABIC_BOX, font: ARABIC_FONT } };
});

export const ARABIC_LETTER_BY_ID: ReadonlyMap<string, ArabicLetter> = new Map(ARABIC_LETTERS.map((letter) => [letter.id, letter]));

/** The tracer glyph of a letter id (throws on an unknown id). */
export function arabicGlyph(id: string): GlyphStrokes {
  const letter = ARABIC_LETTER_BY_ID.get(id);
  if (!letter) throw new Error(`Unknown Arabic letter ${id}`);
  return letter.glyph;
}
