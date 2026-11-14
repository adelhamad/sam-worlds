// The few lines of a path screen that differ per course, plus the lookup from
// the URL to the course it shows.
import { COURSES, type Course } from "../../../content/courses";
import { CHESS } from "../../../strings/chess";
import { TOUR } from "../../../strings/tour";

export interface CourseText {
  title: string;
  /** Pogo's line once every lesson of the course is done. */
  finished: string;
  finishedSub: string;
  /** Name of the collection button in the top bar. */
  collection: string;
}

export function courseText(course: Course): CourseText {
  if (course.id === "chess") {
    return {
      title: CHESS.path.title,
      finished: CHESS.path.finished,
      finishedSub: CHESS.path.finishedSub,
      collection: CHESS.path.set,
    };
  }
  return {
    title: TOUR.path.title,
    finished: TOUR.path.finished,
    finishedSub: TOUR.path.finishedSub,
    collection: TOUR.path.passport,
  };
}

/** `/chess` and anything below it is Chess Camp; everything else falls back to the first course. */
export function courseOfPath(pathname: string): Course {
  return COURSES.find((course) => pathname === course.path || pathname.startsWith(`${course.path}/`)) ?? COURSES[0];
}
