// The 28 letters in alphabet order (id, isolated character). Shared by the
// stroke builder; the app-side names/sounds live in src/content/arabic/letters.ts.
export const LETTERS = [
  ["alif", "ا"], ["ba", "ب"], ["ta", "ت"], ["tha", "ث"],
  ["jeem", "ج"], ["hha", "ح"], ["kha", "خ"], ["dal", "د"],
  ["thal", "ذ"], ["ra", "ر"], ["zay", "ز"], ["seen", "س"],
  ["sheen", "ش"], ["sad", "ص"], ["dad", "ض"], ["tta", "ط"],
  ["zza", "ظ"], ["ain", "ع"], ["ghain", "غ"], ["fa", "ف"],
  ["qaf", "ق"], ["kaf", "ك"], ["lam", "ل"], ["meem", "م"],
  ["noon", "ن"], ["ha", "ه"], ["waw", "و"], ["ya", "ي"],
].map(([id, char]) => ({ id, char }));
