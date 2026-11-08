import stages from "./stages.json";
import { DETECTIVE_CARDS } from "./detectiveCards";
import { HABITAT_CASES } from "./habitatCases";
import type { DetectiveCard, DetectiveMode } from "./detectiveTypes";
import { mulberry32, shuffle } from "../../engine/rng";

export interface DetectiveTask { mode: DetectiveMode; ids: string[] }
const MODES: DetectiveMode[] = ["notice", "sort", "origins", "compare", "connect"];

/** Semantic IDs are canonical unordered sets, never positions or random seeds. */
function tokenFor(mode: DetectiveMode, ids: string[]): string {
  return [mode, ...[...ids].sort()].join(".");
}

// Reading the generated manifest keeps exhaustive curriculum planning out of play time.
export const DETECTIVE_TASKS: Record<string, DetectiveTask> = Object.fromEntries(
  stages.flatMap((stage) => stage.params.items).filter((token) =>
    MODES.includes(token.split(".")[0] as DetectiveMode)).map((token) => {
    const [mode, ...ids] = token.split(".");
    return [token, { mode: mode as DetectiveMode, ids }];
  }),
);

function triples<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      for (let c = b + 1; c < items.length; c++) result.push([items[a], items[b], items[c]]);
    }
  }
  return result;
}

function eligible(mode: DetectiveMode, cards: DetectiveCard[]): boolean {
  if (mode === "origins") return cards.every((card) => card.origin)
    && new Set(cards.map((card) => card.origin)).size >= 2;
  const collections = new Set(cards.map((card) => card.collection));
  if (mode === "notice") return collections.has("outside") && collections.size >= 2;
  return collections.size >= 2;
}

/** Choose among underused subjects while cycling answer-count patterns.
 * Two cards can share a bin: empty bins and repeated answers are intentional.
 */
function balancedPool(mode: DetectiveMode, count: number): string[] {
  const cards = [...DETECTIVE_CARDS].sort((a, b) => a.id.localeCompare(b.id));
  const candidates = shuffle(mulberry32(815 + MODES.indexOf(mode)),
    triples(cards).filter((group) => eligible(mode, group)));
  const buckets = new Map<string, DetectiveCard[][]>();
  for (const group of candidates) {
    const pattern = group.map((card) => mode === "origins" ? card.origin : card.collection).sort().join("/");
    const bucket = buckets.get(pattern) ?? [];
    bucket.push(group);
    buckets.set(pattern, bucket);
  }
  const patterns = [...buckets.keys()].sort();
  const seen = new Map<string, number>();
  const result: string[] = [];
  for (let index = 0; index < count; index++) {
    const bucket = buckets.get(patterns[index % patterns.length])!;
    if (!bucket.length) throw new Error(`Exhausted ${mode} curriculum pattern`);
    let best = 0;
    let score = Infinity;
    // Bounded look-ahead avoids expensive exhaustive rescoring at each draw.
    for (let option = 0; option < Math.min(192, bucket.length); option++) {
      const exposure = bucket[option].reduce((sum, card) => sum + (seen.get(card.id) ?? 0) ** 2, 0);
      if (exposure < score) { best = option; score = exposure; }
    }
    const [selected] = bucket.splice(best, 1);
    selected.forEach((card) => seen.set(card.id, (seen.get(card.id) ?? 0) + 1));
    result.push(tokenFor(mode, selected.map((card) => card.id)));
  }
  return result;
}

