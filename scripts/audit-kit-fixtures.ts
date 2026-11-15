// Course Kit audit — hand-made THIN templates (every pool at the guide's
// minimum) so the planner's tight paths stay covered whatever the real content
// looks like: capacity-aware dealing, switching template when one is used up,
// the numbered-variant fallback and the 60-miss run. Used by scripts/audit-kit.ts.
import type { KitItem, KitParams, KitTemplate } from "../src/engine/kit/types";

const card = (id: string): KitItem => ({ id, label: id.toUpperCase() });
/** Picture-only cards: label "" — they differ by their art alone. */
const clock = (id: string, hour: number, minute = 0): KitItem => ({ id, label: "", art: { kind: "clock", hour, minute } });
const icon = (id: string, name: "circle" | "square" | "triangle" | "diamond" | "star" | "sun"): KitItem => ({ id, label: "", art: { kind: "icon", name } });
const cards = (ids: string[]) => ids.map(card);
const base = (id: string) => ({ id, prompt: "Pick the one", explain: "Look closely at each card." });

export const THIN: KitTemplate[] = [
  { ...base("thin-pick"), kind: "pick", right: cards(["r1", "r2"]), wrong: cards(["w1", "w2", "w3", "w4"]) },
  { ...base("thin-pairs"), kind: "pairs", pairs: [1, 2, 3, 4, 5, 6].map((n) => ({ left: card(`l${n}`), right: card(`p${n}`) })) },
  { ...base("thin-order"), kind: "order", sequences: [cards(["a1", "a2", "a3"]), cards(["b1", "b2", "b3"]), cards(["c1", "c2", "c3"])] },
  {
    ...base("thin-sort"), kind: "sort",
    buckets: [{ bucket: card("hot"), items: cards(["h1", "h2", "h3", "h4"]) }, { bucket: card("cold"), items: cards(["c5", "c6", "c7", "c8"]) }],
  },
  { ...base("thin-build"), kind: "build", sentences: [1, 2, 3, 4].map((n) => ({ words: ["we", "like", `cat${n}`], decoys: ["no", "yes"] })) },
  { ...base("thin-number"), kind: "number", variants: [1, 2, 3, 4, 5, 6].map((n) => ({ items: [card(`n${n}`)], answer: n })) },
];

/** Thin templates whose cards are pictures only (clocks like Tick Tock's, icons). */
export const THIN_PICTURES: KitTemplate[] = [
  { ...base("thin-clock-pick"), kind: "pick", right: [clock("c3", 3), clock("c7", 7)], wrong: [clock("c330", 3, 30), clock("c715", 7, 15), clock("c945", 9, 45), clock("c1230", 12, 30)] },
  {
    ...base("thin-clock-pairs"), kind: "pairs",
    pairs: [1, 2, 3, 4, 5, 6].map((h) => ({ left: clock(`k${h}`, h), right: { id: `w${h}`, label: `${h} o'clock` } })),
  },
  { ...base("thin-clock-order"), kind: "order", sequences: [[clock("o1", 1), clock("o2", 2), clock("o3", 3), clock("o4", 4), clock("o5", 5), clock("o6", 6)]] },
  {
    ...base("thin-icon-sort"), kind: "sort",
    buckets: [
      { bucket: card("corners"), items: [icon("i1", "square"), icon("i2", "triangle"), icon("i3", "diamond"), icon("i4", "star")] },
      { bucket: card("round"), items: [icon("i5", "circle"), icon("i6", "sun"), clock("i7", 2), clock("i8", 9)] },
    ],
  },
];

const [pick, pairs, order, sort, build, number] = THIN;

/** Thin lessons: [name, params, count]. */
export const THIN_LESSONS: [string, KitParams, number][] = [
  ["thin build + number", { templates: [build, number], review: [sort] }, 10],
  ["thin order + pick", { templates: [order, pick], review: [] }, 10],
  ["thin pairs + build", { templates: [pairs, build], review: [pick, order] }, 10],
  ["thin everything", { templates: THIN, review: [] }, 10],
  ["review only", { templates: [], review: [pick, sort, number] }, 8],
  ["one template", { templates: [number], review: [] }, 10],
  ["short", { templates: [pick, pairs], review: [build] }, 3],
  ["thin pictures", { templates: THIN_PICTURES, review: [number] }, 10],
];
