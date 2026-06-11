// Stars come from FIRST-TRY accuracy only (answer-integrity rule 4),
// never speed, and never block progress. Payout lives in engine/answers.
export function starsForResult(totalQuestions: number, firstTryMisses: number): 1 | 2 | 3 {
  if (firstTryMisses === 0) return 3;
  if (firstTryMisses <= Math.max(2, Math.floor(totalQuestions * 0.2))) return 2;
  return 1;
}
