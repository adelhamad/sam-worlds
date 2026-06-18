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
  // 3-letter (lots — difficulty bands favor short words)
  "CAT", "SUN", "MAP", "KEY", "BOX", "DOG", "BAT", "HAT", "CUP", "BUG",
  "FOX", "OWL", "JAR", "NET", "PIE", "BUS", "FAN", "PEN", "RUG", "TOY",
  "ICE", "SKY", "JET", "ANT", "BEE", "CAR", "EGG", "GEM", "PIG", "HEN",
  // 4-letter
  "STAR", "MOON", "SHIP", "GEAR", "CODE", "FISH", "BIRD", "TREE", "FROG", "LION",
  "BEAR", "DUCK", "GOAT", "WOLF", "LEAF", "ROCK", "SNOW", "RAIN", "WIND", "FIRE",
  "CAKE", "MILK", "BOAT", "KITE", "DRUM", "BELL", "RING", "DOOR", "LAMP", "NEST",
  // 5-letter
  "SPARK", "ORBIT", "LIGHT", "COMET", "ROBOT", "CRAFT", "MINER", "BLOCK", "SLIME", "APPLE",
  "TIGER", "ZEBRA", "PANDA", "HONEY", "CLOUD", "RIVER", "BEACH", "MOUSE", "HORSE", "SNAKE",
  // longer (space + Minecraft flavor)
  "FORGE", "ROCKET", "PLANET", "SIGNAL", "GALAXY", "COMPASS", "ASTEROID", "TREASURE", "TELESCOPE", "ADVENTURE",
  "CREEPER", "DIAMOND", "REDSTONE", "EMERALD", "PICKAXE", "NETHER", "PORTAL", "VILLAGER", "ENDERMAN", "OBSIDIAN",
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
    return q(word, type, `Decode: ${encoded}`, "A=1, B=2, C=3…", { legend: "A=1 B=2 C=3 …" });
  }

  if (type === "shift") {
    const k = 1 + Math.floor((ctx.easier ? 0 : rng()) * Math.min(params.maxShift ?? 3, 5));
    const encoded = [...word]
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - A + k) % 26) + A))
      .join("");
    return q(word, type, `Decode: ${encoded}`, `Each letter slid ${k} forward.`, {
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
  return q(word, type, `Decode: ${encoded}`, "Match each symbol in the legend.", { legend });
}

function q(
  word: string,
  type: CipherParams["types"][number],
  prompt: string,
  hint: string,
  payload: Record<string, unknown>,
): Question {
  return {
    id: `cb${++qid}`,
    prompt,
    answer: word,
    choices: [],
    hint: `${hint} It starts with ${word[0]}.`,
    // Same word under a different cipher is a DISTINCT question, so dedupe by both.
    dedupeKey: `${type}:${word}`,
    inputMode: "letters",
    payload: { ...payload, length: word.length },
  };
}
