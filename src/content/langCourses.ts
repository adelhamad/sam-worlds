// The language courses, as their authors wrote them (seeds) and as the game
// plays them (courses). ADDING A LANGUAGE = one seed here; docs/LANGUAGES.md.
import { ARABIC_COURSE, ARABIC_SEED } from "./arabic/course";
import type { Course } from "./courseTypes";
import type { LangCourseSeed } from "./langCourse";

export const LANG_SEEDS: LangCourseSeed[] = [ARABIC_SEED];

export const LANG_COURSES: Course[] = [ARABIC_COURSE];
