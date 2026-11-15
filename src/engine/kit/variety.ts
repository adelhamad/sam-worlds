// How many genuinely different questions a template can produce. Used by the
// planner (so a lesson does not lean on a thin template more often than it can
// carry) and by scripts/audit-kit.ts (every template must reach VARIETY_MIN).
import type { GenContext } from "../generators/types";
import { orderSize, pairsSize, pickSize, sortSize } from "./sample";
import type { KitTemplate, SortTemplate } from "./types";

/** The count is capped here: past this a template is "plenty". */
export const VARIETY_CAP = 50;
/** Every template should offer at least this many distinct samples. */
export const VARIETY_MIN = 6;
/** The sizes a template is measured at (a mid-lesson slot, not easier). */
export const DEFAULT_CTX: GenContext = { difficulty: 0.5, easier: false };

/** n choose k, capped (exact below the cap). */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) {
    out = (out * (n - Math.min(k, n - k) + i)) / i;
    if (out > VARIETY_CAP * 1000) return out;
  }
  return Math.round(out);
}

/** Card sets with at least one card in every bucket (inclusion–exclusion over empty buckets). */
function sortVariety(template: SortTemplate, size: number): number {
  const counts = template.buckets.map((entry) => entry.items.length);
  if (counts.length < 2) return 0;
  const total = counts.reduce((sum, n) => sum + n, 0);
  const cards = Math.min(Math.max(size, counts.length), total);
  let out = 0;
  for (let mask = 0; mask < 1 << counts.length; mask++) {
    const missing = counts.filter((_, index) => mask & (1 << index));
    const left = total - missing.reduce((sum, n) => sum + n, 0);
    out += (missing.length % 2 ? -1 : 1) * choose(left, cards);
  }
  return out;
}

/** Distinct samples (by fingerprint) `template` can produce at the sizes of `ctx`. */
export function varietyAt(template: KitTemplate, ctx: GenContext): number {
  switch (template.kind) {
    case "pick": {
      const distractors = Math.min(pickSize(template, ctx) - 1, template.wrong.length);
      return template.right.length * choose(template.wrong.length, distractors);
    }
    case "pairs": return choose(template.pairs.length, pairsSize(template, ctx));
    case "order": {
      const size = orderSize(ctx);
      return template.sequences.reduce((sum, steps) => sum + (steps.length > size ? choose(steps.length, size) : 1), 0);
    }
    case "sort": return sortVariety(template, sortSize(ctx));
    case "build": return template.sentences.length;
    default: return template.variants.length;
  }
}

/** How many distinct samples (by fingerprint) the template can produce at the default sizes, capped at 50. */
export function templateVariety(template: KitTemplate): number {
  return Math.min(VARIETY_CAP, Math.max(0, varietyAt(template, DEFAULT_CTX)));
}
