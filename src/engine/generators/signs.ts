// Hand Signs — gestures and what they mean (nonverbal communication), including
// "I love you" in sign language.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji gesture, meaning]
const SIGNS: Array<[string, string]> = [
  ["👍", "good job or yes"],
  ["👎", "no or I don't like it"],
  ["👋", "hello or goodbye"],
  ["🤫", "please be quiet"],
  ["✋", "stop"],
  ["👌", "okay or perfect"],
  ["🤞", "good luck"],
  ["✌️", "peace"],
  ["👏", "well done (clapping)"],
  ["🤝", "let's agree (a handshake)"],
  ["🤟", "I love you (in sign language)"],
  ["🤙", "call me"],
  ["🙏", "please or thank you"],
];

export interface SignsParams {
  types: Array<"mean" | "which">;
}

let qid = 0;
const id = () => `sg${++qid}`;

export function generateSigns(params: SignsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, meaning] = pick(rng, SIGNS);
  if (type === "which") {
    const wrong = shuffle(rng, SIGNS.filter((s) => s[0] !== emoji)).slice(0, 3);
    return {
      id: id(),
      prompt: `Which hand sign means “${meaning}”?`,
      answer: emoji,
      choices: shuffle(rng, [emoji, ...wrong.map(([e]) => e)]),
      hint: "Picture making the gesture with your hand.",
      inputMode: "choices",
      dedupeKey: `which-${meaning}`,
    };
  }
  const wrong = shuffle(rng, SIGNS.filter((s) => s[1] !== meaning)).slice(0, 3);
  return {
    id: id(),
    prompt: "What does this hand sign mean?",
    answer: meaning,
    choices: shuffle(rng, [meaning, ...wrong.map(([, m]) => m)]),
    hint: "Think about when people make this gesture.",
    inputMode: "choices",
    dedupeKey: `mean-${meaning}`,
    payload: { bigSymbol: emoji },
  };
}
