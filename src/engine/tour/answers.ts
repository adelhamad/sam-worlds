// Canonical answer strings for World Tour exercises. The planner uses these to
// set `question.answer`; the widgets use the SAME helpers to serialise what the
// child built, so the shared answer engine can judge with plain equality.

/** Letters only, upper-case: "Saudi Arabia" → "SAUDIARABIA". */
export function lettersOf(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]/g, "");
}

/** build: the tiles the child placed, in order. */
export function buildAnswer(tiles: string[]): string {
  return tiles.join("").toUpperCase();
}

/** pairs: every left card matched. Order-independent. */
export function pairsAnswer(matchedLeftCodes: string[]): string {
  return `pairs:${[...matchedLeftCodes].sort().join("+")}`;
}

/** pairs: a mismatch — never equals a real answer, so it scores as a miss. */
export function pairsMiss(leftCode: string, rightCode: string): string {
  return `miss:${leftCode}>${rightCode}`;
}

/** sort: bucket → codes. Buckets keep payload order; codes sort A→Z. */
export function sortAnswer(buckets: string[], placed: Record<string, string>): string {
  return buckets
    .map((bucket) => {
      const codes = Object.keys(placed).filter((code) => placed[code] === bucket).sort();
      return `${bucket}:${codes.join(",")}`;
    })
    .join("|");
}

/** paint: one colour id per band, first band first. */
export function paintAnswer(colors: string[]): string {
  return colors.join(",");
}
