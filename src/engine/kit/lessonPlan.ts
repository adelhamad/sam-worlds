// Plans a whole Course Kit lesson: every slot gets a template (an even,
// capacity-aware rotation; spaced review in about a quarter of the slots,
// never the two openers; a pairs board to finish on), then a fresh sample of
// that template at a gently rising difficulty. No question appears twice and
// no template appears three times in a row.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { freshSample, variantSample } from "./fresh";
import { clamp, kitKeys } from "./sample";
import type { KitTemplate } from "./types";
import { templateVariety } from "./variety";

/** Share of the slots that revisit earlier lessons' templates. */
const REVIEW_SHARE = 0.25;
/** Lessons shorter than this skip review: they belong to their own templates. */
const REVIEW_MIN_LENGTH = 4;
const ARRANGE_TRIES = 40;

type Slot = KitTemplate | undefined;

/** Three of the same template in a row anywhere around `index`? */
function makesTriple(slots: Slot[], index: number): boolean {
  for (let start = index - 2; start <= index; start++) {
    const window = slots.slice(Math.max(0, start), start + 3);
    if (start < 0 || window.length < 3 || window.some((slot) => !slot)) continue;
    if (window.every((slot) => slot?.id === window[0]?.id)) return true;
  }
  return false;
}

const hasTriple = (slots: Slot[]) => slots.some((_, index) => makesTriple(slots, index));

/** `amount` deals from `pool`: always the least-used template that still has fresh samples. */
function deal(pool: KitTemplate[], amount: number, rng: RNG, uses: Map<string, number>): KitTemplate[] {
  const order = shuffle(rng, pool);
  const used = (template: KitTemplate) => uses.get(template.id) ?? 0;
  const out: KitTemplate[] = [];
  for (let i = 0; i < amount; i++) {
    const roomy = order.filter((template) => used(template) < templateVariety(template));
    const choices = roomy.length ? roomy : order;
    const least = Math.min(...choices.map(used));
    const choice = choices.find((template) => used(template) === least) as KitTemplate;
    uses.set(choice.id, used(choice) + 1);
    out.push(choice);
  }
  return out;
}

/** Fallback arrangement: each open slot takes the most plentiful template that avoids three in a row. */
function spread(frame: Slot[], open: number[], left: KitTemplate[]): Slot[] {
  const slots = [...frame];
  const bag = [...left];
  for (const index of open) {
    const amount = (template: KitTemplate) => bag.filter((other) => other.id === template.id).length;
    const fits = (template: KitTemplate) => {
      slots[index] = template;
      const ok = !makesTriple(slots, index);
      slots[index] = undefined;
      return ok;
    };
    const choice = [...bag].sort((a, b) => Number(fits(b)) - Number(fits(a)) || amount(b) - amount(a))[0];
    slots[index] = choice;
    bag.splice(bag.indexOf(choice), 1);
  }
  return slots;
}

/** Fill the open slots with the dealt templates, shuffled until no template runs three in a row. */
function arrange(frame: Slot[], open: number[], dealt: KitTemplate[], rng: RNG): KitTemplate[] {
  let slots: Slot[] = frame;
  for (let attempt = 0; attempt < ARRANGE_TRIES; attempt++) {
    slots = [...frame];
    shuffle(rng, dealt).forEach((template, i) => (slots[open[i]] = template));
    if (!hasTriple(slots)) return slots as KitTemplate[];
  }
  return spread(frame, open, dealt) as KitTemplate[];
}

/** The template of every slot. `main` is never empty here. */
export function planSlots(main: KitTemplate[], review: KitTemplate[], count: number, rng: RNG): KitTemplate[] {
  const pairs = main.filter((template) => template.kind === "pairs");
  const finale = count >= 2 && pairs.length ? pick(rng, pairs) : undefined;
  const frame: Slot[] = Array.from({ length: count }, () => undefined);
  if (finale) frame[count - 1] = finale;
  const uses = new Map<string, number>(finale ? [[finale.id, 1]] : []);
  // Review: about a quarter of the slots, never the two openers (they greet the new idea).
  const reviewAmount = review.length && count >= REVIEW_MIN_LENGTH ? Math.round(count * REVIEW_SHARE) : 0;
  const reviewOpen = shuffle(rng, frame.map((_, i) => i).filter((i) => i >= 2 && !frame[i])).slice(0, reviewAmount);
  shuffle(rng, deal(review, reviewOpen.length, rng, uses)).forEach((template, i) => (frame[reviewOpen[i]] = template));
  const open = frame.map((slot, i) => (slot ? -1 : i)).filter((i) => i >= 0);
  return arrange(frame, open, deal(main, open.length, rng, uses), rng);
}

/** Lessons warm up and then stretch: −0.15 … +0.15 around the asked difficulty. */
export function slotDifficulty(difficulty: number, index: number, count: number): number {
  return clamp(difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5), 0, 1);
}

interface Fill {
  rng: RNG;
  /** Every template of the lesson, own ones first. */
  all: KitTemplate[];
  seen: Set<string>;
  out: Question[];
}

/** Would `template` be the third in a row after what is already placed? */
function third(fill: Fill, template: KitTemplate): boolean {
  const [a, b] = fill.out.slice(-2);
  return Boolean(a && b) && [a, b].every((q) => (q.payload as { template?: string }).template === template.id);
}

/** The slot's own template when it has a fresh sample; otherwise the closest stand-in. */
function fillSlot(fill: Fill, planned: KitTemplate, ctx: GenContext): Question {
  const others = fill.all.filter((template) => template.id !== planned.id);
  const candidates = [planned, ...others].filter((template) => !third(fill, template));
  const order = candidates.length ? candidates : [planned];
  for (const template of order) {
    const question = freshSample(template, fill.rng, ctx, fill.seen, { anySize: true });
    if (question) return question;
  }
  return variantSample(order[0], fill.rng, ctx, fill.seen);
}

/** `count` questions (always exactly `count`). Full lessons ignore the session's seen keys, like World Tour. */
export function planLesson(main: KitTemplate[], review: KitTemplate[], count: number, rng: RNG, ctx: GenContext): Question[] {
  const slots = planSlots(main, review, count, rng);
  const fill: Fill = { rng, all: [...main, ...review], seen: new Set(), out: [] };
  slots.forEach((template, index) => {
    const question = fillSlot(fill, template, { ...ctx, difficulty: slotDifficulty(ctx.difficulty, index, count) });
    fill.out.push(question);
    kitKeys(question).forEach((key) => fill.seen.add(key));
  });
  return fill.out;
}
