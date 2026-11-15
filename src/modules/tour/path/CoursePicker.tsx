import { Link, useNavigate } from "react-router-dom";
import type { Course } from "../../../content/courses";
import { sfx, unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { useGame } from "../../../state/store";
import { TOUR } from "../../../strings/tour";
import { CourseEmblem } from "../../../ui/tour/CourseEmblem";
import { Icon } from "../../../ui/icons/Icon";
import { hueStyle } from "./hue";
import "./picker.css";

type Progress = Record<string, { completed: boolean }>;

function lessonsDone(course: Course, progress: Progress): number {
  return course.world.stages.filter((stage) => progress[stage.id]?.completed).length;
}

interface RowProps {
  course: Course;
  active: boolean;
  done: number;
  onPick: (course: Course) => void;
}

/** One course: its emblem, its name and a slim bar of lessons done. */
function CourseRow({ course, active, done, onPick }: RowProps) {
  const total = course.world.stages.length;
  return (
    <li>
      <button
        type="button"
        className={`tp-pick-row ${active ? "is-current" : ""}`}
        style={hueStyle(course.hue)}
        data-testid={`pick-${course.id}`}
        aria-current={active ? "page" : undefined}
        aria-label={active ? course.title : TOUR.path.goTo(course.title)}
        onClick={() => onPick(course)}
      >
        <span className="tp-pick-art" aria-hidden="true"><span className="tp-emblem"><CourseEmblem course={course} size={44} /></span></span>
        <span className="tp-pick-text">
          <span className="tp-pick-name">{course.title}</span>
          <span className="tp-pick-meter" aria-label={TOUR.path.lessonsDone(done, total)}>
            <span className="tp-pick-bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${total > 0 ? done / total : 0})` }} />
            </span>
            <span className="tp-pick-num" aria-hidden="true">{done}/{total}</span>
          </span>
        </span>
        {active && <span className="tp-pick-here">{TOUR.path.here}</span>}
      </button>
    </li>
  );
}

interface CoursePickerProps {
  current: Course;
  /** Every course Sam may open right now (the current one included). */
  courses: Course[];
  onClose: () => void;
}

/** The sheet behind the courses button: hop to any course, or go home. */
export function CoursePicker({ current, courses, onClose }: CoursePickerProps) {
  const navigate = useNavigate();
  const progress = useGame((s) => s.progress);

  function pick(course: Course) {
    unlockAudio();
    if (course.id === current.id) {
      sfx.tap();
      onClose();
      return;
    }
    tourSfx.whoosh();
    navigate(course.path);
  }

  return (
    <div className="tp-scrim tp-picker-scrim" onClick={onClose}>
      <div className="tp-picker" role="dialog" aria-modal="true" aria-label={TOUR.path.pickerTitle} onClick={(event) => event.stopPropagation()}>
        <header className="tp-picker-head">
          <h2 className="tp-picker-title">{TOUR.path.pickerTitle}</h2>
          <p className="tp-picker-sub">{TOUR.path.pickerSub(courses.length)}</p>
          <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}><Icon name="close" size={18} mono /></button>
        </header>
        <ul className={`tp-picker-list ${courses.length > 3 ? "is-many" : ""}`}>
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} active={course.id === current.id} done={lessonsDone(course, progress)} onPick={pick} />
          ))}
        </ul>
        <Link to="/hub" className="tp-pick-home" data-testid="pick-home" onClick={() => sfx.tap()}>
          <Icon name="home" size={24} />
          {TOUR.path.home}
        </Link>
      </div>
    </div>
  );
}
