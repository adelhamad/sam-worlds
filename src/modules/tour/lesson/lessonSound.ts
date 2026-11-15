// Every sound the lesson screen makes, named by what happened — one place to
// retune the lesson's voice. All of it respects the mute flag in audio.ts.
import { sfx } from "../../../engine/feedback/audio";
import { pogoVoice } from "../../../engine/feedback/pogoVoice";
import { tourSfx } from "../../../engine/feedback/tourSfx";

/** Pogo never chirps the same way twice in a row. */
let chirp = 0;

export const lessonSound = {
  /** Buttons. */
  tap: () => tourSfx.pop(),
  /** A sheet closes / the next question arrives. */
  next: () => tourSfx.whoosh(),
  /** A meet card says hello. */
  meet: () => tourSfx.hop(),
  /** Correct answer. */
  correct: () => {
    tourSfx.match();
    chirp += 1;
    const variant = chirp;
    setTimeout(() => pogoVoice.happy(variant), 110);
  },
  /** A miss: gentle, never a buzzer — Pogo goes "uh-oh" as he jolts. */
  almost: () => {
    tourSfx.nudge();
    setTimeout(() => pogoVoice.uhoh(), 160);
  },
  /** The miss sinks in: the soft "aww" (only on a second miss in a slot). */
  sinks: () => pogoVoice.aww(),
  /** Pogo pulls himself together and points at the worked answer. */
  focus: () => pogoVoice.hm(),
  /** The first right answer after a miss: "phew" (after the right-answer chirp). */
  relieved: () => pogoVoice.phew(),
  /** Pogo was tapped (the caller rate-limits). */
  poke: () => pogoVoice.giggle(),
  /** Combo milestone (level 1, 2, 3 = 3, 5, 8 in a row): rises each time. */
  combo: (level: number) => {
    setTimeout(() => tourSfx.combo(level * 2), 220);
  },
  /** A passport stamp lands. */
  stamp: () => {
    setTimeout(() => tourSfx.stamp(), 320);
  },
  /** Star Dust lands in the meter (softer for a slot solved after a hint). */
  bank: (small: boolean) => tourSfx.dust(small),
  /** The gift box arrives. */
  giftShow: () => tourSfx.hop(),
  /** The lid pops. */
  giftOpen: () => tourSfx.chest(),
  /** Pogo pops in near the end. */
  cheer: () => {
    tourSfx.cheer();
    pogoVoice.hey();
  },
  /** Lesson finished. A Perfect Run and a new trophy keep their own fanfares. */
  done: (result: { newBadge: unknown; perfect: boolean }) => {
    if (result.newBadge) sfx.badge();
    else if (result.perfect) sfx.perfect();
    else tourSfx.lessonDone();
    pogoVoice.boing(0);
    setTimeout(() => pogoVoice.yay(), 260);
  },
};
