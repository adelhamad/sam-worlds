// The Code Lab widgets' sound palette. Taps also unlock Web Audio (a puzzle can
// be the first thing touched in a session). tourSfx respects the global mute.
import { unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";

function tapped(play: () => void): void {
  unlockAudio();
  play();
}

export const codeSound = {
  /** A block snapped onto the track / a square picked. */
  add: (): void => tapped(tourSfx.place),
  /** A block taken out, a loop opened, a picker shown. */
  pop: (): void => tapped(tourSfx.pop),
  /** "No room" / "not like that" — soft. */
  nudge: (): void => tapped(tourSfx.nudge),
  run: (): void => tapped(tourSfx.run),
  /** Pogo hops one square (`nth` climbs a little). Played from timers: no unlock. */
  step: (nth: number): void => tourSfx.step(nth),
  bonk: (): void => tourSfx.bonk(),
  star: (nth: number): void => tourSfx.star(nth),
  win: (): void => tourSfx.match(),
};
