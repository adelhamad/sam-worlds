import { ADAPTATIONS, OBSERVATIONS } from "../../content/traits/examples";
import { STR } from "../../strings/en";
import type { Question } from "./types";

const adaptations = new Set(ADAPTATIONS.map((item) => item.id));
const observations = new Map(OBSERVATIONS.map((item) => [item.id, item.kind]));
const conceptLabels: Readonly<Record<string, { title: string; explanation: string }>> = STR.traits.questionConceptLabels;

/** Classify the active task without changing a saved question or revealing its answer. */
export function traitQuestionLabel(question: Question): { title: string; explanation: string } | undefined {
  const [world, mode, id, otherId] = question.dedupeKey?.split(":") ?? [];
  if (world !== "traits") return undefined;
  if (mode === "concept") return Object.hasOwn(conceptLabels, id) ? conceptLabels[id] : undefined;
  if (mode === "origin") {
    const kind = observations.get(id);
    return kind ? STR.traits.questionOriginLabels[kind] : undefined;
  }
  if (!adaptations.has(id)) return undefined;
  if (mode === "pair") return adaptations.has(otherId) ? STR.traits.questionAdaptationLabels.pair : undefined;
  if (mode === "spot" || mode === "job" || mode === "feature") return STR.traits.questionAdaptationLabels[mode];
  return undefined;
}
