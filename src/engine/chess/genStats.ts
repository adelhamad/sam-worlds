// Diagnostics only: how hard each puzzle generator had to work. Nothing in the
// engine ever reads these counters — scripts/audit-chess.ts prints them.
import type { ChessTask } from "./types";

/** "main" = the asked difficulty, "gentle" = the simpler variant, "floor" = the hand-built last resort. */
export type BuildTier = "main" | "gentle" | "floor";

export interface TaskStats {
  built: number;
  /** Boards sampled, including the rejected ones. */
  tries: number;
  gentle: number;
  floor: number;
}

const STATS = new Map<ChessTask, TaskStats>();

export function recordBuild(task: ChessTask, tries: number, tier: BuildTier): void {
  const stats = STATS.get(task) ?? { built: 0, tries: 0, gentle: 0, floor: 0 };
  stats.built++;
  stats.tries += tries;
  if (tier === "gentle") stats.gentle++;
  if (tier === "floor") stats.floor++;
  STATS.set(task, stats);
}

export function chessGenStats(): ReadonlyMap<ChessTask, TaskStats> {
  return STATS;
}

export function resetChessGenStats(): void {
  STATS.clear();
}
