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
import { generatePrepositions, type PrepositionParams } from "./prepositions";
import { generateDirections, type DirectionParams } from "./directions";
import { generatePhysics, type PhysicsParams } from "./physics";
import { generateChemistry, type ChemistryParams } from "./chemistry";
import { generateAlgebra, type AlgebraParams } from "./algebra";
import { generatePlaceValue, type PlaceValueParams } from "./placeValue";
import { generateMoney, type MoneyParams } from "./money";
import { generateShapes, type ShapeParams } from "./shapes";
import { generateMeasure, type MeasureParams } from "./measure";
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
  | "grammar"
  | "prepositions"
  | "directions"
  | "physics"
  | "chemistry"
  | "algebra"
  | "placeValue"
  | "money"
  | "shapes"
  | "measure";

/** Generator registry — one entry per id (params are cast per generator). */
type GenFn = (params: GeneratorParams, rng: () => number, ctx: GenContext) => Question;
const cast = <P>(fn: (p: P, rng: () => number, ctx: GenContext) => Question): GenFn =>
  (params, rng, ctx) => fn(params as unknown as P, rng, ctx);

const GENERATORS: Record<GeneratorId, GenFn> = {
  arithmetic: cast<ArithmeticParams>(generateArithmetic),
  numberSequence: cast<SequenceParams>(generateNumberSequence),
  melody: cast<MelodyParams>(generateMelody),
  logicCircuit: cast<LogicParams>(generateLogicCircuit),
  robotMaze: cast<RobotParams>(generateRobotMaze),
  clock: cast<ClockParams>(generateClock),
  cipher: cast<CipherParams>(generateCipher),
  builder: cast<BuilderParams>(generateBuilder),
  living: cast<LivingParams>(generateLiving),
  atlas: cast<AtlasParams>(generateAtlas),
  flags: cast<FlagsParams>(generateFlags),
  arabic: cast<ArabicParams>(generateArabic),
  craft: cast<CraftParams>(generateCraft),
  wordWizard: cast<WordParams>(generateWordWizard),
  body: cast<BodyParams>(generateBody),
  feelings: cast<FeelingsParams>(generateFeelings),
  affix: cast<AffixParams>(generateAffix),
  grammar: cast<GrammarParams>(generateGrammar),
  prepositions: cast<PrepositionParams>(generatePrepositions),
  directions: cast<DirectionParams>(generateDirections),
  physics: cast<PhysicsParams>(generatePhysics),
  chemistry: cast<ChemistryParams>(generateChemistry),
  algebra: cast<AlgebraParams>(generateAlgebra),
  placeValue: cast<PlaceValueParams>(generatePlaceValue),
  money: cast<MoneyParams>(generateMoney),
  shapes: cast<ShapeParams>(generateShapes),
  measure: cast<MeasureParams>(generateMeasure),
};

function dispatch(id: GeneratorId, params: GeneratorParams, rng: () => number, ctx: GenContext): Question {
  return GENERATORS[id](params, rng, ctx);
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
