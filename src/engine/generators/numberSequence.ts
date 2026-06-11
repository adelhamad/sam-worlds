import { randInt, pick, type RNG } from "../rng";
import { lerp, numericChoices, type GenContext, type Question } from "./types";

export interface SequenceParams {
  /** Allowed pattern kinds. */
  kinds: Array<"step" | "skip" | "alternate">;
  /** Max step size. */
  stepMax: number;
  /** How many terms are shown. */
  length?: number;
  /** "next" asks for the next term; "missing" blanks a middle term. */
  mode?: "next" | "missing";
}

let qid = 0;

export function generateNumberSequence(
  params: SequenceParams,
  rng: RNG,
  ctx: GenContext,
): Question {
  const kind = ctx.easier ? "step" : pick(rng, params.kinds);
  const length = params.length ?? 5;
  const stepCap = Math.max(2, Math.round(lerp(2, params.stepMax, ctx.easier ? 0 : ctx.difficulty)));

  let terms: number[];
  let hint: string;

  if (kind === "skip") {
    const step = pick(rng, [2, 5, 10].filter((s) => s <= Math.max(2, params.stepMax)));
    const start = step * randInt(rng, 1, 5);
    terms = seq(start, () => step, length + 1);
    hint = `It jumps by ${step} each time.`;
  } else if (kind === "alternate") {
    const s1 = randInt(rng, 1, stepCap);
    const s2 = randInt(rng, 1, stepCap);
    const start = randInt(rng, 1, 10);
    let toggle = true;
    terms = seq(start, () => {
      const s = toggle ? s1 : s2;
      toggle = !toggle;
      return s;
    }, length + 1);
    hint = `Two steps take turns: +${s1}, +${s2}.`;
  } else {
    const step = randInt(rng, ctx.easier ? 1 : 2, stepCap);
    const start = randInt(rng, 1, 12);
    terms = seq(start, () => step, length + 1);
    hint = `It grows by ${step} each time.`;
  }

  const mode = ctx.easier ? "next" : (params.mode ?? "next");
  if (mode === "missing") {
    const hole = randInt(rng, 1, length - 1);
    const answer = terms[hole];
    const shown = terms
      .slice(0, length)
      .map((t, i) => (i === hole ? "▢" : String(t)))
      .join(", ");
    return {
      id: `s${++qid}`,
      prompt: shown,
      answer: String(answer),
      choices: numericChoices(rng, answer, [1, 2, 5, 10]),
      hint,
    };
  }

  const answer = terms[length];
  return {
    id: `s${++qid}`,
    prompt: terms.slice(0, length).join(", ") + ", ?",
    answer: String(answer),
    choices: numericChoices(rng, answer, [1, 2, 5, 10]),
    hint,
  };
}

function seq(start: number, step: () => number, count: number): number[] {
  const out = [start];
  for (let i = 1; i < count; i++) out.push(out[i - 1] + step());
  return out;
}
