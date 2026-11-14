// Rewards collected INSIDE a course lesson (World Tour, Chess Camp). All of it
// is deterministic — effort → reward — and nothing is ever taken away.
//  • the live Star Dust meter shows the accuracy-weighted payout (rule 4)
//    banking up slot by slot; the store still pays the real amount at the end;
//  • one gift box waits halfway through every lesson (a small fixed bonus);
//  • near the end Pogo pops in to cheer.

/** Where a lesson stands: finished slots out of all its slots. */
export interface SlotTally {
  done: number;
  total: number;
}

/** Finished slots after which the gift box appears (0 = lesson too short for one). */
export function giftSlot(totalSlots: number): number {
  return totalSlots >= 6 ? Math.ceil(totalSlots / 2) : 0;
}

/** Finished slots after which Pogo cheers "almost there" (~80%; 0 = never).
    Never the last slot — the celebration screen owns that moment. */
export function cheerSlot(totalSlots: number): number {
  if (totalSlots < 5) return 0;
  return Math.min(totalSlots - 1, Math.round(totalSlots * 0.8));
}

/** Star Dust inside the mid-lesson gift. Replays still give a little. */
export function giftDust(firstCompletion: boolean): number {
  return firstCompletion ? 5 : 1;
}

/**
 * The in-lesson moments ONE finished slot sets off. `before` / `after` are the
 * tallies around the commit, so each moment can fire only on the step that
 * reaches its slot: a session restored past that point never replays it, and
 * a lesson that got shorter (a dropped slot) cannot fire it twice. The slot
 * that ends the lesson sets off nothing.
 */
export function lessonBreaks(before: SlotTally, after: SlotTally): { gift: boolean; cheer: boolean } {
  if (after.done >= after.total) return { gift: false, cheer: false };
  const reached = (slotOf: (total: number) => number): boolean => {
    const slot = slotOf(after.total);
    return slot > 0 && before.done < slotOf(before.total) && after.done >= slot;
  };
  return { gift: reached(giftSlot), cheer: reached(cheerSlot) };
}

/** Finished slots that were not first-try. A miss in the slot still being
    played is not banked yet, so it does not count here. */
export function missedDoneSlots(doneSlots: number, firstTryMisses: number, openSlotMissed: boolean): number {
  return Math.min(doneSlots, Math.max(0, firstTryMisses - (openSlotMissed ? 1 : 0)));
}

/**
 * Star Dust banked so far, for the live meter: first-try slots count 100%,
 * slots solved after a hint 40% (replays ×25%). It never shows more than the
 * store will pay at the end — a finished lesson shows exactly the store's
 * amount before the Perfect Run bonus, which arrives on top.
 */
export function runningPayout(
  base: number, totalSlots: number, doneSlots: number, missedDoneSlots: number, firstCompletion: boolean,
): number {
  if (totalSlots <= 0 || doneSlots <= 0) return 0;
  const done = Math.min(doneSlots, totalSlots);
  const missed = Math.min(done, Math.max(0, missedDoneSlots));
  const earned = (base * (done - missed + 0.4 * missed)) / totalSlots;
  const amount = firstCompletion ? earned : earned * 0.25;
  return done >= totalSlots ? Math.max(1, Math.round(amount)) : Math.floor(amount);
}

/** What the Perfect Run added on top of the meter (0 when it was not perfect). */
export function perfectBonus(
  payout: number, perfect: boolean, base: number, totalSlots: number, firstCompletion: boolean,
): number {
  if (!perfect) return 0;
  return Math.max(0, payout - runningPayout(base, totalSlots, totalSlots, 0, firstCompletion));
}
