// Feelings Forest — emotional intelligence: name feelings from faces, read
// situations, and learn what helps. Big expressive emoji, gentle tone.
// Distractors are curated so near-synonyms (happy/proud/excited) never compete
// with the right answer — a feelings question must have ONE fair answer.
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
  ["😌", "calm"],
  ["🤩", "excited"],
  ["🥱", "bored"],
  ["🤔", "curious"],
];

// feelings too close to be fair distractors for each other
const CONFUSE: Record<string, string[]> = {
  happy: ["proud", "excited", "loved", "calm"],
  proud: ["happy", "excited", "loved"],
  excited: ["happy", "proud", "surprised"],
  loved: ["happy", "proud"],
  surprised: ["excited", "scared"],
  sad: ["worried", "tired"],
  worried: ["sad", "scared"],
  scared: ["worried", "surprised"],
  angry: ["frustrated", "yucky"],
  frustrated: ["angry"],
  calm: ["tired", "happy", "bored"],
  tired: ["calm", "sad", "bored"],
  bored: ["tired", "calm"],
};

function fairWrongs(rng: RNG, all: string[], answer: string): string[] {
  const blocked = [answer, ...(CONFUSE[answer] ?? [])];
  return shuffle(rng, all.filter((f) => !blocked.includes(f))).slice(0, 3);
}

// [situation, feeling, curated wrong choices]
const SITUATIONS: Array<[string, string, string[]]> = [
  ["Your tower of blocks falls down.", "frustrated", ["proud", "loved", "calm"]],
  ["You get a big hug from Mom.", "loved", ["angry", "scared", "bored"]],
  ["You finish a hard puzzle all by yourself.", "proud", ["sad", "scared", "bored"]],
  ["It's dark and you hear a strange noise.", "scared", ["proud", "loved", "bored"]],
  ["Your best friend moves far away.", "sad", ["excited", "proud", "calm"]],
  ["You get a surprise present!", "excited", ["angry", "sad", "scared"]],
  ["Someone takes your toy without asking.", "angry", ["happy", "loved", "tired"]],
  ["You stayed up very late last night.", "tired", ["excited", "angry", "scared"]],
  ["You win a board game.", "happy", ["sad", "angry", "scared"]],
  ["Your ice cream falls on the ground.", "sad", ["happy", "proud", "calm"]],
  ["A big dog barks loudly at you.", "scared", ["calm", "proud", "happy"]],
  ["You're about to open your birthday presents.", "excited", ["bored", "sad", "angry"]],
  ["You wait and wait and nothing happens.", "bored", ["excited", "scared", "proud"]],
  ["You see a strange machine and wonder how it works.", "curious", ["angry", "sad", "tired"]],
  ["It's your first day at a new school.", "nervous", ["bored", "angry", "tired"]],
  ["You take slow, deep breaths in the quiet garden.", "calm", ["angry", "scared", "worried"]],
  ["You helped Grandma carry her bags.", "proud", ["angry", "scared", "jealous"]],
  ["Your friend gets the toy you always wanted.", "jealous", ["scared", "tired", "calm"]],
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
  ["nervous", "🌬️ slow breaths — you are ready", ["🙈 run away", "🤐 tell no one", "😖 imagine the worst"]],
  ["tired", "😴 rest and go to bed early", ["🍬 eat candy for energy", "📺 more screens", "😤 push until you drop"]],
  ["bored", "🎨 make or build something fun", ["😩 moan about it", "🛋️ flop and sulk", "😤 bother your brother"]],
  ["shy", "👋 start with one small hello", ["🙈 hide forever", "😶 never speak", "🏃 run away"]],
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
  const wrong = fairWrongs(rng, FACES.map(([, f]) => f), feeling);
  return {
    id: id(),
    prompt: "How does this face feel?",
    answer: feeling,
    choices: shuffle(rng, [feeling, ...wrong]),
    hint: "Look at the eyes and mouth.",
    inputMode: "choices",
    dedupeKey: `face-${feeling}`,
    payload: { bigSymbol: face },
  };
}

function genName(rng: RNG): Question {
  // given a feeling word, pick the matching face
  const [face, feeling] = pick(rng, FACES);
  const wrongFeelings = fairWrongs(rng, FACES.map(([, f]) => f), feeling);
  const wrong = wrongFeelings.map((f) => FACES.find(([, ff]) => ff === f)![0]);
  return {
    id: id(),
    prompt: `Which face looks ${feeling}?`,
    answer: face,
    choices: shuffle(rng, [face, ...wrong]),
    hint: "Make the face yourself and feel it!",
    inputMode: "choices",
    dedupeKey: `name-${feeling}`,
    payload: { bigChoices: true },
  };
}

function genSituation(rng: RNG): Question {
  const [text, feeling, wrong] = pick(rng, SITUATIONS);
  return {
    id: id(),
    prompt: text,
    answer: feeling,
    choices: shuffle(rng, [feeling, ...wrong]),
    hint: "How would YOU feel?",
    inputMode: "choices",
    dedupeKey: `sit-${text}`,
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
    dedupeKey: `help-${feeling}`,
  };
}
