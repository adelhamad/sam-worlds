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
  | "flags";

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
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const q = dispatch(id, params, rng, ctx);
    const key = q.prompt + q.answer;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...q, id: `${id}-${seed}-${out.length}` });
  }
  // Narrow bands (e.g. a single times-table) can run out of unique prompts —
  // top up with repeats rather than shipping a short set.
  while (out.length < count) {
    const q = dispatch(id, params, rng, ctx);
    out.push({ ...q, id: `${id}-${seed}-${out.length}` });
  }
  return out;
}
