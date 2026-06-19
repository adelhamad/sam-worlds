// Calm Corner — mindfulness and calming-down strategies (distinct from Feelings
// Forest, which is naming emotions). Gentle, never preachy.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

type QA = [string, string, string[]];

// what to do with a big feeling
const CALM: QA[] = [
  ["You feel really angry. A good thing to do is…", "take slow, deep breaths", ["hit something", "yell at a friend", "throw your toys"]],
  ["You feel worried about something. You could…", "talk to a grown-up you trust", ["keep it secret and worry", "pretend you're fine", "stay up all night"]],
  ["A puzzle is frustrating you. The best idea is…", "take a short break, then try again", ["give up forever", "rip it up", "scream"]],
  ["You feel super wiggly and excited. You can…", "take a quiet, calm moment", ["push other kids", "shout as loud as you can", "run around wildly"]],
  ["A friend looks sad. A kind thing to do is…", "listen and be gentle", ["laugh at them", "ignore them", "walk away"]],
  ["You made a mistake. Remember…", "it's okay — everyone makes mistakes", ["you should give up", "you must be perfect", "you're no good"]],
  ["Before bed, a calm thing to do is…", "read a quiet story", ["watch a scary show", "run laps", "drink lots of soda"]],
];

// mindful facts
const FACTS: QA[] = [
  ["Slow, deep breathing helps your body feel…", "calm", ["angry", "scared", "wild"]],
  ["A simple breathing trick is to smell the flower and blow out the…", "candle", ["fire", "window", "door"]],
  ["To calm down, you can slowly count to…", "ten", ["a million", "zero", "one"]],
  ["Having big feelings sometimes is…", "totally okay and normal", ["bad and wrong", "only for babies", "never allowed"]],
  ["When you feel calm, your breathing becomes…", "slow and steady", ["fast and puffy", "loud and shaky", "stopped"]],
  ["A good way to feel grateful is to think of something that made you…", "happy today", ["angry", "scared", "bored"]],
];

export interface CalmParams {
  types: Array<"calm" | "fact">;
}

let qid = 0;
const id = () => `cm${++qid}`;

export function generateCalm(params: CalmParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [p, a, w] = pick(rng, type === "fact" ? FACTS : CALM);
  return {
    id: id(),
    prompt: p,
    answer: a,
    choices: shuffle(rng, [a, ...w]),
    hint: "Pick the calm, kind choice.",
    inputMode: "choices",
    dedupeKey: `${type}-${p}`,
  };
}
