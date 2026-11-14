// Every sound the lesson screen makes, named by what happened — one place to
// retune the lesson's voice. All of it respects the mute flag in audio.ts.
import { sfx } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";

export const lessonSound = {
  /** Buttons. */
  tap: () => tourSfx.pop(),
  /** A sheet closes / the next question arrives. */
  next: () => tourSfx.whoosh(),
  /** A meet card says hello. */
  meet: () => tourSfx.hop(),
  /** Correct answer. */
  correct: () => tourSfx.match(),
  /** A miss: gentle and curious, never a buzzer. */
  almost: () => tourSfx.nudge(),
  /** Combo milestone (level 1, 2, 3 = 3, 5, 8 in a row): rises each time. */
  combo: (level: number) => {
    setTimeout(() => tourSfx.combo(level * 2), 220);
  },
  /** A passport stamp lands. */
  stamp: () => {
    setTimeout(() => tourSfx.stamp(), 320);
  },
  /** Lesson finished. A Perfect Run and a new trophy keep their own fanfares. */
  done: (result: { newBadge: unknown; perfect: boolean }) => {
    if (result.newBadge) sfx.badge();
    else if (result.perfect) sfx.perfect();
    else tourSfx.lessonDone();
  },
};
