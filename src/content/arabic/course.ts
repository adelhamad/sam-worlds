// Yalla Arabic — spoken Levantine Arabic for real life at home: what to say to
// Mama, Baba, Teta and Jiddo, plus the alphabet to read and write. Units are
// written one per file (./units/uNN.ts); see docs/LANGUAGES.md.
import type { Course } from "../courseTypes";
import { iconRef } from "../iconNames";
import { defineLangCourse, type LangCourseSeed } from "../langCourse";
import { ARABIC_ALPHABET } from "./alphabet";
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
import { U17 } from "./units/u17";
import { U18 } from "./units/u18";
import { U19 } from "./units/u19";
import { U20 } from "./units/u20";
import { U21 } from "./units/u21";
import { U22 } from "./units/u22";
import { U23 } from "./units/u23";
import { U24 } from "./units/u24";

// Not "arabic": that id belongs to the classic Letter Garden world, and saves refer to it.
export const ARABIC_WORLD_ID = "yalla";

export const ARABIC_SEED: LangCourseSeed = {
  id: "arabic", worldId: ARABIC_WORLD_ID, lang: "ar", title: "Yalla Arabic", icon: iconRef("chat"),
  tagline: "Talk with the family in Arabic!", path: "/arabic", hue: "#ff9f6e", isNew: true,
  letters: ARABIC_ALPHABET, readsFromUnit: 9,
  packs: [
    U01, U02, U03, U04, U05, U06, U07, U08, U09, U10, U11, U12,
    U13, U14, U15, U16, U17, U18, U19, U20, U21, U22, U23, U24,
  ],
};

export const ARABIC_COURSE: Course = defineLangCourse(ARABIC_SEED);
