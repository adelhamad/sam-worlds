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
import { generateMultiplyMaster, type MultParams } from "./multiplyMaster";
import { generateBinary, type BinaryParams } from "./binary";
import { generateFractions, type FractionParams } from "./fractions";
import { generateElements, type ElementParams } from "./elements";
import { generateSpace, type SpaceParams } from "./space";
import { generateDinos, type DinoParams } from "./dinos";
import { generateWeather, type WeatherParams } from "./weather";
import { generatePhonics, type PhonicsParams } from "./phonics";
import { generateIdioms, type IdiomParams } from "./idioms";
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
  | "measure"
  | "multiplyMaster"
  | "binary"
  | "fractions"
  | "elements"
  | "space"
  | "dinos"
  | "weather"
  | "phonics"
  | "idioms";

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
  multiplyMaster: cast<MultParams>(generateMultiplyMaster),
  binary: cast<BinaryParams>(generateBinary),
  fractions: cast<FractionParams>(generateFractions),
  elements: cast<ElementParams>(generateElements),
  space: cast<SpaceParams>(generateSpace),
  dinos: cast<DinoParams>(generateDinos),
  weather: cast<WeatherParams>(generateWeather),
  phonics: cast<PhonicsParams>(generatePhonics),
  idioms: cast<IdiomParams>(generateIdioms),
};

function dispatch(id: GeneratorId, params: GeneratorParams, rng: () => number, ctx: GenContext): Question {
  return GENERATORS[id](params, rng, ctx);
}

/**
 * The thing that makes one question genuinely the same as another: the
 * generator's own `dedupeKey` when it sets one (the real subject — a note, a
 * maze, a word), otherwise the full visible content (prompt + answer + payload
 * + choices). A generic prompt like "Read the note!" therefore does NOT count
 * as a repeat as long as the note behind it differs.
 */
function questionKey(q: Question): string {
  if (q.dedupeKey) return q.dedupeKey;
  const payload = q.payload ? JSON.stringify(q.payload) : "";
  const choices = q.choices.length ? q.choices.join(",") : "";
  return `${q.prompt}|${q.answer}|${payload}|${choices}`;
}

/**
 * Generate a fresh question set with NO repeats within the stage. Draws until
 * it has `count` distinct questions; if the generator's pool is smaller than
 * `count`, the stage simply runs shorter rather than ever repeating a question.
 */
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
  // Stop once the pool looks exhausted: a long run of consecutive draws that
  // are all duplicates means there's nothing new left to find.
  let sinceNew = 0;
  const giveUpAfter = Math.max(120, count * 40);
  while (out.length < count && sinceNew < giveUpAfter) {
    const q = dispatch(id, params, rng, ctx);
    const key = questionKey(q);
    if (seen.has(key)) {
      sinceNew++;
      continue;
    }
    seen.add(key);
    sinceNew = 0;
    out.push({ ...q, id: `${id}-${seed}-${out.length}` });
  }
  return out;
}
