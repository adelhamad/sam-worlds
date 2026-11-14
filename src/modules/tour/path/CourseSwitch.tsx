import { useNavigate } from "react-router-dom";
import type { Course } from "../../../content/courses";
import { unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { TOUR } from "../../../strings/tour";
import { CourseIcon } from "./CourseIcon";

interface CourseSwitchProps {
  /** The course this path shows. */
  current: Course;
  /** Every course Sam can open right now (the current one included). */
  courses: Course[];
}

/**
 * Hop between Pogo's courses from the top bar. Tablets get both names side by
 * side; phones only have room for the way to the other course.
 */
export function CourseSwitch({ current, courses }: CourseSwitchProps) {
  const navigate = useNavigate();
  return (
    <nav className="tp-switch" aria-label={TOUR.path.courses}>
      {courses.map((course) => {
        const active = course.id === current.id;
        return (
          <button
            key={course.id}
            type="button"
            className={`tp-switch-seg ${active ? "is-active" : ""}`}
            data-testid={`switch-${course.id}`}
            aria-current={active ? "page" : undefined}
            aria-label={active ? course.title : TOUR.path.goTo(course.title)}
            onClick={() => {
              if (active) return;
              unlockAudio();
              tourSfx.whoosh();
              navigate(course.path);
            }}
          >
            <span className="tp-switch-icon" aria-hidden="true"><CourseIcon course={course} size={26} /></span>
            <span className="tp-switch-name">{course.title}</span>
            {!active && <span className="tp-switch-swap" aria-hidden="true">⇄</span>}
          </button>
        );
      })}
    </nav>
  );
}
