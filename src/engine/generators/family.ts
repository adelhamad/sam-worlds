// Family Tree — family relationships, from parents and siblings to grandparents
// and cousins.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [question, answer, wrongs] — close family
const CLOSE: Array<[string, string, string[]]> = [
  ["Your mom and dad together are your…", "parents", ["cousins", "neighbors", "teachers"]],
  ["A boy with the same parents as you is your…", "brother", ["uncle", "cousin", "friend"]],
  ["A girl with the same parents as you is your…", "sister", ["aunt", "niece", "cousin"]],
  ["The grown-up woman who is your parent is your…", "mother", ["aunt", "sister", "grandma"]],
  ["The grown-up man who is your parent is your…", "father", ["uncle", "brother", "grandpa"]],
  ["You and your brothers and sisters are…", "siblings", ["cousins", "parents", "twins"]],
];

// [question, answer, wrongs] — extended family
const EXTENDED: Array<[string, string, string[]]> = [
  ["Your mother's mother is your…", "grandmother", ["aunt", "sister", "cousin"]],
  ["Your father's father is your…", "grandfather", ["uncle", "brother", "cousin"]],
  ["Your mother's sister is your…", "aunt", ["grandmother", "cousin", "niece"]],
  ["Your father's brother is your…", "uncle", ["grandfather", "cousin", "nephew"]],
  ["Your aunt and uncle's child is your…", "cousin", ["brother", "sister", "parent"]],
  ["Grandma and Grandpa together are your…", "grandparents", ["parents", "cousins", "siblings"]],
  ["Your uncle's daughter is your…", "cousin", ["sister", "aunt", "niece"]],
];

export interface FamilyParams {
  types: Array<"close" | "extended">;
}

let qid = 0;
const id = () => `fm${++qid}`;

export function generateFamily(params: FamilyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const pool = type === "extended" ? EXTENDED : CLOSE;
  const [p, a, w] = pick(rng, pool);
  return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about your family tree.", inputMode: "choices", dedupeKey: `${type}-${p}` };
}
