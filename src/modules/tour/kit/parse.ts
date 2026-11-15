// Read canonical kit answers back (for the teach cards). The inverse of the
// serialisers in engine/kit/answers.ts; tolerant of anything unexpected.
import type { KitItem } from "../../../engine/kit/types";

/** orderAnswer → ids, first first. */
export function parseOrder(answer: string): string[] {
  return answer ? answer.split(">") : [];
}

/** sortAnswer → bucket id → card ids. */
export function parseSort(answer: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const part of answer.split("|")) {
    const at = part.indexOf(":");
    if (at <= 0) continue;
    const ids = part.slice(at + 1);
    out.set(part.slice(0, at), ids ? ids.split(",") : []);
  }
  return out;
}

/** pairsMiss → { left, right } (null for anything else). */
export function parseMiss(submitted: string | undefined): { left: string; right: string } | null {
  const match = /^miss:([^>]+)>(.+)$/.exec(submitted ?? "");
  return match ? { left: match[1], right: match[2] } : null;
}

export function byId(items: KitItem[]): Map<string, KitItem> {
  return new Map(items.map((item) => [item.id, item]));
}
