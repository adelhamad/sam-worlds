// Bonjour French — everyday spoken French for a child: what to say to
// friends, family, teachers and shopkeepers. Units are written one per file
// (./units/uNN.ts); see docs/LANGUAGES.md.
import type { Course } from "../courseTypes";
import { iconRef } from "../iconNames";
import { defineLangCourse, type LangCourseSeed } from "../langCourse";
import { U01 } from "./units/u01";
import { U02 } from "./units/u02";
import { U03 } from "./units/u03";
import { U04 } from "./units/u04";
import { U05 } from "./units/u05";
import { U06 } from "./units/u06";
import { U07 } from "./units/u07";
import { U08 } from "./units/u08";
import { U09 } from "./units/u09";
import { U10 } from "./units/u10";
import { U11 } from "./units/u11";
import { U12 } from "./units/u12";
import { U13 } from "./units/u13";
import { U14 } from "./units/u14";
import { U15 } from "./units/u15";
import { U16 } from "./units/u16";

export const FRENCH_WORLD_ID = "french";

export const FRENCH_SEED: LangCourseSeed = {
  id: "french", worldId: FRENCH_WORLD_ID, lang: "fr", title: "Bonjour French", icon: iconRef("chat"),
  tagline: "Talk with friends in French!", path: "/french", hue: "#7c9cff", isNew: true,
  readsFromUnit: 1,
  packs: [U01, U02, U03, U04, U05, U06, U07, U08, U09, U10, U11, U12, U13, U14, U15, U16],
};

export const FRENCH_COURSE: Course = defineLangCourse(FRENCH_SEED);
