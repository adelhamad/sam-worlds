// Yalla Arabic — spoken Levantine Arabic for real life at home: what to say to
// Mama, Baba, Teta and Jiddo, plus the alphabet to read and write. Units are
// written one per file (./units/uNN.ts); see docs/LANGUAGES.md.
import type { Course } from "../courseTypes";
import { iconRef } from "../iconNames";
import { defineLangCourse, type LangCourseSeed } from "../langCourse";
import { ARABIC_ALPHABET } from "./alphabet";
import { U01 } from "./units/u01";

export const ARABIC_WORLD_ID = "arabic";

export const ARABIC_SEED: LangCourseSeed = {
  id: "arabic", worldId: ARABIC_WORLD_ID, lang: "ar", title: "Yalla Arabic", icon: iconRef("chat"),
  tagline: "Talk with the family in Arabic!", path: "/arabic", hue: "#ff9f6e", isNew: true,
  letters: ARABIC_ALPHABET, readsFromUnit: 9,
  packs: [U01],
};

export const ARABIC_COURSE: Course = defineLangCourse(ARABIC_SEED);
