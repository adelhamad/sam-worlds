// Body Explorer — how the human body works. Matching + ordering, visual emoji.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [organ emoji, name, what it does]
const ORGANS: Array<[string, string, string]> = [
  ["🫀", "heart", "pumps your blood"],
  ["🫁", "lungs", "help you breathe"],
  ["🧠", "brain", "thinks and remembers"],
  ["🦴", "bones", "hold your body up"],
  ["💪", "muscles", "help you move"],
  ["🦷", "teeth", "chew your food"],
  ["👁️", "eyes", "let you see"],
  ["👂", "ears", "let you hear"],
  ["🫃", "stomach", "breaks down food"],
  ["🩸", "blood", "carries food and air around your body"],
  ["🧍", "skin", "protects everything inside you"],
  ["🫘", "kidneys", "clean your blood"],
];

// [sense emoji, body part, sense]
const SENSES: Array<[string, string, string]> = [
  ["👀", "eyes", "see"],
  ["👂", "ears", "hear"],
  ["👃", "nose", "smell"],
  ["👅", "tongue", "taste"],
  ["✋", "hands", "touch"],
];

// healthy vs not — pick the healthy choice
const HEALTHY: Array<[string, string[]]> = [
  ["🥦 vegetables", ["🍭 lollipop", "🍟 fries", "🥤 soda"]],
  ["💧 water", ["🥤 soda", "🧃 sugary juice", "🍬 candy"]],
  ["😴 good sleep", ["📺 late TV", "🎮 all-night games", "☕ coffee"]],
  ["🏃 running outside", ["🛋️ sitting all day", "🍕 lots of pizza", "😴 no exercise"]],
  ["🪥 brushing teeth", ["🍫 chocolate before bed", "🚫 skipping brushing", "🍭 candy at night"]],
  ["🍎 fruit snack", ["🍩 donut", "🍪 cookies", "🧁 cupcake"]],
  ["🧼 washing hands", ["🤧 touching food dirty", "🚫 skipping the sink", "👋 dirty hands"]],
  ["🥛 milk for bones", ["🥤 fizzy drink", "🍦 ice cream meal", "🍫 chocolate bar"]],
  ["☀️ play outside", ["📱 screens all day", "🛏️ stay in bed", "🎮 no breaks"]],
  ["🥗 a fresh salad", ["🍟 fries every day", "🍫 chocolate dinner", "🥤 fizzy drink"]],
  ["🦷 visiting the dentist", ["🙈 hiding from check-ups", "🍬 extra candy", "🚫 never brushing"]],
  ["⚽ playing sports", ["🛋️ couch all weekend", "🎮 gaming all night", "🍕 pizza marathon"]],
  ["🥕 carrot sticks", ["🍩 a donut", "🍬 gummy bears", "🍪 a cookie jar"]],
  ["🧘 quiet rest time", ["📺 loud TV all day", "🏃 never slowing down", "🎮 screens till midnight"]],
  ["🚶 walking to school", ["🛗 always the elevator", "🛋️ never moving", "📱 walking while staring at a phone"]],
];

// ordering journeys — each is a self-contained "put in order" question
const SEQUENCES: Array<[string, string[]]> = [
  ["Where does food go?", ["👄 mouth", "🫃 stomach", "🌀 intestine"]],
  ["How does a breath travel?", ["👃 nose", "🌬️ windpipe", "🫁 lungs"]],
  ["How do you grow up?", ["👶 baby", "🧒 child", "🧑 grown-up"]],
  ["A tooth's life:", ["🦷 baby tooth", "🫨 wobbly tooth", "✨ new tooth"]],
  ["Where does blood travel?", ["🫀 heart", "🩸 blood vessels", "🦶 all the way to your toes"]],
  ["How does a cut heal?", ["🩸 it bleeds a little", "🩹 a scab grows", "✨ new skin appears"]],
  ["Wash those germs away!", ["💧 wet your hands", "🧼 scrub with soap", "🧻 dry them off"]],
  ["Getting ready to sleep:", ["🪥 brush your teeth", "📖 a bedtime story", "😴 lights out"]],
];

export interface BodyParams {
  types: Array<"organ" | "sense" | "healthy" | "digest">;
}

let qid = 0;
const id = () => `bd${++qid}`;

export function generateBody(params: BodyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "sense":
      return genSense(rng);
    case "healthy":
      return genHealthy(rng);
    case "digest":
      return genDigest(rng);
    default:
      return genOrgan(rng);
  }
}

function genOrgan(rng: RNG): Question {
  const [emoji, name, does] = pick(rng, ORGANS);
  const askByJob = rng() < 0.5;
  if (askByJob) {
    const wrong = shuffle(rng, ORGANS.filter((o) => o[1] !== name)).slice(0, 3);
    return {
      id: id(),
      prompt: `Which body part ${does}?`,
      answer: `${emoji} ${name}`,
      choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
      hint: "Picture where it sits inside you.",
      inputMode: "choices",
      dedupeKey: `organ-job-${name}`,
    };
  }
  const wrong = shuffle(rng, ORGANS.filter((o) => o[2] !== does)).slice(0, 3);
  return {
    id: id(),
    prompt: `What does the ${name} do?`,
    answer: does,
    choices: shuffle(rng, [does, ...wrong.map(([, , d]) => d)]),
    hint: "Think about what you feel it doing.",
    inputMode: "choices",
    dedupeKey: `organ-do-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genSense(rng: RNG): Question {
  const [emoji, part, sense] = pick(rng, SENSES);
  const wrong = shuffle(rng, SENSES.filter((s) => s[2] !== sense)).slice(0, 3);
  return {
    id: id(),
    prompt: `What do you use your ${part} for?`,
    answer: `to ${sense}`,
    choices: shuffle(rng, [`to ${sense}`, ...wrong.map(([, , s]) => `to ${s}`)]),
    hint: "One of your five senses!",
    inputMode: "choices",
    dedupeKey: `sense-${part}`,
    payload: { bigSymbol: emoji },
  };
}

function genHealthy(rng: RNG): Question {
  const [good, bad] = pick(rng, HEALTHY);
  return {
    id: id(),
    prompt: "Which one keeps you healthy?",
    answer: good,
    choices: shuffle(rng, [good, ...bad]),
    hint: "Which one helps your body grow strong?",
    inputMode: "choices",
    dedupeKey: `healthy-${good}`,
  };
}

function genDigest(rng: RNG): Question {
  const [title, seq] = pick(rng, SEQUENCES);
  return {
    id: id(),
    prompt: `${title} Put it in order!`,
    answer: seq.join(" → "),
    choices: [],
    hint: `It starts with ${seq[0]}.`,
    inputMode: "order",
    dedupeKey: `seq-${title}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}
