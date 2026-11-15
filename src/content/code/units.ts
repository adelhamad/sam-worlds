// Code Lab curriculum — units and lessons are DATA. Pogo walks a grid by
// following programs the child builds: steps in order, reading code, fixing
// bugs, loops, then smart thinking (ordering, rules, patterns) with Course
// Kit cards from ./bank.ts. Each lesson lists its code tasks and kit
// templates; the planner (engine/code) rotates them and finishes on a
// build-and-run puzzle. Stage ids are permanent: only ever APPEND units or lessons.
import type { Course, CourseUnit } from "../courseTypes";
import { iconRef } from "../iconNames";
import type { StageDef } from "../types";
import type { CodeIntroKey, CodeParams, CodeTask } from "../../engine/code/types";
import type { KitTemplate } from "../../engine/kit/types";
import { codeKit } from "./bank";

export const CODE_WORLD_ID = "codelab";

interface LessonSeed {
  name: string;
  tasks: CodeTask[];
  intro?: CodeIntroKey;
  /** Course Kit templates mixed into this lesson. */
  kit?: KitTemplate[];
}

interface UnitSeed {
  name: string;
  icon: string;
  hue: string;
  blurb: string;
  size: number;
  lessons: LessonSeed[];
  souvenir: CourseUnit["souvenir"];
}

const SEEDS: UnitSeed[] = [
  {
    name: "First Steps", icon: iconRef("footprints"), hue: "#5fd68b", blurb: "One step, then the next!", size: 4,
    lessons: [
      { name: "Step by Step", tasks: ["run"], intro: "sequence" },
      { name: "Star Path", tasks: ["stars", "run"], intro: "stars" },
      { name: "Short and Sweet", tasks: ["run", "stars"] },
      { name: "Steps Champion", tasks: ["run", "stars"] },
    ],
    souvenir: { icon: iconRef("compass"), name: "Golden Compass" },
  },
  {
    name: "Be the Computer", icon: iconRef("laptop"), hue: "#6ea8ff", blurb: "Read the code like a computer!", size: 5,
    lessons: [
      { name: "Read the Code", tasks: ["trace"], intro: "trace" },
      { name: "In Order", tasks: ["trace"], kit: codeKit("code-steps-kitchen", "code-steps-day") },
      { name: "Follow the Arrows", tasks: ["trace", "stars"] },
      { name: "Reader Champion", tasks: ["trace", "run", "stars"], kit: codeKit("code-steps-day") },
    ],
    souvenir: { icon: iconRef("brain"), name: "Robot Brain" },
  },
  {
    name: "Bug Hunt", icon: iconRef("bug"), hue: "#ff9f43", blurb: "Find the bug and fix it!", size: 5,
    lessons: [
      { name: "Find the Bug", tasks: ["debug"], intro: "bug" },
      { name: "Fix It", tasks: ["debug", "trace"] },
      { name: "Test and Fix", tasks: ["debug", "stars"] },
      { name: "Bug Champion", tasks: ["trace", "run", "stars", "debug"] },
    ],
    souvenir: { icon: iconRef("lens"), name: "Bug Finder Lens" },
  },
  {
    name: "Loop the Loop", icon: iconRef("loop"), hue: "#b794ff", blurb: "Do it again with loops!", size: 6,
    lessons: [
      { name: "Again and Again", tasks: ["loop"], intro: "loop" },
      { name: "Loop Reader", tasks: ["loop-trace", "loop"] },
      { name: "Loops and Stars", tasks: ["loop", "stars", "loop-trace"] },
      { name: "Loop Champion", tasks: ["loop-trace", "debug", "stars", "loop"] },
    ],
    souvenir: { icon: iconRef("medal"), name: "Swirl Badge" },
  },
  {
    name: "Smart Thinking", icon: iconRef("bulb"), hue: "#ffd166", blurb: "Sort, follow rules, spot patterns!", size: 6,
    lessons: [
      {
        name: "Sort It Out", tasks: ["run"],
        kit: codeKit("code-order-numbers", "code-order-sizes", "code-order-tall", "code-sort-numbers"),
      },
      { name: "If… Then", tasks: ["debug"], kit: codeKit("code-if-rain", "code-if-light", "code-if-wheels") },
      { name: "Spot the Pattern", tasks: ["loop-trace", "loop"], kit: codeKit("code-pattern-row", "code-pattern-next") },
      { name: "Code Champion", tasks: ["trace", "run", "stars", "debug", "loop-trace", "loop"] },
    ],
    souvenir: { icon: iconRef("crown"), name: "Code Crown" },
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

function buildUnit(seed: UnitSeed, unitIndex: number): CourseUnit {
  const lessons = seed.lessons.map((lesson, slot): StageDef => {
    const champion = slot === seed.lessons.length - 1;
    const params: CodeParams = {
      tasks: lesson.tasks,
      size: seed.size,
      ...(lesson.kit ? { kit: lesson.kit } : {}),
      ...(lesson.intro ? { intro: lesson.intro } : {}),
    };
    return {
      id: `code-u${pad(unitIndex + 1)}-l${slot + 1}`,
      name: lesson.name,
      generator: "code",
      params: params as unknown as StageDef["params"],
      questions: champion ? 10 : 8,
      mechanic: "tour",
      payout: 22 + unitIndex * 2 + (champion ? 8 : 0),
      skill: "code",
    };
  });
  return {
    id: `code-u${pad(unitIndex + 1)}`,
    name: seed.name, icon: seed.icon, hue: seed.hue, blurb: seed.blurb,
    lessons, chestDust: 40 + unitIndex * 10, souvenir: seed.souvenir,
  };
}

export const CODE_UNITS: CourseUnit[] = SEEDS.map(buildUnit);

let stageCount = 0;
const milestones = CODE_UNITS.map((unit) => {
  stageCount += unit.lessons.length;
  return { stage: stageCount, name: `${unit.name} Star`, icon: unit.icon };
});

export const CODE_COURSE: Course = {
  id: "code", worldId: CODE_WORLD_ID, title: "Code Lab", icon: iconRef("puzzle"),
  tagline: "Tell Pogo what to do — with code!", path: "/code", hue: "#5fd68b", subject: "think", isNew: true,
  units: CODE_UNITS,
  world: {
    id: CODE_WORLD_ID, name: "Code Lab", icon: iconRef("puzzle"), tagline: "Tell Pogo what to do — with code!",
    stages: CODE_UNITS.flatMap((unit) => unit.lessons), milestones,
  },
};

export function codeParams(stage: StageDef): CodeParams {
  return stage.params as unknown as CodeParams;
}
