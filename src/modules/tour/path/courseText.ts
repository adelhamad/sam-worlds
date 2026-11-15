// The few lines of a path screen that depend on the course, plus the lookup
// from the URL to the course it shows. Generic: per-course flavour comes from
// courseFamilies.ts.
import { COURSES, type Course } from "../../../content/courses";
import { TOUR } from "../../../strings/tour";
import { courseFamily } from "./courseFamilies";

export interface CourseText {
  title: string;
  /** Pogo's line once every lesson of the course is done. */
  finished: string;
  finishedSub: string;
  /** Name of the collection button in the top bar. */
  collection: string;
}

export function courseText(course: Course): CourseText {
  const family = courseFamily(course);
  return {
    title: TOUR.path.courseTitle(course.title),
    finished: family.finished(course),
    finishedSub: family.finishedSub,
    collection: family.label,
  };
}

/** A course's path and anything below it shows that course; anything else falls back to the first. */
export function courseOfPath(pathname: string): Course {
  return COURSES.find((course) => pathname === course.path || pathname.startsWith(`${course.path}/`)) ?? COURSES[0];
}
