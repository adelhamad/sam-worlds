// Tick Tock curriculum — learn to tell the time on a real clock face. Units go
// from whole hours to any minute, then the parts of the day, then "how much
// later". Units and lessons are DATA; stage ids are permanent (saves reference
// them): only ever APPEND units or lessons.
import type { Course, CourseUnit } from "../courseTypes";
import { iconRef } from "../iconNames";
import type { StageDef } from "../types";
import type { TickIntroKey, TickParams, TickStep, TickTask } from "../../engine/tick/types";
import { tickKit } from "./bank";

export const TICK_WORLD_ID = "ticktock";

interface LessonSeed {
  name: string;
  tasks: TickTask[];
  intro?: TickIntroKey;
  /** Overrides the unit's settings for this lesson. */
  step?: TickStep;
  focus?: number[];
  jumps?: number[];
  /** Ids of bank templates mixed into this lesson. */
  kit?: string[];
}

interface UnitSeed {
  name: string;
  icon: string;
  hue: string;
  blurb: string;
  step: TickStep;
  focus?: number[];
  words?: boolean;
  lessons: [LessonSeed, LessonSeed, LessonSeed, LessonSeed];
  souvenir: CourseUnit["souvenir"];
}

const SEEDS: UnitSeed[] = [
  {
    name: "O'Clock", icon: iconRef("clock"), hue: "#ffd166", blurb: "The short hand tells the hour!", step: 60, words: true,
    lessons: [
      { name: "Meet the Clock", tasks: ["read", "pick-clock"], intro: "hands" },
      { name: "O'Clock Times", tasks: ["read", "set", "match"], intro: "oclock" },
      { name: "Set the Hands", tasks: ["set", "pick-clock", "order"] },
      { name: "O'Clock Champion", tasks: ["read", "set", "match", "order"] },
    ],
    souvenir: { icon: iconRef("bell"), name: "Tower Bell" },
  },
  {
    name: "Half Past", icon: iconRef("circle"), hue: "#6ea8ff", blurb: "Halfway round the clock!", step: 30, focus: [30], words: true,
    lessons: [
      { name: "Half Past", tasks: ["pick-words", "read"], intro: "half" },
      { name: "Halfway Round", tasks: ["set", "match", "pick-clock"] },
      { name: "Hours and Halves", tasks: ["read", "set", "order"], focus: [0, 30] },
      { name: "Half Past Champion", tasks: ["read", "set", "match", "pick-words"], focus: [0, 30] },
    ],
    souvenir: { icon: iconRef("medal"), name: "Half-Moon Medal" },
  },
  {
    name: "Quarters", icon: iconRef("diamond"), hue: "#ff9f43", blurb: "Quarter past and quarter to!", step: 15, focus: [15, 45], words: true,
    lessons: [
      { name: "Quarter Past", tasks: ["pick-words", "read"], intro: "quarter", focus: [15] },
      { name: "Quarter To", tasks: ["pick-words", "set", "match"], focus: [45] },
      { name: "All the Quarters", tasks: ["read", "set", "order"], focus: [0, 15, 30, 45] },
      { name: "Quarters Champion", tasks: ["read", "set", "match", "pick-words"], focus: [0, 15, 30, 45] },
    ],
    souvenir: { icon: iconRef("key"), name: "Winding Key" },
  },
  {
    name: "Count by Fives", icon: iconRef("star"), hue: "#5fd68b", blurb: "Five, ten, fifteen, twenty!", step: 5,
    lessons: [
      { name: "Five, Ten, Fifteen", tasks: ["read", "pick-clock"], intro: "fives" },
      { name: "Minutes in Fives", tasks: ["read", "set"] },
      { name: "Fast Fives", tasks: ["match", "set", "order"] },
      { name: "Fives Champion", tasks: ["read", "set", "match", "order"] },
    ],
    souvenir: { icon: iconRef("compass"), name: "Golden Dial" },
  },
  {
    name: "Every Minute", icon: iconRef("target"), hue: "#ff7eb6", blurb: "Read the clock to the minute!", step: 1,
    lessons: [
      { name: "Tiny Steps", tasks: ["read", "pick-clock"], intro: "minutes" },
      { name: "Exact Time", tasks: ["read", "set"] },
      { name: "Sharp Eyes", tasks: ["match", "order", "set"] },
      { name: "Minute Champion", tasks: ["read", "set", "match", "order"] },
    ],
    souvenir: { icon: iconRef("lens"), name: "Watchmaker's Lens" },
  },
  {
    name: "Parts of the Day", icon: iconRef("sun"), hue: "#8fd3ff", blurb: "Morning, afternoon and night!", step: 5,
    lessons: [
      { name: "Morning to Night", tasks: ["read"], kit: ["day-parts", "day-order"] },
      { name: "A.M. and P.M.", tasks: ["set"], kit: ["am-or-pm", "noon-midnight"] },
      { name: "Days of the Week", tasks: ["read"], kit: ["week-order", "day-after"] },
      { name: "Day Champion", tasks: ["read", "set"], kit: ["day-parts", "am-or-pm", "week-order", "day-order"] },
    ],
    souvenir: { icon: iconRef("calendar"), name: "Pocket Calendar" },
  },
  {
    name: "Time Travel", icon: iconRef("rocket"), hue: "#b794ff", blurb: "What time will it be later?", step: 5,
    lessons: [
      { name: "One Hour Later", tasks: ["later-read", "later-set"], intro: "later", step: 30, jumps: [60] },
      { name: "Half an Hour Later", tasks: ["later-read", "later-set", "read"], step: 30, jumps: [30, 60, 90] },
      { name: "Minutes Later", tasks: ["later-read", "later-set", "set"], jumps: [5, 10, 15, 20] },
      { name: "Time Champion", tasks: ["read", "set", "match", "order", "later-read", "later-set"], jumps: [10, 15, 30, 60] },
    ],
    souvenir: { icon: iconRef("crown"), name: "Clock Tower Crown" },
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

function buildUnit(seed: UnitSeed, unitIndex: number): CourseUnit {
  const lessons = seed.lessons.map((lesson, slot): StageDef => {
    const champion = slot === seed.lessons.length - 1;
    const kit = lesson.kit ? tickKit(lesson.kit) : [];
    const focus = lesson.focus ?? seed.focus;
    const params: TickParams = {
      tasks: lesson.tasks,
      step: lesson.step ?? seed.step,
      ...(focus ? { focus } : {}),
      ...(seed.words ? { words: true } : {}),
      ...(lesson.jumps ? { jumps: lesson.jumps } : {}),
      ...(kit.length ? { kit } : {}),
      ...(lesson.intro ? { intro: lesson.intro } : {}),
    };
    return {
      id: `tick-u${pad(unitIndex + 1)}-l${slot + 1}`,
      name: lesson.name,
      generator: "tick",
      params: params as unknown as StageDef["params"],
      questions: champion ? 10 : 8,
      mechanic: "tour",
      payout: 22 + unitIndex * 2 + (champion ? 8 : 0),
      skill: "tick",
    };
  });
  return {
    id: `tick-u${pad(unitIndex + 1)}`,
    name: seed.name, icon: seed.icon, hue: seed.hue, blurb: seed.blurb,
    lessons, chestDust: 40 + unitIndex * 10, souvenir: seed.souvenir,
  };
}

export const TICK_UNITS: CourseUnit[] = SEEDS.map(buildUnit);

let stageCount = 0;
const milestones = TICK_UNITS.map((unit) => {
  stageCount += unit.lessons.length;
  return { stage: stageCount, name: `${unit.name} Star`, icon: unit.icon };
});

export const TICK_COURSE: Course = {
  id: "tick", worldId: TICK_WORLD_ID, title: "Tick Tock", icon: iconRef("clock"),
  tagline: "Learn to tell the time!", path: "/tick", hue: "#ffd166", subject: "think", isNew: true,
  units: TICK_UNITS,
  world: {
    id: TICK_WORLD_ID, name: "Tick Tock", icon: iconRef("clock"), tagline: "Learn to tell the time!",
    stages: TICK_UNITS.flatMap((unit) => unit.lessons), milestones,
  },
};

export function tickParams(stage: StageDef): TickParams {
  return stage.params as unknown as TickParams;
}
