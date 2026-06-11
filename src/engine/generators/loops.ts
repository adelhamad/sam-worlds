// Repeat Rapids — loops & iteration basics: repeating actions, counting how
// many times, and continuing repeated patterns. Intro to "for / repeat".
import { pick, randInt, shuffle, type RNG } from "../rng";
import { numericChoices, type GenContext, type Question } from "./types";

const ACTIONS: Array<[string, string]> = [
  ["👏", "claps"], ["🦘", "hops"], ["⭐", "stars"], ["🥁", "drum beats"], ["🟦", "blocks"], ["🦶", "steps"],
];
const PATTERN_UNITS = [
  ["🔴", "🔵"],
  ["🟢", "🟡", "🟣"],
  ["⬆️", "➡️"],
  ["🐱", "🐶"],
  ["🔺", "🟦"],
];

export interface LoopParams {
  types: Array<"countRepeat" | "repeatGroups" | "pattern" | "robotSteps">;
  maxTimes?: number;
}

let qid = 0;
const id = () => `lo${++qid}`;

export function generateLoops(params: LoopParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "repeatGroups":
      return genRepeatGroups(params, rng, ctx);
    case "pattern":
      return genPattern(rng, ctx);
    case "robotSteps":
      return genRobotSteps(params, rng, ctx);
    default:
      return genCountRepeat(params, rng, ctx);
  }
}

// Repeat 1 action N times → how many total?
function genCountRepeat(params: LoopParams, rng: RNG, ctx: GenContext): Question {
  const [emoji, word] = pick(rng, ACTIONS);
  const times = randInt(rng, 2, ctx.easier ? 5 : (params.maxTimes ?? 10));
  return {
    id: id(),
    prompt: `Repeat ${times} times: ${emoji}. How many ${word}?`,
    answer: String(times),
    choices: numericChoices(rng, times, [1, 2, 3]),
    hint: `Count one ${emoji} for each loop: ${times} loops.`,
    dedupeKey: `count-${word}-${times}`,
  };
}

// Repeat a GROUP of items N times → N × groupSize (loops as multiplication).
function genRepeatGroups(params: LoopParams, rng: RNG, ctx: GenContext): Question {
  const [emoji, word] = pick(rng, ACTIONS);
  const groupSize = randInt(rng, 2, ctx.easier ? 3 : 5);
  const times = randInt(rng, 2, ctx.easier ? 4 : (params.maxTimes ?? 6));
  const group = emoji.repeat(groupSize);
  return {
    id: id(),
    prompt: `Repeat ${times} times: ${group}. How many ${word} in all?`,
    answer: String(groupSize * times),
    choices: numericChoices(rng, groupSize * times, [groupSize, times, 1]),
    hint: `Each loop makes ${groupSize}. ${times} loops → ${groupSize} × ${times}.`,
    dedupeKey: `groups-${word}-${groupSize}x${times}`,
  };
}

// Continue a repeating pattern → what comes next?
function genPattern(rng: RNG, ctx: GenContext): Question {
  const unit = pick(rng, PATTERN_UNITS);
  const reps = ctx.easier ? 2 : 3;
  const shown = Array.from({ length: reps }, () => unit.join("")).join("") ;
  const nextIdx = (reps * unit.length) % unit.length; // = 0, first of next unit
  const answer = unit[nextIdx];
  const wrong = shuffle(rng, unit.filter((u) => u !== answer));
  const choices = shuffle(rng, [answer, ...wrong].slice(0, Math.min(4, unit.length)));
  return {
    id: id(),
    prompt: `The pattern repeats: ${shown}… What comes next?`,
    answer,
    choices: choices.length > 1 ? choices : [answer, "❓"],
    hint: `The group "${unit.join("")}" repeats over and over.`,
    inputMode: "choices",
    dedupeKey: `pattern-${unit.join("")}`,
  };
}

// A robot repeats a move N times → how far?
function genRobotSteps(params: LoopParams, rng: RNG, ctx: GenContext): Question {
  const stepSize = randInt(rng, 2, ctx.easier ? 3 : 5);
  const times = randInt(rng, 2, ctx.easier ? 4 : (params.maxTimes ?? 6));
  return {
    id: id(),
    prompt: `🤖 repeats "walk ${stepSize} steps" ${times} times. How far does it go?`,
    answer: String(stepSize * times),
    choices: numericChoices(rng, stepSize * times, [stepSize, times, 1]),
    hint: `${stepSize} steps each loop, ${times} loops.`,
    dedupeKey: `robot-${stepSize}x${times}`,
  };
}
