// Stroke data for the letter lessons, found by the character itself (the
// lesson's letter cards and the tracer's letters are joined on `char`).
import { ARABIC_LETTERS } from "../../../content/arabic/letters";
import type { GlyphStrokes } from "../../../engine/write/types";

export function glyphOf(char: string): GlyphStrokes | null {
  return ARABIC_LETTERS.find((letter) => letter.char === char)?.glyph ?? null;
}
