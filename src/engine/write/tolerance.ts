// How forgiving the handwriting judge is — data, not magic numbers in the
// judge. Units: design-box units (the box is 1000 wide). On a phone the box is
// about 340 px, so 100 units ≈ 34 px ≈ a child's fingertip; on a tablet ≈ 46 px.
import type { GuideLevel } from "./types";

export interface Tolerance {
  /** The first finger point must be this close to the stroke's start. */
  start: number;
  /** The last finger point must be this close to the stroke's end. */
  end: number;
  /** Mean distance of the finger trail from the path. */
  mean: number;
  /** 90th-percentile distance (a few jittery outliers are fine). */
  p90: number;
  /** A point of the path counts as covered when the trail passes this close. */
  cover: number;
  /** Share of the path that must be covered. */
  minCover: number;
  /** 90th-percentile distance of the IN-ORDER match (catches going round a loop backwards). */
  order: number;
  /** Trail length / path length below which the stroke is unfinished. */
  minLength: number;
  /** Trail length / path length above which it is a scribble… */
  maxLength: number;
  /** …plus this many units, so a wobbly finger on a very short stroke is not a scribble. */
  lengthSlack: number;
  /** Finger points closer together than this are merged before judging (touch-screen jitter). */
  minSpacing: number;
  /** A dot: the tap must land this close to it… */
  dotRadius: number;
  /** …and the dab may wander at most this far in total. */
  dotTravel: number;
}

const GUIDED: Tolerance = {
  start: 115,
  end: 115,
  mean: 45,
  p90: 90,
  cover: 65,
  minCover: 0.85,
  order: 100,
  minLength: 0.6,
  maxLength: 1.9,
  lengthSlack: 120,
  minSpacing: 12,
  dotRadius: 80,
  dotTravel: 170,
};

/** Memory mode: a little more room on position; direction and coverage stay the same. */
const MEMORY: Tolerance = {
  ...GUIDED,
  start: 130,
  end: 135,
  mean: 50,
  p90: 100,
  cover: 75,
  dotRadius: 95,
};

export const TOLERANCE: Record<GuideLevel, Tolerance> = { guided: GUIDED, memory: MEMORY };

/** Failed stroke attempts allowed in one letter for it still to count as done. */
export const MAX_SLIPS = 3;
