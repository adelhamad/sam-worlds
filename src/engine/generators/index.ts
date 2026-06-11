import { mulberry32 } from "../rng";
import { generateArithmetic, type ArithmeticParams } from "./arithmetic";
import { generateNumberSequence, type SequenceParams } from "./numberSequence";
import { generateMelody, type MelodyParams } from "./melody";
import { generateLogicCircuit, type LogicParams } from "./logicCircuit";
import { generateRobotMaze, type RobotParams } from "./robotMaze";
import { generateClock, type ClockParams } from "./clock";
import { generateCipher, type CipherParams } from "./cipher";
import { generateBuilder, type BuilderParams } from "./builder";
import { generateLiving, type LivingParams } from "./livingChain";
import { generateAtlas, type AtlasParams } from "./atlas";
import { generateFlags, type FlagsParams } from "./flags";
import { generateArabic, type ArabicParams } from "./arabic";
import { generateCraft, type CraftParams } from "./craft";
import { generateWordWizard, type WordParams } from "./wordWizard";
import { generateBody, type BodyParams } from "./body";
import { generateFeelings, type FeelingsParams } from "./feelings";
import { generateAffix, type AffixParams } from "./affix";
import { generateGrammar, type GrammarParams } from "./grammar";
import type { GenContext, GeneratorParams, Question } from "./types";

export type GeneratorId =
  | "arithmetic"
  | "numberSequence"
  | "melody"
  | "logicCircuit"
  | "robotMaze"
  | "clock"
  | "cipher"
  | "builder"
  | "living"
  | "atlas"
  | "flags"
  | "arabic"
  | "craft"
  | "wordWizard"
  | "body"
  | "feelings"
  | "affix"
  | "grammar";

function dispatch(id: GeneratorId, params: GeneratorParams, rng: () => number, ctx: GenContext): Question {
  switch (id) {
    case "arithmetic":
      return generateArithmetic(params as unknown as ArithmeticParams, rng, ctx);
    case "numberSequence":
      return generateNumberSequence(params as unknown as SequenceParams, rng, ctx);
    case "melody":
      return generateMelody(params as unknown as MelodyParams, rng, ctx);
    case "logicCircuit":
      return generateLogicCircuit(params as unknown as LogicParams, rng, ctx);
    case "robotMaze":
      return generateRobotMaze(params as unknown as RobotParams, rng, ctx);
    case "clock":
      return generateClock(params as unknown as ClockParams, rng, ctx);
    case "cipher":
      return generateCipher(params as unknown as CipherParams, rng, ctx);
    case "builder":
      return generateBuilder(params as unknown as BuilderParams, rng, ctx);
    case "living":
      return generateLiving(params as unknown as LivingParams, rng, ctx);
    case "atlas":
      return generateAtlas(params as unknown as AtlasParams, rng, ctx);
    case "flags":
      return generateFlags(params as unknown as FlagsParams, rng, ctx);
    case "arabic":
      return generateArabic(params as unknown as ArabicParams, rng, ctx);
    case "craft":
      return generateCraft(params as unknown as CraftParams, rng, ctx);
    case "wordWizard":
      return generateWordWizard(params as unknown as WordParams, rng, ctx);
    case "body":
      return generateBody(params as unknown as BodyParams, rng, ctx);
    case "feelings":
      return generateFeelings(params as unknown as FeelingsParams, rng, ctx);
    case "affix":
      return generateAffix(params as unknown as AffixParams, rng, ctx);
    case "grammar":
      return generateGrammar(params as unknown as GrammarParams, rng, ctx);
  }
}

/** Generate a fresh question set; avoids duplicate prompts within a session. */
export function generateQuestionSet(
  id: GeneratorId,
  params: GeneratorParams,
  count: number,
  seed: number,
  ctx: GenContext,
): Question[] {
  const rng = mulberry32(seed);
  const out: Question[] = [];
  const seenPrompt = new Set<string>();
  let guard = 0;
  // Dedupe by PROMPT (not prompt+answer) so a stage never asks the same
  // question twice — each slot is a genuinely different subject.
  while (out.length < count && guard++ < count * 40) {
    const q = dispatch(id, params, rng, ctx);
    const key = q.dedupeKey ?? q.prompt;
    if (seenPrompt.has(key)) continue;
    seenPrompt.add(key);
    out.push({ ...q, id: `${id}-${seed}-${out.length}` });
  }
  // Last resort for genuinely tiny pools: allow a repeat subject but never two
  // identical (prompt+answer).
  const seenFull = new Set(out.map((q) => q.prompt + q.answer));
  guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const q = dispatch(id, params, rng, ctx);
    const full = q.prompt + q.answer;
    if (seenFull.has(full)) continue;
    seenFull.add(full);
    out.push({ ...q, id: `${id}-${seed}-${out.length}` });
  }
  // If the pool truly can't fill `count` with distinct questions (e.g. a
  // single-switch tutorial circuit), it's better to run a SHORTER stage than
  // to repeat the same question many times. Floor at MIN_QUESTIONS so a stage
  // is never trivially tiny.
  const MIN_QUESTIONS = Math.min(count, 4);
  while (out.length < MIN_QUESTIONS) {
    out.push({ ...dispatch(id, params, rng, ctx), id: `${id}-${seed}-${out.length}` });
  }
  return out;
}
