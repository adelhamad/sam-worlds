// Pins a Chess Camp replacement puzzle to the skill that was just missed
// (answer-integrity rule 1: "new values, same skill").
import type { GeneratorParams, Question } from "../generators/types";
import { chessPayload, type ChessParams, type ChessTask, type PieceType } from "./types";

export interface ChessReplace {
  /** Task of the missed puzzle — the replacement keeps it. */
  task: ChessTask;
  piece: PieceType;
}

/** Stage params plus the optional pin the miss flow adds for a replacement. */
export type ChessSessionParams = ChessParams & { replace?: ChessReplace };

export function chessSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const payload = chessPayload(question);
  if (!payload) return params;
  return { ...params, replace: { task: payload.task, piece: payload.piece } satisfies ChessReplace };
}
