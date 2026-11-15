// When the speaking break comes in a language lesson (speaking practice on):
// about a third of the way in — after the first few answers, well before the
// gift (halfway) and the cheer (~80%). Like those, it fires only on the step
// that reaches its slot, so a restored session never replays it. It is not a
// question: it is never judged and changes no payout.
import { cheerSlot, giftSlot, type SlotTally } from "../../../engine/answers/lessonRewards";

/** Finished slots after which the speaking break appears (0 = lesson too short). */
export function speakSlot(totalSlots: number): number {
  if (totalSlots < 6) return 0;
  const slot = Math.max(2, Math.round(totalSlots * 0.3));
  return slot === giftSlot(totalSlots) || slot === cheerSlot(totalSlots) ? slot - 1 : slot;
}

/** True when this one finished slot reaches the speaking break. */
export function speakDue(before: SlotTally, after: SlotTally): boolean {
  if (after.done >= after.total) return false;
  const slot = speakSlot(after.total);
  return slot > 0 && before.done < speakSlot(before.total) && after.done >= slot;
}
