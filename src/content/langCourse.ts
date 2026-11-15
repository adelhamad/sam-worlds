// defineLangCourse — turns a language course written as data (unit packs:
// phrases, real-life scenes, lessons) into a full Course: stages, world,
// trophies. Authoring guide: docs/LANGUAGES.md. Never reorder or rename units
// or lessons once shipped — stage ids (`<id>-u01-l1`) are saved.
import type { Course, CourseUnit } from "./courseTypes";
import type { StageDef } from "./types";
import type { LangCode, LangLessonKind, LangParams, LetterCard, Phrase, Scene } from "../engine/lang/types";

export interface LangLessonSeed {
  /** On the path (≤ 22 characters). */
  name: string;
  kind: LangLessonKind;
  /** New phrases taught here (ids from this pack), 3–5 for a "words" lesson. */
  teach?: string[];
  /** Scenes practised here (ids from this pack). */
  scenes?: string[];
  /** Arabic: the letters practised here, as the characters themselves: ["ا", "ب"]. */
  letters?: string[];
  /** Single words to spell from letter tiles (phrase ids taught in this lesson or earlier). */
  spell?: string[];
  /** A thing to do in real life afterwards (≤ 16 words): "Say 'yislamo' to someone at home today." */
  mission?: string;
}

export interface LangUnitSeed {
  name: string;
  icon: string;
  hue: string;
  /** One short line under the unit banner (≤ 8 simple words). */
  blurb: string;
  souvenir: { icon: string; name: string };
  lessons: LangLessonSeed[];
}

/** One unit as its author writes it: the unit, its phrases and its scenes. */
export interface LangUnitPack {
  unit: LangUnitSeed;
  phrases: Phrase[];
  scenes: Scene[];
}

export interface LangCourseSeed {
  /** Short permanent id, e.g. "arabic". Stage ids become `<id>-u01-l1`. */
  id: string;
  worldId: string;
  lang: LangCode;
  title: string;
  icon: string;
  tagline: string;
  path: string;
  hue: string;
  isNew?: boolean;
  packs: LangUnitPack[];
  /** The alphabet (Arabic), for letter lessons. */
  letters?: LetterCard[];
  /** 1-based unit from which reading without Latin help is practised. */
  readsFromUnit?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const QUESTIONS: Record<LangLessonKind, number> = { words: 10, talk: 10, letters: 10, review: 12 };

function resolver<T>(courseId: string, what: string, items: T[], key: (item: T) => string) {
  const byKey = new Map(items.map((item) => [key(item), item]));
  return (ids: string[] | undefined, where: string): T[] =>
    (ids ?? []).map((id) => {
      const item = byKey.get(id);
      if (!item) throw new Error(`${courseId}: unknown ${what} "${id}" in ${where}`);
      return item;
    });
}

export function defineLangCourse(seed: LangCourseSeed): Course {
  const phrases = resolver(seed.id, "phrase", seed.packs.flatMap((pack) => pack.phrases), (phrase) => phrase.id);
  const scenes = resolver(seed.id, "scene", seed.packs.flatMap((pack) => pack.scenes), (scene) => scene.id);
  const letters = resolver(seed.id, "letter", seed.letters ?? [], (letter) => letter.char);

  const taught: Phrase[] = [];
  const alphabet: LetterCard[] = [];
  const units: CourseUnit[] = seed.packs.map(({ unit }, unitIndex) => {
    const lessons = unit.lessons.map((lesson, slot): StageDef => {
      const where = `${unit.name} / ${lesson.name}`;
      const last = slot === unit.lessons.length - 1;
      const teach = phrases(lesson.teach, where);
      const lessonLetters = letters(lesson.letters, where);
      for (const letter of lessonLetters) if (!alphabet.includes(letter)) alphabet.push(letter);
      const params: LangParams = {
        lang: seed.lang,
        kind: lesson.kind,
        teach,
        review: taught.filter((phrase) => !teach.includes(phrase)),
        scenes: scenes(lesson.scenes, where),
        letters: lessonLetters,
        alphabet: [...alphabet],
        spell: phrases(lesson.spell, where),
        reads: unitIndex + 1 >= (seed.readsFromUnit ?? Infinity),
        // Latin letters are known from the start; Arabic words are spelled once reading has begun.
        spellAny: seed.lang !== "ar" || unitIndex + 1 >= (seed.readsFromUnit ?? Infinity),
        ...(lesson.mission ? { mission: lesson.mission } : {}),
      };
      for (const phrase of teach) if (!taught.includes(phrase)) taught.push(phrase);
      return {
        id: `${seed.id}-u${pad(unitIndex + 1)}-l${slot + 1}`,
        name: lesson.name,
        generator: "lang",
        params: params as unknown as StageDef["params"],
        questions: QUESTIONS[lesson.kind],
        mechanic: "tour",
        payout: 22 + Math.min(unitIndex, 14) * 2 + (last ? 8 : 0),
        skill: `lang-${seed.id}`,
      };
    });
    return {
      id: `${seed.id}-u${pad(unitIndex + 1)}`,
      name: unit.name, icon: unit.icon, hue: unit.hue, blurb: unit.blurb,
      lessons, chestDust: Math.min(150, 40 + unitIndex * 6), souvenir: unit.souvenir,
    };
  });

  let stageCount = 0;
  const milestones = units.map((unit) => {
    stageCount += unit.lessons.length;
    return { stage: stageCount, name: `${unit.name} Star`, icon: unit.icon };
  });

  return {
    id: seed.id, worldId: seed.worldId, title: seed.title, icon: seed.icon, tagline: seed.tagline,
    path: seed.path, hue: seed.hue, subject: "languages", isNew: seed.isNew, units,
    world: {
      id: seed.worldId, name: seed.title, icon: seed.icon, tagline: seed.tagline,
      stages: units.flatMap((unit) => unit.lessons), milestones,
    },
  };
}

export function langParams(stage: StageDef): LangParams {
  return stage.params as unknown as LangParams;
}
