// Calendar Quest — days of the week, months of the year, ordering time, and
// calendar facts. Matching, ordering, and counting.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// [question, answer] — calendar counting facts
const COUNT: Array<[string, number]> = [
  ["How many days are in a week?", 7],
  ["How many months are in a year?", 12],
  ["How many seasons are in a year?", 4],
  ["How many days are in a year?", 365],
  ["How many days are in a weekend?", 2],
];

// [question, answer, wrongs] — month & season facts
const FACTS: Array<[string, string, string[]]> = [
  ["Which month comes first in the year?", "January", ["December", "June", "March"]],
  ["Which month is last in the year?", "December", ["January", "November", "October"]],
  ["Which month comes right after May?", "June", ["April", "July", "March"]],
  ["Which month comes right before September?", "August", ["October", "July", "November"]],
  ["Which months are in winter (cold)?", "December, January, February", ["June, July, August", "March, April, May", "September, October"]],
  ["Which day is a school day?", "Wednesday", ["Saturday", "Sunday", "no day"]],
  ["Which days are the weekend?", "Saturday and Sunday", ["Monday and Tuesday", "Wednesday and Thursday", "every day"]],
];

export interface CalendarParams {
  types: Array<"next" | "order" | "fact" | "count">;
}

let qid = 0;
const id = () => `cl${++qid}`;

function pickChoices(rng: RNG, answer: string, pool: string[]): string[] {
  const wrong = shuffle(rng, pool.filter((x) => x !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

function genNext(rng: RNG): Question {
  const useMonth = rng() < 0.4;
  const list = useMonth ? MONTHS : DAYS;
  const i = 1 + Math.floor(rng() * (list.length - 2)); // keep a neighbor on both sides
  const after = rng() < 0.5;
  const answer = after ? list[i + 1] : list[i - 1];
  const word = useMonth ? "month" : "day";
  return {
    id: id(),
    prompt: after ? `Which ${word} comes right after ${list[i]}?` : `Which ${word} comes right before ${list[i]}?`,
    answer,
    choices: pickChoices(rng, answer, list),
    hint: useMonth ? "Say the months in order in your head." : "Say the days in order: Monday, Tuesday…",
    inputMode: "choices",
    dedupeKey: `next-${list[i]}-${after}`,
  };
}

function genOrder(rng: RNG): Question {
  const useMonth = rng() < 0.5;
  const list = useMonth ? MONTHS : DAYS;
  const start = Math.floor(rng() * (list.length - 3));
  const seq = list.slice(start, start + 3);
  return {
    id: id(),
    prompt: useMonth ? "Put these months in order!" : "Put these days in order!",
    answer: seq.join(" → "),
    choices: [],
    hint: `Which one comes first?`,
    inputMode: "order",
    dedupeKey: `order-${useMonth ? "m" : "d"}-${start}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}

function genFact(rng: RNG): Question {
  const [p, a, w] = pick(rng, FACTS);
  return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about the calendar.", inputMode: "choices", dedupeKey: `fact-${p}` };
}

function genCount(rng: RNG): Question {
  const [p, n] = pick(rng, COUNT);
  return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Count them out.", dedupeKey: `count-${p}` };
}

export function generateCalendar(params: CalendarParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "order":
      return genOrder(rng);
    case "fact":
      return genFact(rng);
    case "count":
      return genCount(rng);
    default:
      return genNext(rng);
  }
}
