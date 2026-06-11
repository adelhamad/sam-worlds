import type { GeneratorId } from "../engine/generators";
import type { GeneratorParams } from "../engine/generators/types";

export interface StageDef {
  id: string;
  name: string;
  generator: GeneratorId;
  params: GeneratorParams;
  questions: number;
  mechanic: "gate-run";
  payout: number;
  /** Skill family for adaptive difficulty (defaults to generator id). */
  skill?: string;
  /** Tutorial card lines shown when the stage starts (≤8 simple words each). */
  intro?: string[];
}