const CHAPTERS = [
  { end: 8, start: 0, name: "Spot a body trait", mode: "notice", intro: [
    "A body trait is a part or feature of a living thing's body.",
    "Tools and practiced skills go outside our body-trait group.",
    "Read each clue. More than one card can go in the same place.",
  ] },
  { end: 22, start: 8, name: "Inside the trait family", mode: "sort", intro: [
    "Adaptations are inside the trait family.",
    "Adaptations are passed from parents. They were shaped over many generations to help living things survive or have young.",
    "Our known adaptation cases come from reviewed science records. Help alone does not prove a feature is an adaptation.",
    "A body trait with no help shown is still a trait. It goes in Help not known.",
    "Body changes acquired during life go in Changed during life, inside the trait family.",
  ] },
  { end: 30, start: 22, name: "Parents or practice", mode: "origins", intro: [
    "Some body traits are inherited from parents.",
    "Some skills come from practice. Some body features change during life.",
    "Use the clue to find where each feature or skill came from.",
  ] },
  { end: 34, start: 30, name: "Change the place", mode: "compare", intro: [
    "Keep the body trait the same. Change the scene.",
    "Does this trait help with the job shown, or is that job not needed here?",
    "Not used here does not mean the trait is bad or never helps.",
  ] },
  { end: 35, start: 34, name: "Build the evidence", mode: "connect", intro: [
    "Which labels do the clues support: Trait, Adaptation, or both?",
    "Sort the evidence about parents and helpful jobs. Some clues are not enough on their own.",
    "A known adaptation is also a trait. An unknown case needs more evidence, not a guess.",
  ] },
  { end: 55, start: 35, name: "Detective challenge", mode: "mixed", intro: [
    "Try body traits, trait families, origins, and changing scenes.",
    "Can the same feature be a trait and an adaptation? Use evidence to support the labels.",
    "Read the question before sorting. Each question asks something different.",
    "Use every clue. A place can hold several cards or no cards.",
  ] },
] as const;

interface LegacyStage {
  id: string; name: string; generator: string; skill: string;
  params: { items: string[] }; questions: number; mechanic: string; payout: number;
  intro?: string[];
}

export function buildDetectiveStages<T extends LegacyStage>(legacyStages: T[]) {
  if (legacyStages.length !== 55) throw new Error("Expected the original 55 stages");
  const habitats = [...HABITAT_CASES].sort((a, b) => a.id.localeCompare(b.id));
  if (habitats.length !== 12) throw new Error("Expected twelve habitat cases");
  const pairs = habitats.flatMap((first, index) => habitats.slice(index + 1)
    .map((second) => tokenFor("compare", [first.id, second.id])));
  let cursor = 0;
  const plan = legacyStages.map((_, index) => {
    const chapter = CHAPTERS.find((entry) => index < entry.end)!;
    if (chapter.mode !== "mixed") return Array<DetectiveMode>(12).fill(chapter.mode);
    const reserved: DetectiveMode[] = [];
    if (index - 35 >= 2) reserved.push("compare");
    if (index - 35 >= 12) reserved.push("connect");
    return [...Array.from({ length: 12 - reserved.length }, () => MODES[cursor++ % 3]), ...reserved];
  });
  const counts = Object.fromEntries(MODES.map((mode) => [mode, plan.flat().filter((entry) => entry === mode).length]));
  const known = DETECTIVE_CARDS.filter((card) => card.collection === "adaptation").slice(0, 12);
  const unknown = DETECTIVE_CARDS.filter((card) => card.collection === "unknown" && card.origin === "parents").slice(0, 8);
  const connect = known.flatMap((card, index) => [card, ...unknown.slice(index, index + 1)])
    .map((card) => tokenFor("connect", [card.id]));
  const pools: Record<DetectiveMode, string[]> = {
    notice: balancedPool("notice", counts.notice), sort: balancedPool("sort", counts.sort),
    origins: balancedPool("origins", counts.origins), compare: shuffle(mulberry32(819), pairs), connect,
  };
  for (const mode of MODES) {
    if (pools[mode].length !== counts[mode]) throw new Error(`Unexpected ${mode} pool size`);
  }
  const offsets = { notice: 0, sort: 0, origins: 0, compare: 0, connect: 0 };
  return legacyStages.map((stage, index) => {
    const chapter = CHAPTERS.find((entry) => index < entry.end)!;
    const items = plan[index].map((mode) => pools[mode][offsets[mode]++]);
    return { ...stage, name: `${chapter.name} ${index - chapter.start + 1}`,
      params: { items, pedagogy: 1 }, intro: [...chapter.intro] };
  });
}
