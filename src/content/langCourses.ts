// The language courses, as their authors wrote them (seeds) and as the game
// plays them (courses). ADDING A LANGUAGE = one seed here; docs/LANGUAGES.md.
import { ARABIC_COURSE, ARABIC_SEED } from "./arabic/course";
import type { Course } from "./courseTypes";
import { FRENCH_COURSE, FRENCH_SEED } from "./french/course";
import type { LangCourseSeed } from "./langCourse";

export const LANG_SEEDS: LangCourseSeed[] = [ARABIC_SEED, FRENCH_SEED];

export const LANG_COURSES: Course[] = [ARABIC_COURSE, FRENCH_COURSE];
