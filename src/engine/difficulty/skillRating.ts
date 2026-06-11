// Per-skill (per generator family) rating, 0–100. Elo-lite: success nudges
// params up within the stage band, misses nudge down. Never blocks progress.
export const DEFAULT_RATING = 35;

export function updateRating(rating: number, correct: boolean): number {
  const next = correct ? rating + 4 : rating - 5;
  return Math.min(100, Math.max(0, next));
}

/** Maps a rating to a 0..1 position inside the stage's difficulty band. */
export function difficultyFromRating(rating: number): number {
  return Math.min(1, Math.max(0, rating / 100));
}

/**
 * Difficulty a stage actually runs at. The LADDER leads (later stages are
 * reliably harder by position) and the adaptive rating only nudges ±, so the
 * step from level to level is always felt — no flat stretches.
 * @param stageProgress 0..1 position of the stage within its world.
 */
export function stageDifficulty(stageProgress: number, rating: number): number {
  const ladder = Math.min(1, Math.max(0, stageProgress));
  const adapt = (difficultyFromRating(rating) - 0.5) * 0.4; // ±0.2 nudge
  return Math.min(1, Math.max(0, ladder + adapt));
}
