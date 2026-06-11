// The global answer-integrity engine (docs/ANSWER_INTEGRITY.md).
// Every game routes its answer flow through these helpers — no per-game logic.
import type { Question } from "../generators/types";

/**
 * Rule 5: rapid-guess detection. We approximate "answered in under ~2s" with
 * the gap between consecutive wrong answers (the event log keeps full
 * timestamps for Parent Corner).
 */
export function isRapidGuessing(wrongStamps: number[]): boolean {
  if (wrongStamps.length < 3) return false;
  const last = wrongStamps.slice(-3);
  return last[1] - last[0] < 2000 && last[2] - last[1] < 2000;
}

/**
 * Rule 4: accuracy-weighted payout. First-try slots pay 100%, hinted slots 40%;
 * all-first-try is a Perfect Run (bonus + unique fanfare). Replays pay 25% of
 * the weighted amount. Completion always pays at least 1.
 */
export function weightedPayout(
  base: number,
  totalSlots: number,
  missedSlots: number,
  firstCompletion: boolean,
): { amount: number; perfect: boolean } {
  const firstTry = totalSlots - missedSlots;
  const ratio = totalSlots === 0 ? 1 : (firstTry + 0.4 * missedSlots) / totalSlots;
  const perfect = missedSlots === 0;
  let amount = base * ratio;
  if (perfect) amount *= 1.2;
  if (!firstCompletion) amount *= 0.25;
  return { amount: Math.max(1, Math.round(amount)), perfect };
}

/**
 * Rule 3: turn the discarded question into a worked example ("7 + 5 = 12").
 * Returns "" for prompts with no inline equation (simulation/ear questions),
 * where the hint carries the scaffold instead.
 */
export function workedExample(q: Question): string {
  if (q.prompt.includes("▢")) return q.prompt.replace("▢", q.answer);
  if (q.prompt.includes("= ?")) return q.prompt.replace("= ?", `= ${q.answer}`);
  return "";
}

/** How long the input locks after a miss while the hint shows (rule 3). */
export const MISS_LOCK_MS = 2500;
