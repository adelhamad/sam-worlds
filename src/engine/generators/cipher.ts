// Cipher Bay — decode secret messages, typed letter by letter.
// Word pool mixes space words with Minecraft favorites.
import { pick, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface CipherParams {
  types: Array<"number" | "shift" | "symbol">;
  maxLen: number; // word length cap
  maxShift?: number; // Caesar shift cap
}

const WORDS = [
  "STAR", "MOON", "SHIP", "GEAR", "CODE", "SPARK", "ORBIT", "LIGHT", "COMET", "ROBOT",
  "FORGE", "ROCKET", "PLANET", "SIGNAL",
  // Minecraft flavor
  "CRAFT", "MINER", "CREEPER", "DIAMOND", "REDSTONE", "EMERALD", "PICKAXE", "NETHER", "BLOCK", "SLIME",
];

const SYMBOLS = ["★", "♦", "♣", "♠", "●", "▲", "■", "✿", "☂", "☼", "♞", "♪", "⚡", "❄"];

let qid = 0;
const A = 65;

export function generateCipher(params: CipherParams, rng: RNG, ctx: GenContext): Question {
  const maxLen = ctx.easier ? Math.min(4, params.maxLen) : params.maxLen;
  const pool = WORDS.filter((w) => w.length <= maxLen);
  const word = pick(rng, pool);
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);

  if (type === "number") {
    const encoded = [...word].map((ch) => ch.charCodeAt(0) - A + 1).join("-");
    return q(word, `Decode: ${encoded}`, "A=1, B=2, C=3…", { legend: "A=1 B=2 C=3 …" });
  }

  if (type === "shift") {
    const k = 1 + Math.floor((ctx.easier ? 0 : rng()) * Math.min(params.maxShift ?? 3, 5));
    const encoded = [...word]
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - A + k) % 26) + A))
      .join("");
    return q(word, `Decode: ${encoded}`, `Each letter slid ${k} forward.`, {
      legend: `Key: A→${String.fromCharCode(A + k)} (shift ${k})`,
    });
  }

  // symbol cipher: show the legend for this word's letters (shuffled)
  const letters = [...new Set(word)];
  const symbols = [...SYMBOLS];
  const map: Record<string, string> = {};
  for (const ch of letters) {
    map[ch] = symbols.splice(Math.floor(rng() * symbols.length), 1)[0];
  }
  const encoded = [...word].map((ch) => map[ch]).join(" ");
  const legend = letters
    .map((ch) => `${map[ch]}=${ch}`)
    .sort(() => 0.5 - rng())
    .join("  ");
  return q(word, `Decode: ${encoded}`, "Match each symbol in the legend.", { legend });
}

function q(word: string, prompt: string, hint: string, payload: Record<string, unknown>): Question {
  return {
    id: `cb${++qid}`,
    prompt,
    answer: word,
    choices: [],
    hint: `${hint} It starts with ${word[0]}.`,
    inputMode: "letters",
    payload: { ...payload, length: word.length },
  };
}
