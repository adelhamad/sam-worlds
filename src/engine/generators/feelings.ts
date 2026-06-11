// Feelings Forest — emotional intelligence: name feelings from faces, read
// situations, and learn what helps. Big expressive emoji, gentle tone.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [face, feeling]
const FACES: Array<[string, string]> = [
  ["😀", "happy"],
  ["😢", "sad"],
  ["😠", "angry"],
  ["😱", "scared"],
  ["😴", "tired"],
  ["😲", "surprised"],
  ["🤢", "yucky"],
  ["😟", "worried"],
  ["😊", "proud"],
  ["🥰", "loved"],
];

// situation → most likely feeling
const SITUATIONS: Array<[string, string]> = [
  ["Your tower of blocks falls down.", "frustrated"],
  ["You get a big hug from Mom.", "loved"],
  ["You finish a hard puzzle all by yourself.", "proud"],
  ["It's dark and you hear a strange noise.", "scared"],
  ["Your best friend moves far away.", "sad"],
  ["You get a surprise present!", "excited"],
  ["Someone takes your toy without asking.", "angry"],
  ["You stayed up very late last night.", "tired"],
];
const FEELING_WORDS = [
  ...new Set([...SITUATIONS.map(([, f]) => f), "happy", "calm", "shy", "curious"]),
];

// when you feel X, what helps? (the kind, healthy choice)
const HELPS: Array<[string, string, string[]]> = [
  ["angry", "🌬️ take deep breaths", ["💥 hit something", "😤 yell at someone", "🚪 slam the door"]],
  ["sad", "🫂 talk to someone you trust", ["🙈 hide it forever", "😢 stay all alone", "😠 be mean to others"]],
  ["scared", "💡 ask a grown-up for help", ["🏃 run and hide alone", "🤫 keep it secret", "😱 panic"]],
  ["worried", "🗣️ share what worries you", ["🤐 say nothing", "😟 worry alone", "😴 ignore it"]],
  ["frustrated", "🧩 try a different way", ["🛑 give up", "😤 break it", "😢 cry and quit"]],
  ["jealous", "💬 say how you feel kindly", ["😠 take their things", "🙄 be mean", "😢 sulk alone"]],
  ["excited", "🙌 share the good news", ["🏃 push others", "📢 interrupt everyone", "😤 brag a lot"]],
  ["embarrassed", "😅 it's okay, everyone makes mistakes", ["🙈 hide forever", "😠 blame someone", "😢 never try again"]],
];

export interface FeelingsParams {
  types: Array<"face" | "name" | "situation" | "helps">;
}

let qid = 0;
const id = () => `fe${++qid}`;

export function generateFeelings(params: FeelingsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "name":
      return genName(rng);
    case "situation":
      return genSituation(rng);
    case "helps":
      return genHelps(rng);
    default:
      return genFace(rng);
  }
}

function genFace(rng: RNG): Question {
  const [face, feeling] = pick(rng, FACES);
  const wrong = shuffle(rng, FACES.filter((f) => f[1] !== feeling)).slice(0, 3);
  return {
    id: id(),
    prompt: "How does this face feel?",
    answer: feeling,
    choices: shuffle(rng, [feeling, ...wrong.map(([, f]) => f)]),
    hint: "Look at the eyes and mouth.",
    inputMode: "choices",
    dedupeKey: `face-${feeling}`,
    payload: { bigSymbol: face },
  };
}

function genName(rng: RNG): Question {
  // given a feeling word, pick the matching face
  const [face, feeling] = pick(rng, FACES);
  const wrong = shuffle(rng, FACES.filter((f) => f[1] !== feeling)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which face looks ${feeling}?`,
    answer: face,
    choices: shuffle(rng, [face, ...wrong.map(([f]) => f)]),
    hint: "Make the face yourself and feel it!",
    inputMode: "choices",
    payload: { bigChoices: true },
  };
}

function genSituation(rng: RNG): Question {
  const [text, feeling] = pick(rng, SITUATIONS);
  const wrong = shuffle(rng, FEELING_WORDS.filter((f) => f !== feeling)).slice(0, 3);
  return {
    id: id(),
    prompt: text,
    answer: feeling,
    choices: shuffle(rng, [feeling, ...wrong]),
    hint: "How would YOU feel?",
    inputMode: "choices",
  };
}

function genHelps(rng: RNG): Question {
  const [feeling, good, bad] = pick(rng, HELPS);
  return {
    id: id(),
    prompt: `When you feel ${feeling}, what helps?`,
    answer: good,
    choices: shuffle(rng, [good, ...bad]),
    hint: "Pick the kind, calm choice.",
    inputMode: "choices",
  };
}
