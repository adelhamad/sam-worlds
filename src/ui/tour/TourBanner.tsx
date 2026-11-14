import { useNavigate } from "react-router-dom";
import { COURSES, type Course } from "../../content/courses";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { useGame } from "../../state/store";
import { TOUR } from "../../strings/tour";
import { ChessPiece } from "../chess/ChessPiece";
import { Pogo } from "./Pogo";
import "./tour-base.css";
import "./tour-banner.css";

/** Courses that wear the NEW tag on the hub. */
const NEW_COURSES: string[] = ["chess"];

interface CourseTileProps {
  course: Course;
  done: number;
  /** The only course on the hub: the tile gets the big "Let's go!" button. */
  solo: boolean;
  onGo: (course: Course) => void;
}

/** One course on the hub — the whole tile is the button. */
function CourseTile({ course, done, solo, onGo }: CourseTileProps) {
  const total = course.world.stages.length;
  return (
    <button type="button" className="tb-tile" data-course={course.id} data-testid={`course-${course.id}`} onClick={() => onGo(course)}>
      {NEW_COURSES.includes(course.id) && <span className="tb-new">{TOUR.hub.newTag}</span>}
      <span className="tb-tile-icon" aria-hidden="true">
        {course.id === "chess" ? <ChessPiece type="N" size={42} /> : course.icon}
      </span>
      <span className="tb-tile-text">
        <span className="tb-tile-title">{course.title}</span>
        <span className="tb-tile-tag">{course.tagline}</span>
      </span>
      <span className="tb-tile-go" aria-hidden="true">
        {solo && <span className="tb-tile-go-word">{TOUR.hub.go}</span>}
        <span>→</span>
      </span>
      <span className="tb-tile-progress">
        <span className="tb-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${total ? done / total : 0})` }} />
        </span>
        <span className="tb-tile-count">{TOUR.hub.lessons(done, total)}</span>
      </span>
    </button>
  );
}

/** Hub home of Pogo's courses (World Tour, Chess Camp) — the way Sam finds them. */
export function TourBanner() {
  const navigate = useNavigate();
  // A course shows while its world is switched on and not hidden (Parent Section).
  const visibleIds = useGame((s) =>
    COURSES.filter((course) => s.enabledWorlds[course.worldId] && !s.hiddenWorlds[course.worldId])
      .map((course) => course.id)
      .join(","));
  const progress = useGame((s) => s.progress);
  const tourDays = useGame((s) => s.tourDays);

  const courses = COURSES.filter((course) => visibleIds.split(",").includes(course.id));
  if (courses.length === 0) return null;

  const solo = courses.length === 1;
  const go = (course: Course) => {
    unlockAudio();
    sfx.tap();
    navigate(course.path);
  };

  return (
    <section className={`tour tour-banner ${solo ? "is-solo" : "is-duo"}`}>
      <span className="tb-stars" aria-hidden="true" />
      <div className="tb-pogo" aria-hidden="true">
        <span className="tb-glow" />
        <Pogo mood="wave" size={96} />
      </div>
      <div className="tb-head">
        <h2 className="tb-title">{TOUR.hub.heading}</h2>
        <p className="tb-sub">{solo ? TOUR.hub.subOne : TOUR.hub.sub}</p>
        {tourDays > 0 && (
          <span className="tb-chip tb-chip-day"><span aria-hidden="true">🔥</span> {TOUR.hub.day(tourDays)}</span>
        )}
      </div>
      <div className="tb-tiles">
        {courses.map((course) => (
          <CourseTile
            key={course.id}
            course={course}
            done={course.world.stages.filter((stage) => progress[stage.id]?.completed).length}
            solo={solo}
            onGo={go}
          />
        ))}
      </div>
    </section>
  );
}
