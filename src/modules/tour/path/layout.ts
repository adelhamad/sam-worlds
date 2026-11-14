// Geometry + state of the World Tour path. Pure: everything the screen draws
// (banner, lesson nodes, chests, the dotted trail) is derived here from the
// save, so the path is the same picture for the same progress.
import type { StageDef } from "../../../content/types";
import { TOUR_UNITS, type TourUnit, unitComplete } from "../../../content/tour/units";

export type LessonState = "done" | "current" | "locked";
export type ChestState = "locked" | "ready" | "opened";

export const LESSONS_PER_UNIT = 5;
export const BANNER_H = 112;
/** Vertical distance between two node centres. */
const ROW = 124;
/** Extra air above the current node — room for its bouncing START tag. */
const CURRENT_LIFT = 58;
/** Extra air above every chest — room for its OPEN tag (constant, so opening never shifts the path). */
const CHEST_LIFT = 36;
const AFTER_BANNER = 86;
const AFTER_CHEST = 98;

export interface BannerItem {
  kind: "banner";
  unit: TourUnit;
  unitIndex: number;
  y: number;
  done: number;
  /** No lesson of this unit can be played yet. */
  locked: boolean;
}

export interface LessonItem {
  kind: "lesson";
  unit: TourUnit;
  unitIndex: number;
  /** 0-based slot inside the unit. */
  slot: number;
  stage: StageDef;
  state: LessonState;
  stars: number;
  /** Horizontal offset factor, -1 … 1 (multiply by the path amplitude). */
  x: number;
  y: number;
}

export interface ChestItem {
  kind: "chest";
  unit: TourUnit;
  unitIndex: number;
  state: ChestState;
  x: number;
  y: number;
}

export type PathItem = BannerItem | LessonItem | ChestItem;

export interface TourPathModel {
  items: PathItem[];
  height: number;
  /** Stage id of the lesson to play next; null once the whole tour is done. */
  currentId: string | null;
  finished: boolean;
  lessonsDone: number;
  lessonsTotal: number;
}

type Progress = Record<string, { completed: boolean; bestStars?: number }>;

/** Each unit bulges to one side, alternating — a gentle winding trail. */
function waveX(unitIndex: number, slot: number): number {
  const side = unitIndex % 2 === 0 ? 1 : -1;
  return side * Math.sin((slot * Math.PI) / LESSONS_PER_UNIT);
}

function chestState(unit: TourUnit, progress: Progress, chests: string[]): ChestState {
  if (chests.includes(unit.id)) return "opened";
  return unitComplete(unit, progress) ? "ready" : "locked";
}

export function buildTourPath(progress: Progress, chests: string[]): TourPathModel {
  const stages = TOUR_UNITS.flatMap((unit) => unit.lessons);
  const current = stages.find((stage) => !progress[stage.id]?.completed) ?? null;
  const items: PathItem[] = [];
  let cursor = 0;
  let reachedCurrent = false;

  TOUR_UNITS.forEach((unit, unitIndex) => {
    const done = unit.lessons.filter((stage) => progress[stage.id]?.completed).length;
    items.push({ kind: "banner", unit, unitIndex, y: cursor, done, locked: reachedCurrent });
    cursor += BANNER_H + AFTER_BANNER;

    unit.lessons.forEach((stage, slot) => {
      const row = progress[stage.id];
      let state: LessonState = "locked";
      if (row?.completed) state = "done";
      else if (stage.id === current?.id) state = "current";
      if (state === "current") {
        cursor += CURRENT_LIFT;
        reachedCurrent = true;
      }
      items.push({
        kind: "lesson", unit, unitIndex, slot, stage, state,
        stars: row?.completed ? Math.max(1, Math.min(3, row.bestStars ?? 1)) : 0,
        x: waveX(unitIndex, slot), y: cursor,
      });
      cursor += ROW;
    });

    cursor += CHEST_LIFT;
    items.push({
      kind: "chest", unit, unitIndex, state: chestState(unit, progress, chests),
      x: waveX(unitIndex, LESSONS_PER_UNIT), y: cursor,
    });
    cursor += AFTER_CHEST;
  });

  const lessonsDone = stages.filter((stage) => progress[stage.id]?.completed).length;
  return {
    items,
    height: cursor,
    currentId: current?.id ?? null,
    finished: current === null,
    lessonsDone,
    lessonsTotal: stages.length,
  };
}

export interface TrailPoint {
  x: number;
  y: number;
}

/** A smooth curve through the node centres (vertical tangents at every node). */
export function trailPath(points: TrailPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(1)} ${first.y}`;
  let prev = first;
  for (const point of rest) {
    const mid = (prev.y + point.y) / 2;
    d += ` C ${prev.x.toFixed(1)} ${mid}, ${point.x.toFixed(1)} ${mid}, ${point.x.toFixed(1)} ${point.y}`;
    prev = point;
  }
  return d;
}

/** Sideways swing of the trail in px for a given viewport width. */
export function pathAmplitude(viewportWidth: number): number {
  const column = Math.min(viewportWidth, 520);
  return Math.round(Math.max(58, Math.min(118, (column - 184) / 2.8)));
}

/** Small stable tilt (deg) for a passport stamp — same country, same tilt. */
export function stampTilt(code: string): number {
  let hash = 0;
  for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return (hash % 23) - 11;
}
