// Registry of Pogo's courses + the lookups the path screen, the lesson player,
// the hub and the save state share. Add a course here and it gets a path, a
// lesson player, chests and parent controls.
import { CHESS_UNITS, CHESS_WORLD, CHESS_WORLD_ID } from "./chess/units";
import { CODE_COURSE } from "./code/units";
import { TICK_COURSE } from "./tick/units";
import type { Course, CourseUnit } from "./courseTypes";
import { iconRef } from "./iconNames";
import { LANG_COURSES } from "./langCourses";
import { TOUR_UNITS, TOUR_WORLD, TOUR_WORLD_ID } from "./tour/units";

export type { Course, CourseUnit };

// ADDING A COURSE = one entry here (plus its content file). The home shelf,
// routes, world registration, parent controls and audits all read this list.
export const COURSES: Course[] = [
  {
    id: "tour", worldId: TOUR_WORLD_ID, title: "World Tour", icon: iconRef("globe"),
    tagline: "Show Pogo around planet Earth!", path: "/tour", hue: "#6ea8ff", subject: "explore",
    units: TOUR_UNITS, world: TOUR_WORLD,
  },
  {
    id: "chess", worldId: CHESS_WORLD_ID, title: "Chess Camp", icon: iconRef("pawn"),
    tagline: "Learn chess with Pogo!", path: "/chess", hue: "#ffd166", subject: "think",
    units: CHESS_UNITS, world: CHESS_WORLD,
  },
  CODE_COURSE,
  TICK_COURSE,
  ...LANG_COURSES,
];

/** Worlds that belong to a course (they use the path + lesson player, not the planet grid). */
export const COURSE_WORLD_IDS = new Set(COURSES.map((course) => course.worldId));


export function courseById(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

export function courseOfWorld(worldId: string): Course | undefined {
  return COURSES.find((course) => course.worldId === worldId);
}

export function courseOfStage(stageId: string): Course | undefined {
  return COURSES.find((course) => course.world.stages.some((stage) => stage.id === stageId));
}

export function courseUnitById(unitId: string): CourseUnit | undefined {
  return COURSES.flatMap((course) => course.units).find((unit) => unit.id === unitId);
}

export function courseUnitOfStage(stageId: string): CourseUnit | undefined {
  return COURSES.flatMap((course) => course.units).find((unit) => unit.lessons.some((stage) => stage.id === stageId));
}

export function unitComplete(unit: CourseUnit, progress: Record<string, { completed: boolean }>): boolean {
  return unit.lessons.every((stage) => progress[stage.id]?.completed);
}

/** Lessons unlock in order: the first one, a finished one, or the next in line. */
export function lessonPlayable(course: Course, stageId: string, progress: Record<string, { completed: boolean }>): boolean {
  const stages = course.world.stages;
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index <= 0) return index === 0;
  return Boolean(progress[stageId]?.completed || progress[stages[index - 1].id]?.completed);
}

/** In-app routes: course stages use the lesson player, not the gate-run stage. */
export function worldRoute(worldId: string): string {
  return courseOfWorld(worldId)?.path ?? `/world/${worldId}`;
}

export function stageRoute(stageId: string): string {
  const course = courseOfStage(stageId);
  return course ? `${course.path}/lesson/${stageId}` : `/play/${stageId}`;
}
