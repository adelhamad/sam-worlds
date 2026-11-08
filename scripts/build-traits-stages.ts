// Authoring tool: review the resulting data before publishing. Never run this
// to rename or reorder IDs in a released world; saves refer to those IDs.
import { ADAPTATIONS, OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import { overlappingTraits } from "../src/content/traits/pairing";
import { STR } from "../src/strings/en";
import { mulberry32, shuffle } from "../src/engine/rng";
import type { StageDef } from "../src/content/types";

const stages: StageDef[] = [];
function chapter(name: string, items: string[], intro: string[], skill: string): void {
  if (items.length < 12) throw new Error(`${name}: needs six tasks plus six fresh replacements`);
  const number = stages.length + 1;
  stages.push({
    id: `traits-${String(number).padStart(2, "0")}`, name, generator: "traits", skill,
    params: { items }, questions: 6, mechanic: "gate-run", payout: 18 + Math.floor(number / 5) * 2, intro,
  });
}

function band(prefix: string, tokens: string[], groups: number, intro: string[], skill: string): void {
  for (let index = 0; index < groups; index++) {
    const start = Math.floor(index * tokens.length / groups);
    const end = Math.floor((index + 1) * tokens.length / groups);
    chapter(`${prefix} ${index + 1}`, tokens.slice(start, end), intro, skill);
  }
}

if (ADAPTATIONS.length < 48 || OBSERVATIONS.length < 48 || CONCEPTS.length < 24) {
  throw new Error("Review and complete the curated science bank before building chapters");
}

band("Spot Body Traits", ADAPTATIONS.map((item) => `spot:${item.id}`), 4, STR.traits.spotIntro, "traits-observe");
// Mix origins within every chapter, rather than letting answer position or
// chapter number reveal the category.
const origins = shuffle(mulberry32(20261108), OBSERVATIONS.map((item) => `origin:${item.id}`));
band("Where Traits Come From", origins, 4, STR.traits.originIntro, "traits-origins");
band("Traits and Adaptations", CONCEPTS.map((item) => `concept:${item.id}`), 2, STR.traits.conceptIntro, "traits-concepts");
band("Helpful Body Parts", ADAPTATIONS.map((item) => `job:${item.id}`), 4, STR.traits.jobIntro, "traits-functions");
band("Find the Helpful Trait", ADAPTATIONS.map((item) => `feature:${item.id}`), 4, STR.traits.jobIntro, "traits-functions");

// Comparing TWO distinct trait/function links is a constructed task, not a
// rephrasing or a reshuffle of a one-fact question. Never count reversed pairs
// as fresh. Exclude shared features/jobs so only one ordering is meaningful.
const pairs: string[] = [];
for (let first = 0; first < ADAPTATIONS.length; first++) {
  for (let second = first + 1; second < ADAPTATIONS.length; second++) {
    const a = ADAPTATIONS[first];
    const b = ADAPTATIONS[second];
    if (a.organism === b.organism || a.trait === b.trait || a.job === b.job) continue;
    if (overlappingTraits(a.id, b.id)) continue;
    pairs.push(`pair:${a.id}:${b.id}`);
  }
}
const shuffledPairs = shuffle(mulberry32(20261109), pairs);
const pairChapters = 55 - stages.length;
if (shuffledPairs.length < pairChapters * 16) throw new Error("Not enough distinct nature comparisons");
for (let index = 0; index < pairChapters; index++) {
  chapter(`Build Nature Matches ${index + 1}`, shuffledPairs.slice(index * 16, (index + 1) * 16),
    STR.traits.pairIntro, "traits-connections");
}

await Bun.write(new URL("../src/content/traits/stages.json", import.meta.url), `${JSON.stringify(stages, null, 2)}\n`);
console.log(`Built ${stages.length} Trait Safari chapters; ${stages.reduce((sum, stage) => sum + (stage.params.items as string[]).length, 0)} distinct tasks.`);
