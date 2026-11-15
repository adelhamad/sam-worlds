// A "course" is a Pogo lesson path: units of lessons with a chest at the end
// of each unit. World Tour (geography) and Chess Camp are both courses; the
// path screen and the lesson player only depend on these shapes.
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";
import type { PieceType } from "../engine/chess/types";

export interface CourseUnit {
  id: string;
  name: string;
  /** Emoji / glyph for banners and trophies. */
  icon: string;
  /** Path colour for this unit's nodes and banner. */
  hue: string;
  /** One short line under the unit banner (≤ 8 simple words). */
  blurb: string;
  lessons: StageDef[];
  /** Star Dust inside the unit chest (deterministic). */
  chestDust: number;
  /** Keepsake shown once the chest is open. `piece` draws a chess piece instead of the icon. */
  souvenir: { icon: string; name: string; piece?: PieceType };
  /** Chess units: draw this piece instead of `icon` where there is room for art. */
  piece?: PieceType;
}

/** Shelf a course sits on at home (the home groups courses once there are many). */
export type CourseSubject = "explore" | "think" | "create";

export interface Course {
  /** Short permanent id; also the prefix of its stage ids (`<id>-u01-l1`). */
  id: string;
  /** The world whose stages are this course's lessons. */
  worldId: string;
  title: string;
  /** Emoji shown where there is no room for art. */
  icon: string;
  /** One inviting line for the home (≤ 8 simple words). */
  tagline: string;
  /** Route of the path screen; lessons live at `${path}/lesson/:stageId`. */
  path: string;
  /** Signature colour of the course card. */
  hue: string;
  subject: CourseSubject;
  /** Wears the NEW tag at home until the parent has had it for a while (set by hand). */
  isNew?: boolean;
  units: CourseUnit[];
  world: WorldDef;
}
