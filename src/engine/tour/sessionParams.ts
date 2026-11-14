// Pins a World Tour replacement question to the skill that was just missed.
// Answer-integrity rule 1 says "new values, same skill": the replacement keeps
// the missed question's exercise kind but moves to a different country.
import type { GeneratorParams, Question } from "../generators/types";
import { tourPayload, type TourKind, type TourParams } from "./types";

export interface TourReplace {
  /** Exercise kind of the missed question. */
  kind: TourKind;
  /** Countries the missed question was about. */
  avoid: string[];
}

/** Stage params plus the optional pin the miss flow adds for a replacement. */
export type TourSessionParams = TourParams & { replace?: TourReplace };

export function tourSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const payload = tourPayload(question);
  if (!payload) return params;
  return { ...params, replace: { kind: payload.tour, avoid: [...payload.codes] } satisfies TourReplace };
}
