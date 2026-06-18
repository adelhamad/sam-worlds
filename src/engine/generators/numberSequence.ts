import { randInt, pick, type RNG } from "../rng";
import { lerp, numericChoices, type GenContext, type Question } from "./types";

export interface SequenceParams {
  /** Allowed pattern kinds. */
  kinds: Array<"step" | "skip" | "alternate" | "double" | "countdown" | "grow">;
  /** Max step size. */
  stepMax: number;
  /** How many terms are shown. */
  length?: number;
  /** "next" asks for the next term; "missing" blanks a middle term. */
  mode?: "next" | "missing";
}

type SeqKind = SequenceParams["kinds"][number];

interface Pattern {
  terms: number[];
  hint: string;
}

let qid = 0;

export function generateNumberSequence(
  params: SequenceParams,
  rng: RNG,
  ctx: GenContext,
): Question {
  const kind: SeqKind = ctx.easier ? "step" : pick(rng, params.kinds);
  const length = params.length ?? 5;
  const stepCap = Math.max(2, Math.round(lerp(2, params.stepMax, ctx.easier ? 0 : ctx.difficulty)));

  const { terms, hint } = buildPattern(kind, params, rng, ctx, length, stepCap);

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
      // Dedupe on the whole sequence + the hidden slot, not the masked prompt.
      dedupeKey: `${kind}|miss${hole}|${terms.join(",")}`,
    };
  }

  const answer = terms[length];
  return {
    id: `s${++qid}`,
    prompt: terms.slice(0, length).join(", ") + ", ?",
    answer: String(answer),
    choices: numericChoices(rng, answer, [1, 2, 5, 10]),
    hint,
    dedupeKey: `${kind}|next|${terms.join(",")}`,
  };
}

function buildPattern(
  kind: SeqKind,
  params: SequenceParams,
  rng: RNG,
  ctx: GenContext,
  length: number,
  stepCap: number,
): Pattern {
  const count = length + 1;
  switch (kind) {
    case "skip":
      return skipPattern(params, rng, count);
    case "alternate":
      return alternatePattern(rng, stepCap, count);
    case "double":
      return doublePattern(rng, count);
    case "countdown":
      return countdownPattern(rng, stepCap, count);
    case "grow":
      return growPattern(rng, count);
    default:
      return stepPattern(rng, ctx, stepCap, count);
  }
}

function skipPattern(params: SequenceParams, rng: RNG, count: number): Pattern {
  const step = pick(rng, [2, 5, 10].filter((s) => s <= Math.max(2, params.stepMax)));
  const start = step * randInt(rng, 1, 5);
  return { terms: seq(start, () => step, count), hint: `It jumps by ${step} each time.` };
}

function alternatePattern(rng: RNG, stepCap: number, count: number): Pattern {
  const s1 = randInt(rng, 1, stepCap);
  const s2 = randInt(rng, 1, stepCap);
  const start = randInt(rng, 1, 10);
  let toggle = true;
  const terms = seq(start, () => {
    const s = toggle ? s1 : s2;
    toggle = !toggle;
    return s;
  }, count);
  return { terms, hint: `Two steps take turns: +${s1}, +${s2}.` };
}

function stepPattern(rng: RNG, ctx: GenContext, stepCap: number, count: number): Pattern {
  const step = randInt(rng, ctx.easier ? 1 : 2, stepCap);
  const start = randInt(rng, 1, 12);
  return { terms: seq(start, () => step, count), hint: `It grows by ${step} each time.` };
}

// Doubling: 2, 4, 8, 16… — start small so the last term stays ≤ 4 digits.
function doublePattern(rng: RNG, count: number): Pattern {
  const cap = Math.floor(9999 / 2 ** (count - 1)); // keeps every term ≤ 4 chars
  const start = randInt(rng, 2, Math.max(2, Math.min(9, cap)));
  let cur = start;
  const terms = seq(start, () => {
    const add = cur; // next = cur + cur = 2·cur
    cur *= 2;
    return add;
  }, count);
  return { terms, hint: "Each number is double the one before." };
}

// Countdown: decreasing by a fixed step; start high enough to never go below 0.
function countdownPattern(rng: RNG, stepCap: number, count: number): Pattern {
  const step = randInt(rng, 1, stepCap);
  const min = step * (count - 1); // last term lands on ≥ 0
  const start = min + step * randInt(rng, 0, 3);
  return { terms: seq(start, () => -step, count), hint: `It counts down by ${step} each time.` };
}

// Growing gaps: 1, 2, 4, 7, 11… — the jump itself grows by 1 each step.
function growPattern(rng: RNG, count: number): Pattern {
  const start = randInt(rng, 1, 6);
  let gap = randInt(rng, 1, 3);
  const terms = seq(start, () => {
    const add = gap;
    gap += 1;
    return add;
  }, count);
  return { terms, hint: "The jump gets one bigger each time." };
}

function seq(start: number, step: () => number, count: number): number[] {
  const out = [start];
  for (let i = 1; i < count; i++) out.push(out[i - 1] + step());
  return out;
}
