// Diagnostics only: how hard each Code Lab puzzle generator had to work.
// Nothing in the engine ever reads these counters — scripts/audit-code.ts prints them.
import type { CodeTask } from "./types";

/** "main" = the asked difficulty, "gentle" = the simpler variant, "floor" = the hand-built last resort. */
export type BuildTier = "main" | "gentle" | "floor";

export interface TaskStats {
  built: number;
  /** Grids sampled, including the rejected ones. */
  tries: number;
  gentle: number;
  floor: number;
}

const STATS = new Map<CodeTask, TaskStats>();

export function recordBuild(task: CodeTask, tries: number, tier: BuildTier): void {
  const stats = STATS.get(task) ?? { built: 0, tries: 0, gentle: 0, floor: 0 };
  stats.built++;
  stats.tries += tries;
  if (tier === "gentle") stats.gentle++;
  if (tier === "floor") stats.floor++;
  STATS.set(task, stats);
}

export function codeGenStats(): ReadonlyMap<CodeTask, TaskStats> {
  return STATS;
}

export function resetCodeGenStats(): void {
  STATS.clear();
}
