// Editorial exclusions: an alternate trait/job link is genuinely useful even
// when it does not produce a second complete four-card ordering.
const OVERLAPPING_PAIRS = new Set([
  ["red-mangrove-roots", "black-mangrove-roots"].sort().join(":"),
  ["elephant-trunk", "giraffe-neck"].sort().join(":"),
  ["octopus-suckers", "gecko-pads"].sort().join(":"),
  ["bromeliad-cup", "staghorn-fronds"].sort().join(":"),
]);

export function overlappingTraits(firstId: string, secondId: string): boolean {
  return OVERLAPPING_PAIRS.has([firstId, secondId].sort().join(":"));
}
