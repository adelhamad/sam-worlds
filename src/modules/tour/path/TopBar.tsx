import { useState } from "react";
import { Link } from "react-router-dom";
import type { Course } from "../../../content/courses";
import { sfx, unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { useGame } from "../../../state/store";
import { TOUR } from "../../../strings/tour";
import { CourseEmblem } from "../../../ui/tour/CourseEmblem";
import { Icon } from "../../../ui/icons/Icon";
import { courseFamily } from "./courseFamilies";
import { CoursePicker } from "./CoursePicker";

/** 12345 becomes "12k": big Star Dust counts on phones too narrow for every digit. */
function shortCount(value: number): string {
  return value >= 10000 ? `${Math.floor(value / 1000)}k` : String(value);
}

/** The course's collection in the top bar: owned/total with the family's glyph. */
function CollectionChip({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const family = courseFamily(course);
  const total = family.total(course);
  const count = useGame((s) => family.owned(s, course));
  const { Glyph } = family;
  return (
    <button
      type="button"
      className="tp-chip tp-chip-pass"
      data-testid="collection"
      aria-label={`${family.label} ${count}/${total}`}
      onClick={onOpen}
    >
      <Glyph />
      {count}/{total}
    </button>
  );
}

function DustChip() {
  const starDust = useGame((s) => s.starDust);
  return (
    <span className="tp-chip tp-chip-dust" aria-label={String(starDust)}>
      <Icon name="dust" size="1.15em" />
      <span className="tp-dust-long" aria-hidden="true">{starDust}</span>
      <span className="tp-dust-short" aria-hidden="true">{shortCount(starDust)}</span>
    </span>
  );
}

function DayChip() {
  const tourDays = useGame((s) => s.tourDays);
  if (tourDays <= 0) return null;
  return (
    <span className="tp-chip tp-chip-day" aria-label={TOUR.path.day(tourDays)}>
      <Icon name="flame" size="1.15em" />
      <span className="tp-day-long" aria-hidden="true">{TOUR.path.day(tourDays)}</span>
      <span className="tp-day-short" aria-hidden="true">{tourDays}</span>
    </span>
  );
}

interface TopBarProps {
  course: Course;
  /** Courses the picker offers (the current one included). */
  courses: Course[];
  onCollection: () => void;
}

/** Back home, the courses button, Star Dust, the day streak and the collection. */
export function TopBar({ course, courses, onCollection }: TopBarProps) {
  const [picking, setPicking] = useState(false);
  return (
    <>
      <header className="tp-bar">
        <Link to="/hub" className="tbtn tbtn-ghost tp-back" aria-label={TOUR.path.back} onClick={() => sfx.tap()}>
          <Icon name="back" size={20} mono />
          <span className="tp-back-word">{TOUR.path.back}</span>
        </Link>
        <button
          type="button"
          className="tp-course-btn"
          data-testid="courses"
          aria-haspopup="dialog"
          aria-label={`${TOUR.path.courses}: ${course.title}`}
          onClick={() => { unlockAudio(); tourSfx.whoosh(); setPicking(true); }}
        >
          <span className="tp-emblem tp-course-emblem" aria-hidden="true"><CourseEmblem course={course} size={32} /></span>
          <span className="tp-course-name" aria-hidden="true">{course.title}</span>
          <span className="tp-course-caret" aria-hidden="true"><Icon name="arrow-down" size={12} mono /></span>
        </button>
        <div className="tp-chips">
          <DustChip />
          <DayChip />
          <CollectionChip course={course} onOpen={onCollection} />
        </div>
      </header>
      {picking && <CoursePicker current={course} courses={courses} onClose={() => setPicking(false)} />}
    </>
  );
}
