// defineKitCourse — turns a declarative course (units → lessons → template ids
// + a template bank) into a full Course: stages, world, trophies. A kit course
// is DATA ONLY; see docs/COURSE_KIT.md for the authoring guide.
import type { Course, CourseSubject, CourseUnit } from "./courseTypes";
import type { StageDef } from "./types";
import type { KitParams, KitSlide, KitTemplate } from "../engine/kit/types";

export interface KitLessonSeed {
  name: string;
  /** Ids of bank templates this lesson draws from (2–5). */
  templates: string[];
  /** Teach-first slides shown before the first question. */
  intro?: KitSlide[];
}

export interface KitUnitSeed {
  name: string;
  icon: string;
  hue: string;
  /** One short line under the unit banner (≤ 8 simple words). */
  blurb: string;
  souvenir: { icon: string; name: string };
  /** 3–5 lessons; the last one is the unit's champion lesson. */
  lessons: KitLessonSeed[];
}

export interface KitCourseSeed {
  /** Short permanent id, e.g. "ai". Stage ids become `<id>-u01-l1`. */
  id: string;
  worldId: string;
  title: string;
  icon: string;
  tagline: string;
  path: string;
  hue: string;
  subject: CourseSubject;
  isNew?: boolean;
  units: KitUnitSeed[];
  bank: KitTemplate[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function defineKitCourse(seed: KitCourseSeed): Course {
  const byId = new Map(seed.bank.map((template) => [template.id, template]));
  const pick = (ids: string[], where: string): KitTemplate[] =>
    ids.map((id) => {
      const template = byId.get(id);
      if (!template) throw new Error(`${seed.id}: unknown template "${id}" in ${where}`);
      return template;
    });

  const seen: KitTemplate[] = [];
  const units: CourseUnit[] = seed.units.map((unit, unitIndex) => {
    const lessons = unit.lessons.map((lesson, slot): StageDef => {
      const champion = slot === unit.lessons.length - 1;
      const templates = pick(lesson.templates, `${unit.name} / ${lesson.name}`);
      const params: KitParams = {
        templates,
        review: seen.filter((template) => !templates.includes(template)),
        ...(lesson.intro ? { intro: lesson.intro } : {}),
      };
      for (const template of templates) if (!seen.includes(template)) seen.push(template);
      return {
        id: `${seed.id}-u${pad(unitIndex + 1)}-l${slot + 1}`,
        name: lesson.name,
        generator: "kit",
        params: params as unknown as StageDef["params"],
        questions: champion ? 10 : 8,
        mechanic: "tour",
        payout: 20 + unitIndex * 2 + (champion ? 8 : 0),
        skill: seed.id,
      };
    });
    return {
      id: `${seed.id}-u${pad(unitIndex + 1)}`,
      name: unit.name, icon: unit.icon, hue: unit.hue, blurb: unit.blurb,
      lessons, chestDust: 40 + unitIndex * 10, souvenir: unit.souvenir,
    };
  });

  let stageCount = 0;
  const milestones = units.map((unit) => {
    stageCount += unit.lessons.length;
    return { stage: stageCount, name: `${unit.name} Star`, icon: unit.icon };
  });

  return {
    id: seed.id, worldId: seed.worldId, title: seed.title, icon: seed.icon, tagline: seed.tagline,
    path: seed.path, hue: seed.hue, subject: seed.subject, isNew: seed.isNew, units,
    world: {
      id: seed.worldId, name: seed.title, icon: seed.icon, tagline: seed.tagline,
      stages: units.flatMap((unit) => unit.lessons), milestones,
    },
  };
}

export function kitParams(stage: StageDef): KitParams {
  return stage.params as unknown as KitParams;
}
