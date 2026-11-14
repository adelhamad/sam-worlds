import type { Course } from "../../../content/courses";
import { ChessPiece } from "../../../ui/chess/ChessPiece";

/** A course's little picture: Chess Camp gets real piece art, others their emoji. */
export function CourseIcon({ course, size = 24 }: { course: Course; size?: number }) {
  if (course.id === "chess") return <ChessPiece type="N" size={size} />;
  return <span style={{ fontSize: Math.round(size * 0.92), lineHeight: 1 }}>{course.icon}</span>;
}
