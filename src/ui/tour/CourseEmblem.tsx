// The picture that stands for a course (home shelf, path, course picker).
// Courses with drawn art get it (EmblemArt.tsx); any other course falls back to
// its drawn icon (`icon:<name>`) on a chunky rounded badge in the course hue, so
// a course added without art still looks at home. Readable from 32 px to 120 px.
import type { CSSProperties, ReactElement } from "react";
import type { Course } from "../../content/courseTypes";
import { Glyph } from "../icons/Icon";
import "@fontsource-variable/noto-sans-arabic";
import { ArabicArt, BlocksArt, ChessArt, FrenchArt, GlobeArt, RobotArt } from "./EmblemArt";
import "./course-emblem.css";

export interface CourseEmblemProps {
  course: Course;
  /** Rendered height in px. */
  size?: number;
  className?: string;
}

const ART: Record<string, () => ReactElement> = {
  tour: GlobeArt,
  chess: ChessArt,
  code: BlocksArt,
  ai: RobotArt,
  arabic: ArabicArt,
  french: FrenchArt,
};

export function CourseEmblem({ course, size = 64, className = "" }: CourseEmblemProps) {
  const Art = ART[course.id];
  const style = { width: size, height: size, "--ce-hue": course.hue, "--ce-s": `${size}px` } as CSSProperties;
  if (Art) {
    return (
      <span className={`course-emblem is-art ${className}`} style={style} aria-hidden="true">
        <Art />
      </span>
    );
  }
  return (
    <span className={`course-emblem is-badge ${className}`} style={style} aria-hidden="true">
      <span className="ce-badge">
        <span className="ce-badge-icon"><Glyph value={course.icon} size={Math.round(size * 0.58)} /></span>
      </span>
    </span>
  );
}
