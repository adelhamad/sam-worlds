// Player-facing strings of the handwriting tracer (src/ui/write/). Kind and
// short; never "wrong", "fail" or "mistake" (docs/ANSWER_INTEGRITY.md).
import type { SlipReason } from "../engine/write/types";

export const WRITE = {
  watch: "Watch",
  watching: "Watching…",
  again: "Again",
  areaLabel: "Writing space. Trace the letter with your finger.",
  strokeOf: (n: number, total: number) => `Stroke ${n} of ${total}`,
  done: "You wrote it!",
  hint: {
    start: "Start at the dot.",
    direction: "Follow the arrow.",
    short: "Go all the way.",
    shape: "Stay on the path.",
    long: "Stop at the end.",
  } satisfies Record<SlipReason, string>,
  tapDot: "Tap the dot.",
};
