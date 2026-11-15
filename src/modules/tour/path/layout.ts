// Geometry + state of a course path (any course). Pure: everything
// the screen draws (banner, lesson nodes, chests, the dotted trail) is derived
// here from the course and the save, so the path is the same picture for the
// same progress.
import { unitComplete, type Course, type CourseUnit } from "../../../content/courses";
import type { StageDef } from "../../../content/types";

export type LessonState = "done" | "current" | "locked";
export type ChestState = "locked" | "ready" | "opened";

/** What a lesson node shows: its number, the mix-up arrows or the champion crown. */
export type NodeIcon = "number" | "mix" | "crown";

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
  unit: CourseUnit;
  unitIndex: number;
  y: number;
  done: number;
  /** No lesson of this unit can be played yet. */
  locked: boolean;
}

export interface LessonItem {
  kind: "lesson";
  unit: CourseUnit;
  unitIndex: number;
  /** 0-based slot inside the unit. */
  slot: number;
  stage: StageDef;
  icon: NodeIcon;
  state: LessonState;
  stars: number;
  /** Horizontal offset factor, -1 … 1 (multiply by the path amplitude). */
  x: number;
  y: number;
}

export interface ChestItem {
  kind: "chest";
  unit: CourseUnit;
  unitIndex: number;
  state: ChestState;
  x: number;
  y: number;
}

export type PathItem = BannerItem | LessonItem | ChestItem;

export interface TourPathModel {
  items: PathItem[];
  height: number;
  /** Stage id of the lesson to play next; null once the whole course is done. */
  currentId: string | null;
  finished: boolean;
  lessonsDone: number;
  lessonsTotal: number;
}

type Progress = Record<string, { completed: boolean; bestStars?: number }>;

/** Each unit bulges to one side, alternating — a gentle winding trail that ends at its chest. */
function waveX(unitIndex: number, slot: number, lessons: number): number {
  const side = unitIndex % 2 === 0 ? 1 : -1;
  return side * Math.sin((slot * Math.PI) / Math.max(1, lessons));
}

/** The last lesson of a unit wears the crown; a course may mark one slot as its mix-up. */
function nodeIcon(unit: CourseUnit, slot: number, mixSlot: number | undefined): NodeIcon {
  if (slot === unit.lessons.length - 1) return "crown";
  return slot === mixSlot ? "mix" : "number";
}

function chestState(unit: CourseUnit, progress: Progress, chests: string[]): ChestState {
  if (chests.includes(unit.id)) return "opened";
  return unitComplete(unit, progress) ? "ready" : "locked";
}

export interface PathOptions {
  /** 0-based lesson slot drawn with the mix-up arrows (see courseFamilies). */
  mixSlot?: number;
}

export function buildTourPath(course: Course, progress: Progress, chests: string[], options: PathOptions = {}): TourPathModel {
  const stages = course.units.flatMap((unit) => unit.lessons);
  const current = stages.find((stage) => !progress[stage.id]?.completed) ?? null;
  const items: PathItem[] = [];
  let cursor = 0;
  let reachedCurrent = false;

  course.units.forEach((unit, unitIndex) => {
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
        icon: nodeIcon(unit, slot, options.mixSlot),
        stars: row?.completed ? Math.max(1, Math.min(3, row.bestStars ?? 1)) : 0,
        x: waveX(unitIndex, slot, unit.lessons.length), y: cursor,
      });
      cursor += ROW;
    });

    cursor += CHEST_LIFT;
    items.push({
      kind: "chest", unit, unitIndex, state: chestState(unit, progress, chests),
      x: waveX(unitIndex, unit.lessons.length, unit.lessons.length), y: cursor,
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
