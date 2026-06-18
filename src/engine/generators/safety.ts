// Safety Squad — everyday safety: roads, strangers, emergencies, and gear.
// Common-sense rules a kid should know. Situational matching.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

type QA = [string, string, string[]];

const ROAD: QA[] = [
  ["Before you cross the road, you should…", "stop and look both ways", ["run across fast", "close your eyes", "walk with your head down"]],
  ["Where is the safest place to cross?", "at the crossing with a grown-up", ["between parked cars", "in the middle of the road", "anywhere you like"]],
  ["When you ride in a car, you must…", "wear your seatbelt", ["stand up", "open the door", "lean out the window"]],
  ["A traffic light is red. You should…", "stop and wait", ["go fast", "skip across", "ignore it"]],
  ["When you ride a scooter near roads, you…", "stay on the path, away from cars", ["ride in the road", "race the cars", "close your eyes"]],
  ["The green light for walking means…", "it's okay to cross carefully", ["run into the road", "stand still forever", "lie down"]],
];

const STRANGER: QA[] = [
  ["A stranger offers you candy to go with them. You…", "say no and find a grown-up you trust", ["go with them", "take the candy", "keep it a secret"]],
  ["If you get lost in a store, you should…", "find a worker or a mom with kids for help", ["leave the store alone", "hide quietly", "go to the parking lot"]],
  ["A stranger asks you to keep a secret from your parents. You…", "tell your parents right away", ["keep the secret", "do what they say", "say nothing"]],
  ["Someone you don't know offers a ride. You…", "say no and tell a grown-up", ["hop in", "go just this once", "give them your address"]],
  ["If a person makes you feel scared or unsafe, you…", "say NO, get away, and tell an adult", ["stay quiet", "go along with it", "keep it to yourself"]],
];

const EMERGENCY: QA[] = [
  ["There is a fire. What do you do?", "get outside and call for help", ["hide under the bed", "grab your toys first", "open the hot door"]],
  ["In a real emergency, what number do you call?", "911", ["123", "your friend", "no one"]],
  ["Your clothes catch fire. You should…", "stop, drop, and roll", ["run around", "wave your arms", "blow on it"]],
  ["You smell smoke at home. You…", "tell a grown-up and get out", ["keep playing", "go look for the fire", "take a nap"]],
  ["Someone is badly hurt and no adult is near. You…", "call 911 for help", ["wait and see", "do nothing", "run away"]],
];

const GEAR: QA[] = [
  ["When you ride a bike, you should wear a…", "helmet", ["crown", "hat", "nothing"]],
  ["At the swimming pool, you should…", "swim where a grown-up can see you", ["dive in a shallow end", "swim alone far away", "push friends in"]],
  ["Medicine should only be taken…", "when a grown-up gives it to you", ["whenever you want", "if it looks like candy", "to share with friends"]],
  ["You should NOT touch…", "a hot stove or oven", ["your toys", "your book", "a soft pillow"]],
  ["Plugs and electric sockets are…", "not for playing with", ["fun to poke", "good for toys", "snack holders"]],
  ["When using scissors, you should…", "cut carefully, away from your body", ["run with them", "point them at friends", "swing them around"]],
];

export interface SafetyParams {
  types: Array<"road" | "stranger" | "emergency" | "gear">;
}

let qid = 0;
const id = () => `sf${++qid}`;

function qa(rng: RNG, prompt: string, answer: string, wrong: string[], hint: string, dedupe: string): Question {
  return { id: id(), prompt, answer, choices: shuffle(rng, [answer, ...wrong]), hint, inputMode: "choices", dedupeKey: dedupe };
}

const SAFETY_POOLS = { road: ROAD, stranger: STRANGER, emergency: EMERGENCY, gear: GEAR };

export function generateSafety(params: SafetyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [p, a, w] = pick(rng, SAFETY_POOLS[type]);
  return qa(rng, p, a, w, "Think: which choice keeps you safe?", `${type}-${p}`);
}
