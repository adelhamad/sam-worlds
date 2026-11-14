// Splits a country name into readable 2–3 letter tiles for the "build" exercise
// (JAPAN → JA+PAN, EGYPT → EG+YPT, SAUDI ARABIA → SAU+DI + ARA+BIA). The split is
// deterministic: a name always breaks the same way, so the tiles become familiar.
import { lettersOf } from "./answers";

const VOWELS = new Set([..."AEIOUY"]);
/** Letter pairs that read as one sound — a tile edge should not cut them. */
const DIGRAPHS = new Set(["TH", "CH", "SH", "PH", "QU", "CK", "NG"]);
const MAX_WORDS = 2;
const MAX_LETTERS = 13;

/** Every way to cut `length` letters into the fewest chunks of 2 or 3. */
function chunkSizes(length: number): number[][] {
  if (length <= 3) return [[length]];
  const count = Math.ceil(length / 3);
  const options: number[][] = [];
  const walk = (sizes: number[], left: number) => {
    if (sizes.length === count) {
      if (left === 0) options.push(sizes);
      return;
    }
    for (const size of [2, 3]) {
      if (left - size >= 0) walk([...sizes, size], left - size);
    }
  };
  walk([], length);
  return options;
}

function cut(word: string, sizes: number[]): string[] {
  let at = 0;
  return sizes.map((size) => {
    const chunk = word.slice(at, at + size);
    at += size;
    return chunk;
  });
}

function hasVowel(chunk: string): boolean {
  return [...chunk].some((letter) => VOWELS.has(letter));
}

/** Higher = reads more like syllables. */
function readability(chunks: string[]): number {
  let score = 0;
  chunks.forEach((chunk, index) => {
    if (!hasVowel(chunk)) score -= 3;
    if (index === 0) return;
    // A tile that opens consonant + vowel sounds like the start of a syllable.
    if (!VOWELS.has(chunk[0]) && VOWELS.has(chunk[1])) score += 1;
    const previous = chunks[index - 1];
    if (DIGRAPHS.has(previous[previous.length - 1] + chunk[0])) score -= 1;
  });
  return score;
}

/** One word (letters only, upper-case) → its chunks. */
export function splitWord(word: string): string[] {
  let best: string[] = [word];
  let bestScore = -Infinity;
  for (const sizes of chunkSizes(word.length)) {
    const chunks = cut(word, sizes);
    const score = readability(chunks);
    if (score > bestScore) {
      best = chunks;
      bestScore = score;
    }
  }
  return best;
}

const cache = new Map<string, string[][] | null>();

function chunkName(name: string): string[][] | null {
  // Only plain A–Z names: accents or apostrophes cannot be built from tiles.
  if (!/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(name)) return null;
  const words = name.split(/[ -]/).map(lettersOf);
  const letters = words.join("").length;
  if (words.length > MAX_WORDS || letters > MAX_LETTERS || words.some((word) => word.length < 2)) return null;
  return words.map(splitWord);
}

/**
 * Chunks of each word of a country name, or null when the name cannot be a
 * build exercise (more than two words, more than 13 letters, odd characters).
 */
export function nameChunks(name: string): string[][] | null {
  if (!cache.has(name)) cache.set(name, chunkName(name));
  return cache.get(name) ?? null;
}
