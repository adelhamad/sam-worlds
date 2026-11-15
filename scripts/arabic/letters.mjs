// The 28 letters in alphabet order (id, isolated character). Shared by the
// stroke builder; the app-side names/sounds live in src/content/arabic/letters.ts.
// `draw`: the character actually rendered (and traced) when the font's own
// isolated glyph is not the school form — Noto Sans Arabic draws a lone ه
// (U+0647) as the Naskh "knot", while its ە (U+06D5) is the round heh that
// schoolbooks teach. The letter's identity stays `char`.
const DRAW = { ha: "\u06D5" };
export const LETTERS = [
  ["alif", "ا"], ["ba", "ب"], ["ta", "ت"], ["tha", "ث"],
  ["jeem", "ج"], ["hha", "ح"], ["kha", "خ"], ["dal", "د"],
  ["thal", "ذ"], ["ra", "ر"], ["zay", "ز"], ["seen", "س"],
  ["sheen", "ش"], ["sad", "ص"], ["dad", "ض"], ["tta", "ط"],
  ["zza", "ظ"], ["ain", "ع"], ["ghain", "غ"], ["fa", "ف"],
  ["qaf", "ق"], ["kaf", "ك"], ["lam", "ل"], ["meem", "م"],
  ["noon", "ن"], ["ha", "ه"], ["waw", "و"], ["ya", "ي"],
].map(([id, char]) => ({ id, char, draw: DRAW[id] }));
