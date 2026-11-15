// "Learn with Pogo" — the course shelf, the heart of the home. One grid while
// there are few courses; small subject shelves once there are many.
import { useNavigate } from "react-router-dom";
import type { Course, CourseSubject } from "../../content/courseTypes";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { HOME } from "../../strings/home";
import { CourseEmblem } from "../tour/CourseEmblem";
import { Icon } from "../icons/Icon";
import { inkOn, useMedia } from "./hooks";
import { courseStatus, type CourseStatus } from "./nextAction";

const T = HOME.home;
const SUBJECTS: CourseSubject[] = ["explore", "think", "create"];
/** Above this many courses the shelf splits by subject. */
const GROUP_ABOVE = 6;

type Chip = { kind: "new" | "chest" | "next" | "done"; text: string } | null;

function chipOf(course: Course, status: CourseStatus): Chip {
  if (status.chestUnit) return { kind: "chest", text: T.chestReady };
  if (status.allDone) return { kind: "done", text: T.allDone };
  if (status.done > 0 && status.nextUnit) return { kind: "next", text: T.nextUnit(status.nextUnit.name) };
  if (course.isNew) return { kind: "new", text: T.newTag };
  return null;
}

interface CourseCardProps {
  course: Course;
  status: CourseStatus;
  index: number;
  art: number;
  onOpen: (course: Course) => void;
}

function CourseCard({ course, status, index, art, onOpen }: CourseCardProps) {
  const chip = chipOf(course, status);
  const style = { "--hue": course.hue, "--ink": inkOn(course.hue), "--i": index } as React.CSSProperties;
  const corner = chip && (chip.kind === "new" || chip.kind === "chest");
  return (
    <button
      type="button"
      className={["ccard", "home-rise", chip ? "has-" + chip.kind : ""].join(" ")}
      style={style}
      data-testid={`course-${course.id}`}
      onClick={() => onOpen(course)}
    >
      {corner && <span className={`ccard-tag is-${chip.kind}`}>{chip.kind === "chest" && <><Icon name="chest" size="1.2em" />{" "}</>}{chip.text}</span>}
      <span className="ccard-art"><CourseEmblem course={course} size={art} /></span>
      <span className="ccard-title">{course.title}</span>
      {chip && !corner && (
        <span className={`ccard-status is-${chip.kind}`}>{chip.kind === "done" && <><Icon name="check" size="1.1em" />{" "}</>}{chip.text}</span>
      )}
      <span className="ccard-progress" aria-label={T.lessonsLabel(status.done, status.total)}>
        <span className="ccard-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${status.total ? status.done / status.total : 0})` }} />
        </span>
        <span className="ccard-count" aria-hidden="true">{T.lessons(status.done, status.total)}</span>
      </span>
    </button>
  );
}

export interface CourseShelfProps {
  courses: Course[];
  progress: Record<string, { completed: boolean }>;
  tourChests: string[];
}

export function CourseShelf({ courses, progress, tourChests }: CourseShelfProps) {
  const navigate = useNavigate();
  const wide = useMedia("(min-width: 600px)");
  if (courses.length === 0) return null;
  const open = (course: Course) => {
    unlockAudio();
    sfx.tap();
    navigate(course.path);
  };
  const grouped = courses.length > GROUP_ABOVE;
  const shelves = grouped
    ? SUBJECTS.map((subject) => ({ subject, list: courses.filter((course) => course.subject === subject) })).filter((shelf) => shelf.list.length)
    : [{ subject: null, list: courses }];
  let index = 0;

  return (
    <section className="home-shelf" aria-labelledby="home-shelf-title">
      <header className="home-sec-head home-rise" style={{ "--i": 3 } as React.CSSProperties}>
        <h2 id="home-shelf-title" className="home-h2"><Icon name="rocket" size="1.1em" /> {T.courses}</h2>
        <p className="home-sec-sub">{T.shelfSub}</p>
      </header>
      {shelves.map(({ subject, list }) => (
        <div key={subject ?? "all"} className="home-shelf-group">
          {subject && <h3 className="home-shelf-sub">{T.subjects[subject]}</h3>}
          <div className="home-courses">
            {list.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                status={courseStatus(course, progress, tourChests)}
                index={4 + Math.min(8, index++)}
                art={wide ? 108 : 92}
                onOpen={open}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
