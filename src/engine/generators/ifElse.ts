// Decision Valley — IF / THEN / ELSE taught through intuitive scenarios and
// simple comparisons, building toward real conditional logic (no syntax soup).
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// IF <condition is true> THEN <action>. Condition is met → do the action.
const RULES: Array<{ rule: string; cond: string; yes: string; no: string }> = [
  { rule: "IF it rains, THEN take an umbrella ☂️.", cond: "It is raining.", yes: "☂️ take an umbrella", no: "🕶️ wear sunglasses" },
  { rule: "IF the light is GREEN, THEN go 🚗.", cond: "The light is GREEN.", yes: "🚗 go", no: "🛑 stop" },
  { rule: "IF you are hungry, THEN eat 🍎.", cond: "You are hungry.", yes: "🍎 eat", no: "😴 sleep" },
  { rule: "IF it is dark, THEN turn on the light 💡.", cond: "It is dark.", yes: "💡 turn on the light", no: "🔌 turn it off" },
  { rule: "IF the floor is wet, THEN walk slowly 🐌.", cond: "The floor is wet.", yes: "🐌 walk slowly", no: "🏃 run fast" },
];

// IF cond THEN a ELSE b — condition can be TRUE or FALSE.
const BRANCHES: Array<{ ifTrue: string; thenA: string; elseB: string; trueText: string; falseText: string }> = [
  { ifTrue: "sunny", thenA: "🏖️ play outside", elseB: "🏠 play inside", trueText: "It is sunny.", falseText: "It is raining." },
  { ifTrue: "weekend", thenA: "😴 sleep in", elseB: "🎒 go to school", trueText: "It is Saturday.", falseText: "It is Monday." },
  { ifTrue: "the door is locked", thenA: "🔑 use the key", elseB: "🚪 just walk in", trueText: "The door is locked.", falseText: "The door is open." },
  { ifTrue: "you finished homework", thenA: "🎮 play games", elseB: "📚 do homework", trueText: "Homework is done.", falseText: "Homework is not done." },
];

export interface IfElseParams {
  types: Array<"rule" | "branch" | "compare">;
}

let qid = 0;
const id = () => `ie${++qid}`;

export function generateIfElse(params: IfElseParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "branch") return genBranch(rng);
  if (type === "compare") return genCompare(rng, ctx);
  return genRule(rng);
}

function genRule(rng: RNG): Question {
  const r = pick(rng, RULES);
  // condition is always met in this simple form → do the action
  return {
    id: id(),
    prompt: `${r.rule}\n${r.cond} What do you do?`,
    answer: r.yes,
    choices: shuffle(rng, [r.yes, r.no]),
    hint: "The IF part is TRUE, so follow the THEN.",
    inputMode: "choices",
    dedupeKey: `rule-${r.rule}`,
  };
}

function genBranch(rng: RNG): Question {
  const b = pick(rng, BRANCHES);
  const isTrue = rng() < 0.5;
  const fact = isTrue ? b.trueText : b.falseText;
  return {
    id: id(),
    prompt: `IF ${b.ifTrue} → ${b.thenA}, ELSE → ${b.elseB}.\n${fact} What happens?`,
    answer: isTrue ? b.thenA : b.elseB,
    choices: shuffle(rng, [b.thenA, b.elseB]),
    hint: isTrue ? "The IF is TRUE → use THEN." : "The IF is FALSE → use ELSE.",
    inputMode: "choices",
    dedupeKey: `branch-${b.ifTrue}-${isTrue}`,
  };
}

function genCompare(rng: RNG, ctx: GenContext): Question {
  const max = ctx.easier ? 10 : 20;
  const threshold = randInt(rng, 3, max - 2);
  const value = randInt(rng, 1, max);
  // IF number > threshold THEN "BIG" ELSE "small"
  const isBig = value > threshold;
  return {
    id: id(),
    prompt: `IF the number > ${threshold} say BIG, ELSE say small.\nThe number is ${value}. What do you say?`,
    answer: isBig ? "BIG" : "small",
    choices: shuffle(rng, ["BIG", "small"]),
    hint: `Is ${value} bigger than ${threshold}?`,
    inputMode: "choices",
    dedupeKey: `cmp-${threshold}-${value}`,
  };
}
