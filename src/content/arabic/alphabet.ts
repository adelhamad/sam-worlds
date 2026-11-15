// The Arabic alphabet as cards for the letter lessons: the letter, its name
// and its sound in Latin letters (scheme: docs/LANGUAGES.md), and what the
// voice reads. Stroke data for writing lives beside it (strokes are matched to
// these cards by `char`). Never change an id: questions refer to them.
import type { LetterCard } from "../../engine/lang/types";

export const ARABIC_ALPHABET: LetterCard[] = [
  { id: "alif", char: "ا", name: "alif", sound: "aa", say: "ألف" },
  { id: "baa", char: "ب", name: "baa", sound: "b", say: "باء" },
  { id: "taa", char: "ت", name: "taa", sound: "t", say: "تاء" },
  { id: "thaa", char: "ث", name: "thaa", sound: "th", say: "ثاء" },
  { id: "jiim", char: "ج", name: "jiim", sound: "j", say: "جيم" },
  { id: "hhaa", char: "ح", name: "Haa", sound: "H (a breathy h)", say: "حاء" },
  { id: "khaa", char: "خ", name: "khaa", sound: "kh", say: "خاء" },
  { id: "daal", char: "د", name: "daal", sound: "d", say: "دال" },
  { id: "dhaal", char: "ذ", name: "dhaal", sound: "dh (as in this)", say: "ذال" },
  { id: "raa", char: "ر", name: "raa", sound: "r (rolled)", say: "راء" },
  { id: "zaay", char: "ز", name: "zaay", sound: "z", say: "زاي" },
  { id: "siin", char: "س", name: "siin", sound: "s", say: "سين" },
  { id: "shiin", char: "ش", name: "shiin", sound: "sh", say: "شين" },
  { id: "saad", char: "ص", name: "Saad", sound: "S (a heavy s)", say: "صاد" },
  { id: "daad", char: "ض", name: "Daad", sound: "D (a heavy d)", say: "ضاد" },
  { id: "ttaa", char: "ط", name: "Taa", sound: "T (a heavy t)", say: "طاء" },
  { id: "zzaa", char: "ظ", name: "Zaa", sound: "Z (a heavy z)", say: "ظاء" },
  { id: "ayn", char: "ع", name: "‘ayn", sound: "‘ (a squeezed a)", say: "عين" },
  { id: "ghayn", char: "غ", name: "ghayn", sound: "gh", say: "غين" },
  { id: "faa", char: "ف", name: "faa", sound: "f", say: "فاء" },
  { id: "qaaf", char: "ق", name: "qaaf", sound: "q (often a tiny stop)", say: "قاف" },
  { id: "kaaf", char: "ك", name: "kaaf", sound: "k", say: "كاف" },
  { id: "laam", char: "ل", name: "laam", sound: "l", say: "لام" },
  { id: "miim", char: "م", name: "miim", sound: "m", say: "ميم" },
  { id: "nuun", char: "ن", name: "nuun", sound: "n", say: "نون" },
  // The font draws a lone ه as a knot; ە is the same font's round form, the one schoolbooks teach.
  { id: "haa", char: "ه", draw: "ە", name: "haa", sound: "h", say: "هاء" },
  { id: "waaw", char: "و", name: "waaw", sound: "w or oo", say: "واو" },
  { id: "yaa", char: "ي", name: "yaa", sound: "y or ee", say: "ياء" },
];
