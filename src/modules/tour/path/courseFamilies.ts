// THE one place where the path screen treats courses differently. Everything
// here has a generic default, so a course that only exists in COURSES gets a
// complete path: keepsake shelf + trophy chip, kit-style lesson teaser, the
// generic title and end line. Add an entry only to give a course something
// richer (World Tour's passport, Chess Camp's golden chess set).
import { createElement, type ComponentType, type ReactNode } from "react";
import type { Course } from "../../../content/courses";
import { TOUR_COUNTRIES } from "../../../content/tour/units";
import type { GameStore } from "../../../state/store";
import { stampedCount } from "../../../state/tour";
import { CHESS } from "../../../strings/chess";
import { TOUR } from "../../../strings/tour";
import { KingGlyph, PassportGlyph, TrophyGlyph } from "./glyphs";
import { KeepsakeShelf, type CollectionSheetProps } from "./KeepsakeShelf";
import { Passport } from "./Passport";
import { defaultShelfText, type ShelfText } from "./shelfText";
import { CodeTeaser, FlagTeaser, KitTeaser, PieceTeaser, type TeaserProps } from "./teasers";

export interface CourseFamily {
  /** The sheet behind the collection chip. */
  Sheet: ComponentType<CollectionSheetProps>;
  /** Lines of the shelf sheet (unused by non-shelf sheets). */
  shelfText: (course: Course) => ShelfText;
  /** Picture on the collection chip. */
  Glyph: ComponentType;
  /** Spoken name of the collection chip. */
  label: string;
  /** How much of the collection Sam owns, read from the save. */
  owned: (state: GameStore, course: Course) => number;
  total: (course: Course) => number;
  /** Pogo's line once every lesson is done, and the line under it. */
  finished: (course: Course) => string;
  finishedSub: string;
  /** 0-based lesson slot drawn with the mix-up arrows, if the course has one. */
  mixSlot?: number;
}

const chestsOwned = (state: GameStore, course: Course) =>
  course.units.filter((unit) => state.tourChests.includes(unit.id)).length;

const DEFAULT_FAMILY: CourseFamily = {
  Sheet: KeepsakeShelf,
  shelfText: defaultShelfText,
  Glyph: TrophyGlyph,
  label: TOUR.path.shelf,
  owned: chestsOwned,
  total: (course) => course.units.length,
  finished: (course) => TOUR.path.finishedCourse(course.title),
  finishedSub: TOUR.path.finishedSub,
};

/** Per-course extras, keyed by course id. Anything left out uses DEFAULT_FAMILY. */
const COURSE_FAMILIES: Record<string, Partial<CourseFamily>> = {
  tour: {
    Sheet: Passport,
    Glyph: PassportGlyph,
    label: TOUR.path.passport,
    owned: (state) => Math.min(TOUR_COUNTRIES.length, stampedCount(state.tourStamps)),
    total: () => TOUR_COUNTRIES.length,
    mixSlot: 3,
  },
  chess: {
    shelfText: (course) => ({
      ...defaultShelfText(course),
      title: CHESS.path.setTitle,
      count: CHESS.path.setCount,
      how: CHESS.path.setHow,
      full: CHESS.path.setFull,
      hidden: CHESS.path.setHidden,
      mystery: CHESS.path.setMystery,
    }),
    Glyph: KingGlyph,
    label: CHESS.path.set,
  },
};

export function courseFamily(course: Course): CourseFamily {
  return { ...DEFAULT_FAMILY, ...COURSE_FAMILIES[course.id] };
}

/** Lesson-card teasers, keyed by lesson family (StageDef.generator). */
const TEASERS: Record<string, ComponentType<TeaserProps>> = {
  tour: FlagTeaser,
  chess: PieceTeaser,
  code: CodeTeaser,
  kit: KitTeaser,
};

/** The lesson card's teaser for this lesson (KitTeaser for any family not listed). */
export function lessonTeaser(props: TeaserProps): ReactNode {
  return createElement(TEASERS[props.stage.generator] ?? KitTeaser, props);
}
