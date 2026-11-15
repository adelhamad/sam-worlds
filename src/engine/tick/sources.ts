// The Tick Tock lesson's building blocks: its spec (tasks, kit templates,
// minutes, jumps), the SOURCES a slot can draw from (a task or a kit
// template), how gentle each is, and one build of a task.
import type { KitTemplate } from "../kit/types";
import { buildMatch, buildOrder, buildPickClock, buildPickWords } from "./cardPuzzles";
import { buildLaterRead, buildLaterSet, buildRead, buildSet } from "./clockPuzzles";
import type { Built } from "./puzzle";
import { TICK_TASKS, tickSpec, type TickEnv, type TickSpec } from "./times";
import type { TickParams, TickTask } from "./types";

export interface LessonSpec {
  tasks: TickTask[];
  kit: KitTemplate[];
  time: TickSpec;
}

/** A slot's source: a task, or a kit template. */
export type Source = { kind: "task"; task: TickTask } | { kind: "kit"; template: KitTemplate };

export function sourceKey(source: Source): string {
  return source.kind === "task" ? source.task : `kit:${source.template.id}`;
}

/** Well-formed lesson spec from stage params (unknown tasks dropped; never empty). */
export function makeSpec(params: Partial<TickParams>): LessonSpec {
  const tasks = [...new Set((params.tasks ?? []).filter((task) => TICK_TASKS.includes(task)))];
  const kit = (params.kit ?? []).filter((template, i, all) => all.findIndex((other) => other.id === template.id) === i);
  return { tasks: tasks.length || kit.length ? tasks : ["read"], kit, time: tickSpec(params) };
}

export function lessonSources(spec: LessonSpec): Source[] {
  return [
    ...spec.tasks.map((task): Source => ({ kind: "task", task })),
    ...spec.kit.map((template): Source => ({ kind: "kit", template })),
  ];
}

/** Lower = gentler: tapping a card first, then the day's ideas, then reading, then building. */
const GENTLENESS: Record<TickTask, number> = {
  "pick-clock": 0, "pick-words": 0, read: 2, match: 3, "later-read": 4, order: 5, set: 6, "later-set": 7,
};

export function gentleness(source: Source): number {
  return source.kind === "kit" ? 1 : GENTLENESS[source.task];
}

/** The lesson finishes by moving the hands: later-set, else set, else read (−1 = no preference). */
export function closerRank(source: Source): number {
  if (source.kind === "kit") return -1;
  return ["read", "set", "later-set"].indexOf(source.task);
}

export function buildPuzzle(task: TickTask, env: TickEnv): Built {
  switch (task) {
    case "set": return buildSet(env);
    case "match": return buildMatch(env);
    case "pick-clock": return buildPickClock(env);
    case "pick-words": return buildPickWords(env);
    case "order": return buildOrder(env);
    case "later-read": return buildLaterRead(env);
    case "later-set": return buildLaterSet(env);
    default: return buildRead(env);
  }
}
