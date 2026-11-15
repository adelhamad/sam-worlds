// The lines of a keepsake shelf sheet. Every course gets these defaults; a
// course family may hand the shelf its own (Chess Camp's golden chess set).
import type { Course } from "../../../content/courses";
import { TOUR } from "../../../strings/tour";

export interface ShelfText {
  title: string;
  count: (owned: number, total: number) => string;
  how: string;
  full: string;
  hidden: string;
  mystery: string;
}

export function defaultShelfText(course: Course): ShelfText {
  return {
    title: TOUR.path.shelfTitle(course.title),
    count: TOUR.path.shelfCount,
    how: TOUR.path.shelfHow,
    full: TOUR.path.shelfFull,
    hidden: TOUR.path.souvenirHidden,
    mystery: TOUR.path.shelfMystery,
  };
}
