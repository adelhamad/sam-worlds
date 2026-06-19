// Instrument Island — musical instruments, their families, and how you play
// them. (Distinct from Melody Engine, which is ear-training and notes.)
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, instrument, family, how you play it]
const INSTRUMENTS: Array<[string, string, string, string]> = [
  ["🎸", "guitar", "string", "strum the strings"],
  ["🎻", "violin", "string", "draw a bow across the strings"],
  ["🪕", "banjo", "string", "pluck the strings"],
  ["🎺", "trumpet", "brass", "blow into it"],
  ["🎷", "saxophone", "brass", "blow into it"],
  ["🪈", "flute", "wind", "blow across it"],
  ["🥁", "drum", "percussion", "hit it"],
  ["🪇", "maracas", "percussion", "shake them"],
  ["🔔", "triangle", "percussion", "tap it"],
  ["🎹", "piano", "keyboard", "press the keys"],
];

export interface InstrumentsParams {
  types: Array<"family" | "play" | "which">;
}

let qid = 0;
const id = () => `in${++qid}`;
const families = [...new Set(INSTRUMENTS.map((i) => i[2]))];

export function generateInstruments(params: InstrumentsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, name, family, how] = pick(rng, INSTRUMENTS);
  if (type === "play") {
    const wrong = shuffle(rng, [...new Set(INSTRUMENTS.map((i) => i[3]))].filter((h) => h !== how)).slice(0, 3);
    return { id: id(), prompt: `How do you play a ${name}?`, answer: how, choices: shuffle(rng, [how, ...wrong]), hint: "Do you blow, hit, shake, strum or press it?", inputMode: "choices", dedupeKey: `play-${name}`, payload: { bigSymbol: emoji } };
  }
  if (type === "which") {
    const inFamily = INSTRUMENTS.filter((i) => i[2] === family);
    const [e2, n2] = pick(rng, inFamily);
    const wrong = shuffle(rng, INSTRUMENTS.filter((i) => i[2] !== family)).slice(0, 3);
    return { id: id(), prompt: `Which is a ${family} instrument?`, answer: `${e2} ${n2}`, choices: shuffle(rng, [`${e2} ${n2}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: `${family} instruments belong together.`, inputMode: "choices", dedupeKey: `which-${family}-${n2}` };
  }
  const wrong = shuffle(rng, families.filter((f) => f !== family)).slice(0, 3);
  return { id: id(), prompt: `A ${name} is which kind of instrument?`, answer: family, choices: shuffle(rng, [family, ...wrong]), hint: "String, wind, brass, percussion or keyboard?", inputMode: "choices", dedupeKey: `family-${name}`, payload: { bigSymbol: emoji } };
}
