// DEV only: the screenshot bench proves the course shelf scales. `?shelf=12`
// (before the `#`) pads the shelf with fake courses that reuse real course data
// under made-up names, hues and subjects. Also exposes the store as
// `window.__game` so states can be seeded from the console. Inert in builds.
import type { Course, CourseSubject } from "../../content/courseTypes";
import { iconRef } from "../../content/iconNames";
import { useGame } from "../../state/store";

if (import.meta.env.DEV) {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}

const FAKES: Array<{ title: string; icon: string; hue: string; subject: CourseSubject }> = [
  { title: "Ocean Dive", icon: iconRef("fish"), hue: "#3fb8f5", subject: "explore" },
  { title: "Dino Dig", icon: iconRef("dragon"), hue: "#9ad15a", subject: "explore" },
  { title: "Space Trip", icon: iconRef("rocket"), hue: "#a98bff", subject: "explore" },
  { title: "Number Ninjas", icon: iconRef("abacus"), hue: "#ff8c6b", subject: "think" },
  { title: "Puzzle Peak", icon: iconRef("brain"), hue: "#ff7eb6", subject: "think" },
  { title: "Music Maker", icon: iconRef("music"), hue: "#ffb454", subject: "create" },
  { title: "Story Studio", icon: iconRef("book"), hue: "#f2a7ff", subject: "create" },
  { title: "Art Attic", icon: iconRef("flower"), hue: "#ff6f7d", subject: "create" },
];

export function devPadCourses(courses: Course[]): Course[] {
  if (!import.meta.env.DEV) return courses;
  const want = Number(new URLSearchParams(window.location.search).get("shelf") ?? 0);
  if (!want || courses.length === 0 || courses.length >= want) return courses;
  const extra = FAKES.slice(0, want - courses.length).map((fake, i) => ({
    ...courses[i % courses.length], ...fake, id: `fake${i}`, isNew: i % 3 === 0,
  }));
  return [...courses, ...extra];
}
