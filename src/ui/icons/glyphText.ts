// Text glyphs that <Glyph> draws as art instead of printing them.
import type { PieceType } from "../../engine/chess/types";

// Chess units keep the text-style chess glyphs (U+2654–U+265F, optionally
// followed by the text-presentation selector U+FE0E) in their data, and
// trophies earned from them saved that glyph. Written as code points so this
// source file holds no pictographic characters.
const ORDER: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
const PIECES = new Map<string, PieceType>(
  ORDER.flatMap((piece, i) => [
    [String.fromCodePoint(0x2654 + i), piece],
    [String.fromCodePoint(0x265a + i), piece],
  ]),
);
const SELECTORS = /[\uFE0E\uFE0F]/g;

/** The chess piece a text-style chess glyph stands for, or null. */
export function pieceOfGlyph(value: string): PieceType | null {
  return PIECES.get(value.replace(SELECTORS, "")) ?? null;
}
