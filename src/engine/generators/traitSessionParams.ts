import legacyStages from "../../content/traits/legacyStages.json";
import type { GeneratorParams, Question } from "./types";

/** A saved legacy session keeps its original pool even after the curriculum changes.
 * The question token is the persisted generation contract; no new save field needed. */
export function traitSessionParams(stageId: string, question: Question, params: GeneratorParams): GeneratorParams {
  if (!question.dedupeKey?.startsWith("traits:")) return params;
  return legacyStages.find((stage) => stage.id === stageId)?.params ?? params;
}
