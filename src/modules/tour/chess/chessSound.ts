// The chess widgets' sound palette. Every call comes from a tap, so it also
// unlocks Web Audio (a mission can be the first thing touched in a session).
// tourSfx already respects the global mute.
import { unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";

function tapped(play: () => void): void {
  unlockAudio();
  play();
}

export const chessSound = {
  /** A piece picked up, a square marked, a pad key pressed. */
  pick: (): void => tapped(tourSfx.pop),
  /** A piece set down on its home square. */
  place: (): void => tapped(tourSfx.place),
  /** A piece slides to a new square. */
  slide: (): void => tapped(tourSfx.slide),
  /** The knight's jump. */
  hop: (): void => tapped(tourSfx.hop),
  capture: (): void => tapped(tourSfx.capture),
  /** The nth star collected. */
  star: (nth: number): void => tapped(() => tourSfx.star(nth)),
  /** A pawn became a queen. */
  crown: (): void => tapped(tourSfx.crown),
  /** The mission's goal is reached. */
  win: (): void => tapped(tourSfx.match),
  /** A gentle "not there" — never harsh. */
  nudge: (): void => tapped(tourSfx.nudge),
};
