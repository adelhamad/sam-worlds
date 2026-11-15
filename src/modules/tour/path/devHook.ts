// DEV only: lets the screenshot bench seed mid-game states from the console,
// e.g. `__game.getState().setWorldProgress("tour", 7)`. Stripped from builds.
import type { Course } from "../../../content/courses";
import { useGame } from "../../../state/store";

if (import.meta.env.DEV) {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}

/**
 * DEV only: `sessionStorage.setItem("tp-fake-courses", "14")` pads the course
 * picker with copies, to check how it holds up with many courses.
 */
export function devPadCourses(courses: Course[]): Course[] {
  if (!import.meta.env.DEV || courses.length === 0) return courses;
  let want: number;
  try {
    want = Number(sessionStorage.getItem("tp-fake-courses")) || 0;
  } catch {
    return courses;
  }
  const padded = [...courses];
  for (let i = courses.length; i < want; i += 1) {
    const base = courses[i % courses.length];
    padded.push({ ...base, id: `${base.id}-dev${i}`, title: `${base.title} ${i + 1}` });
  }
  return padded;
}
