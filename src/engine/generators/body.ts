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
  ["👃", "nose", "lets you smell"],
  ["👅", "tongue", "lets you taste"],
  ["🩻", "ribs", "shield your heart and lungs"],
  ["🌀", "intestines", "soak up food into your body"],
  ["🟤", "liver", "cleans out things your body doesn't need"],
  ["🦴", "spine", "carries messages up and down your back"],
  ["✋", "hands", "let you grab and hold things"],
  ["🦵", "legs", "let you walk and run"],
  ["💧", "sweat", "cools you down when you're hot"],
  ["🧬", "cells", "are the tiny building blocks of you"],
  ["💇", "hair", "keeps your head warm"],
  ["💅", "nails", "protect the tips of your fingers"],
];

// [emoji, thing you sense, sense, body part you use]
const SENSES: Array<[string, string, string, string]> = [
  ["🌈", "a rainbow", "see", "eyes"],
  ["🎵", "music", "hear", "ears"],
  ["🌹", "a flower", "smell", "nose"],
  ["🍋", "a sour lemon", "taste", "tongue"],
  ["🧊", "a cold ice cube", "touch", "hands"],
  ["⭐", "a twinkling star", "see", "eyes"],
  ["🐦", "a bird singing", "hear", "ears"],
  ["🍪", "fresh cookies", "smell", "nose"],
  ["🍯", "sweet honey", "taste", "tongue"],
  ["🐈", "soft fur", "touch", "hands"],
  ["📖", "the words in a book", "see", "eyes"],
  ["🔔", "a ringing bell", "hear", "ears"],
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
  ["🥜 a handful of nuts", ["🍫 a chocolate bar", "🍬 a bag of candy", "🍩 two donuts"]],
  ["🛌 going to bed on time", ["📱 phone under the covers", "📺 TV until midnight", "🎮 games all night"]],
  ["🪥 brushing twice a day", ["🍭 candy instead of brushing", "🚫 skipping it all week", "🥤 soda before bed"]],
  ["🥬 a green smoothie", ["🍦 a giant sundae", "🥤 a big fizzy drink", "🍰 cake for breakfast"]],
  ["🤸 stretching your body", ["🛋️ slouching all day", "📱 hunching over a screen", "🚫 never moving"]],
  ["🧴 sunscreen at the beach", ["🔥 burning in the sun", "🚫 no hat or shade", "😎 staring at the sun"]],
  ["🍓 berries for a snack", ["🍟 a basket of fries", "🍫 chocolate buttons", "🧁 a frosted cupcake"]],
  ["💤 a calm bedtime routine", ["😱 scary shows at night", "🥤 caffeine before bed", "📱 bright screens late"]],
  ["🚰 sipping water when thirsty", ["🥤 only soda all day", "🧃 sugary juice boxes", "🍦 a milkshake instead"]],
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
  ["From food to energy:", ["🍎 you eat", "🌀 your body soaks it up", "⚡ you get energy"]],
  ["A breath out:", ["🫁 lungs squeeze", "🌬️ air goes up", "👃 out the nose"]],
  ["Hearing a sound:", ["🔔 a sound is made", "👂 your ear catches it", "🧠 your brain knows it"]],
  ["Seeing a picture:", ["👁️ light hits your eye", "🧠 your brain reads it", "💡 you know what it is"]],
  ["Growing a tooth back:", ["🦷 baby tooth wobbles", "🕳️ it falls out", "✨ a big tooth grows"]],
  ["From thirsty to better:", ["😓 you feel thirsty", "💧 you drink water", "😊 you feel good again"]],
  ["When you scrape your knee:", ["🩸 it bleeds a little", "🩹 a scab forms", "✨ it heals up"]],
  ["From tired to rested:", ["🥱 you yawn", "😴 you fall asleep", "🌅 you wake up fresh"]],
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
  const [emoji, thing, sense, part] = pick(rng, SENSES);
  // collect distinct wrong senses so no choice repeats
  const otherSenses = [...new Set(SENSES.map(([, , s]) => s).filter((s) => s !== sense))];
  const wrong = shuffle(rng, otherSenses).slice(0, 3);
  return {
    id: id(),
    prompt: `Which sense do you use for ${thing}?`,
    answer: `to ${sense}`,
    choices: shuffle(rng, [`to ${sense}`, ...wrong.map((s) => `to ${s}`)]),
    hint: `Your ${part} help you!`,
    inputMode: "choices",
    dedupeKey: `sense-${thing}`,
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
