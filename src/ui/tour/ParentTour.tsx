import { useState } from "react";
import { COURSES, type Course } from "../../content/courses";
import { TOUR_COUNTRIES } from "../../content/tour/units";
import { useGame } from "../../state/store";
import { STAMP_GOAL } from "../../state/tour";
import { TOUR } from "../../strings/tour";

type Pending = "passport" | "chests" | null;

function chestsOpened(course: Course, opened: string[]): number {
  return course.units.filter((unit) => opened.includes(unit.id)).length;
}

/** One line per course: lessons, chests and (geography) passport stamps. */
function CourseSummary({ course }: { course: Course }) {
  const progress = useGame((s) => s.progress);
  const tourStamps = useGame((s) => s.tourStamps);
  const tourChests = useGame((s) => s.tourChests);
  const stages = course.world.stages;
  const lessons = stages.filter((stage) => progress[stage.id]?.completed).length;
  const stamps = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) >= STAMP_GOAL).length;
  const started = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) > 0).length - stamps;
  return (
    <p className="dim">
      <strong>{course.title}</strong>
      {" — "}
      {TOUR.parent.course(lessons, stages.length, chestsOpened(course, tourChests), course.units.length)}
      {course.id === "tour" && ` · ${TOUR.parent.stamps(stamps, TOUR_COUNTRIES.length)}`}
      {course.id === "tour" && started > 0 && ` · ${started} more on the way to a stamp`}
    </p>
  );
}

/** Controls for Pogo's courses (CLAUDE.md rule 2: persisted state needs view/edit/reset). */
export function TourControls() {
  const tourChests = useGame((s) => s.tourChests);
  const tourDays = useGame((s) => s.tourDays);
  const setTourDays = useGame((s) => s.setTourDays);
  const resetTourPassport = useGame((s) => s.resetTourPassport);
  const resetCourseChests = useGame((s) => s.resetCourseChests);
  const [daysInput, setDaysInput] = useState(String(tourDays));
  const [pending, setPending] = useState<Pending>(null);

  const ranges = COURSES.map((course) => `${course.title} 0–${course.world.stages.length}`).join(", ");
  const names = COURSES.map((course) => course.title).join(" or ");

  return (
    <section className="panel parent-block">
      <h2>{TOUR.parent.heading}</h2>
      {COURSES.map((course) => <CourseSummary key={course.id} course={course} />)}
      <p className="dim">{TOUR.parent.days(tourDays)}</p>
      <p className="dim">
        Lesson progress is set under “World progress” ({ranges}); lock or hide {names} in the world access
        controls like any other world — a locked or hidden course leaves the hub banner. A passport stamp needs{" "}
        {STAMP_GOAL} first-try answers. Tour days only ever grow — a count of days played, not a streak.
      </p>
      <div className="parent-row">
        <span className="parent-world-name">Set tour days</span>
        <input
          className="parent-input parent-input-sm"
          type="number"
          min={0}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setTourDays(Number(daysInput) || 0)}>
          Set
        </button>
      </div>
      {pending === "passport" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetTourPassport(); setPending(null); }}>
            Yes, clear all stamps
          </button>
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("passport")}>Reset passport stamps…</button>
        </div>
      )}
      {pending === "chests" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          {COURSES.map((course) => (
            <button
              key={course.id}
              className="btn btn-danger"
              disabled={chestsOpened(course, tourChests) === 0}
              onClick={() => { resetCourseChests(course.id); setPending(null); }}
            >
              Yes, close {course.title} chests ({chestsOpened(course, tourChests)})
            </button>
          ))}
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("chests")}>Reset treasure chests…</button>
        </div>
      )}
      <p className="dim">
        Resetting chests closes them again for that course only, so he can re-open each finished unit’s chest and
        collect its Star Dust once more. Star Dust already earned is kept.
      </p>
    </section>
  );
}
