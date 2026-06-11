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
