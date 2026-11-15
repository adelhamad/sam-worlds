// What the home's one big button does — pure, so it can be reasoned about (and
// checked) without React. Priority: a lesson already in progress, a treasure
// chest waiting, the next lesson of the course in focus, another course with
// lessons left, the classic worlds, and finally the Universe.
import { COURSES, courseOfStage, unitComplete, type Course, type CourseUnit } from "../../content/courses";
import { nextStageIn, stageById, worldOfStage } from "../../content/worlds";
import type { StageDef } from "../../content/types";

type Progress = Record<string, { completed: boolean }>;
type Flags = Record<string, boolean>;

export interface HomeState {
  progress: Progress;
  session: { stageId: string; result: unknown } | null;
  lastStageId: string | null;
  recentWorlds: string[];
  tourChests: string[];
  enabledWorlds: Flags;
  hiddenWorlds: Flags;
}

export type NextKind = "continue" | "start" | "chest" | "universe";

export interface NextAction {
  kind: NextKind;
  route: string;
  /** The course the button belongs to (null for a classic world / the Universe). */
  course: Course | null;
  /** Lesson / stage the button starts, when it starts one. */
  lesson: StageDef | null;
  /** Classic world name + icon when the button continues a classic stage. */
  worldName: string | null;
  worldIcon: string | null;
}

export interface CourseStatus {
  done: number;
  total: number;
  /** First finished unit whose chest is still closed. */
  chestUnit: CourseUnit | null;
  /** Unit holding the first lesson not finished yet (null = all done). */
  nextUnit: CourseUnit | null;
  nextLesson: StageDef | null;
  /** Lessons left in `nextUnit` before its chest. */
  lessonsToChest: number | null;
  allDone: boolean;
}

export function worldShown(worldId: string, enabled: Flags, hidden: Flags): boolean {
  return Boolean(enabled[worldId]) && !hidden[worldId];
}

export function visibleCourses(enabled: Flags, hidden: Flags, courses: Course[] = COURSES): Course[] {
  return courses.filter((course) => worldShown(course.worldId, enabled, hidden));
}

export function courseStatus(course: Course, progress: Progress, tourChests: string[]): CourseStatus {
  const stages = course.world.stages;
  const done = stages.filter((stage) => progress[stage.id]?.completed).length;
  // An empty unit is never "complete" — `every` on [] would show a fake chest.
  const chestUnit = course.units.find((unit) =>
    unit.lessons.length > 0 && !tourChests.includes(unit.id) && unitComplete(unit, progress)) ?? null;
  const nextLesson = stages.find((stage) => !progress[stage.id]?.completed) ?? null;
  const nextUnit = nextLesson ? course.units.find((unit) => unit.lessons.some((stage) => stage.id === nextLesson.id)) ?? null : null;
  const lessonsToChest = nextUnit ? nextUnit.lessons.filter((stage) => !progress[stage.id]?.completed).length : null;
  return { done, total: stages.length, chestUnit, nextUnit, nextLesson, lessonsToChest, allDone: stages.length > 0 && !nextLesson };
}

function empty(kind: NextKind, route: string): NextAction {
  return { kind, route, course: null, lesson: null, worldName: null, worldIcon: null };
}

function stageAction(stage: StageDef, state: HomeState): NextAction | null {
  const course = courseOfStage(stage.id);
  if (course) {
    if (!worldShown(course.worldId, state.enabledWorlds, state.hiddenWorlds)) return null;
    return { ...empty("continue", `${course.path}/lesson/${stage.id}`), course, lesson: stage };
  }
  const world = worldOfStage(stage.id);
  if (!world || !worldShown(world.id, state.enabledWorlds, state.hiddenWorlds)) return null;
  return { ...empty("continue", `/play/${stage.id}`), lesson: stage, worldName: world.name, worldIcon: world.icon };
}

/** The course Pogo talks about: the last one played, else the most recent, else the first. */
export function focusCourse(state: HomeState, courses: Course[]): Course | null {
  const last = state.lastStageId ? courseOfStage(state.lastStageId) : undefined;
  if (last && courses.includes(last)) return last;
  const recent = state.recentWorlds.map((id) => courses.find((course) => course.worldId === id)).find(Boolean);
  return recent ?? courses[0] ?? null;
}

function courseAction(course: Course, status: CourseStatus): NextAction | null {
  if (!status.nextLesson) return null;
  const kind = status.done === 0 ? "start" : "continue";
  return { ...empty(kind, `${course.path}/lesson/${status.nextLesson.id}`), course, lesson: status.nextLesson };
}

function classicAction(state: HomeState): NextAction {
  const lastWorld = state.lastStageId ? worldOfStage(state.lastStageId) : undefined;
  if (lastWorld && !courseOfStage(state.lastStageId ?? "")) {
    const next = stageAction(nextStageIn(lastWorld, state.progress), state);
    if (next) return next;
  }
  return empty("universe", "/universe");
}

export function nextAction(state: HomeState, courses: Course[]): NextAction {
  // 1. A lesson already under way (course or classic) — pick up exactly there.
  const live = state.session && !state.session.result ? stageById(state.session.stageId) : undefined;
  const resumed = live ? stageAction(live, state) : null;
  if (resumed) return resumed;

  const focus = focusCourse(state, courses);
  const ordered = focus ? [focus, ...courses.filter((course) => course !== focus)] : courses;
  const statuses = ordered.map((course) => ({ course, status: courseStatus(course, state.progress, state.tourChests) }));

  // 2. A finished unit's chest is waiting — that is a treat, open it first.
  const chest = statuses.find(({ status }) => status.chestUnit);
  if (chest) return { ...empty("chest", chest.course.path), course: chest.course };

  // 3. The next lesson of the course in focus, else of any course with lessons left.
  for (const { course, status } of statuses) {
    const action = courseAction(course, status);
    if (action) return action;
  }

  // 4. Every course done (or none shown): the classic worlds.
  return classicAction(state);
}

/** Whole days between two `YYYY-MM-DD` keys (null when `from` is null). */
export function daysBetween(from: string | null, to: string): number | null {
  if (!from) return null;
  const ms = Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86_400_000)) : null;
}
