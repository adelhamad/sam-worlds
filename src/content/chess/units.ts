// Chess Camp curriculum — units and lessons are DATA. One unit per piece, then
// piece values and home squares, check, and checkmate. Each unit has three
// lessons and a champion lesson, then a treasure chest holding a keepsake for
// Sam's chess set. Stage ids are permanent (saves reference them): only ever
// APPEND units or lessons.
import type { CourseUnit } from "../courseTypes";
import { iconRef } from "../iconNames";
import type { StageDef } from "../types";
import type { WorldDef } from "../worldList";
import type { ChessIntroKey, ChessParams, ChessTask, PieceType } from "../../engine/chess/types";

export const CHESS_WORLD_ID = "chess";

export interface ChessUnit extends CourseUnit {
  /** Pieces this unit centres on. */
  pieces: PieceType[];
}

interface LessonSeed {
  name: string;
  tasks: ChessTask[];
  intro?: ChessIntroKey;
  /** Overrides the unit's pieces for this lesson. */
  pieces?: PieceType[];
}

interface UnitSeed {
  name: string;
  icon: string;
  hue: string;
  blurb: string;
  pieces: PieceType[];
  /** Art for banners; omitted for the units that are not about one piece. */
  piece?: PieceType;
  size: number;
  lessons: [LessonSeed, LessonSeed, LessonSeed, LessonSeed];
  souvenir: CourseUnit["souvenir"];
}

// Text-style chess glyphs (U+FE0E keeps phones from turning them into emoji).
const GLYPH: Record<PieceType, string> = { K: "♚︎", Q: "♛︎", R: "♜︎", B: "♝︎", N: "♞︎", P: "♟︎" };

function pieceUnit(
  piece: PieceType, name: string, hue: string, blurb: string, pieceName: string, size: number,
  lessons: UnitSeed["lessons"],
): UnitSeed {
  return {
    name, icon: GLYPH[piece], hue, blurb, pieces: [piece], piece, size, lessons,
    souvenir: { icon: GLYPH[piece], name: `Golden ${pieceName}`, piece },
  };
}

const SEEDS: UnitSeed[] = [
  pieceUnit("R", "Rook Road", "#ffd166", "Straight lines, far and fast!", "Rook", 5, [
    { name: "Meet the Rook", tasks: ["spot-moves", "stars"], intro: "R" },
    { name: "Rook Run", tasks: ["stars", "spot-moves"] },
    { name: "Rook Raid", tasks: ["spot-captures", "capture", "stars"] },
    { name: "Rook Champion", tasks: ["spot-moves", "spot-captures", "stars", "capture"] },
  ]),
  pieceUnit("B", "Bishop Slide", "#6ea8ff", "Zoom along the diagonals!", "Bishop", 5, [
    { name: "Meet the Bishop", tasks: ["spot-moves", "stars"], intro: "B" },
    { name: "Bishop Zoom", tasks: ["stars", "spot-moves"] },
    { name: "Bishop Raid", tasks: ["spot-captures", "capture", "stars"] },
    { name: "Bishop Champion", tasks: ["spot-moves", "spot-captures", "stars", "capture"] },
  ]),
  pieceUnit("Q", "Queen Power", "#ff7eb6", "The strongest piece of all!", "Queen", 5, [
    { name: "Meet the Queen", tasks: ["spot-moves", "stars"], intro: "Q" },
    { name: "Queen Quest", tasks: ["stars", "spot-captures"] },
    { name: "Queen Raid", tasks: ["capture", "spot-captures", "stars"] },
    { name: "Queen Champion", tasks: ["spot-moves", "spot-captures", "stars", "capture"] },
  ]),
  pieceUnit("K", "King Steps", "#ff8f6b", "One careful step at a time!", "King", 5, [
    { name: "Meet the King", tasks: ["spot-moves", "stars"], intro: "K" },
    { name: "King Walk", tasks: ["stars", "capture"] },
    { name: "Safe Steps", tasks: ["spot-safe", "capture", "stars"] },
    { name: "King Champion", tasks: ["spot-safe", "spot-moves", "stars", "capture"] },
  ]),
  pieceUnit("N", "Knight Jumps", "#5fd68b", "Hop in an L, over anything!", "Knight", 5, [
    { name: "Meet the Knight", tasks: ["spot-moves", "stars"], intro: "N" },
    { name: "Knight Hops", tasks: ["stars", "spot-moves"] },
    { name: "Knight Raid", tasks: ["spot-captures", "capture", "stars"] },
    { name: "Knight Champion", tasks: ["spot-moves", "spot-captures", "stars", "capture"] },
  ]),
  pieceUnit("P", "Pawn Parade", "#8fd3ff", "Small steps, big dreams!", "Pawn", 6, [
    { name: "Meet the Pawn", tasks: ["spot-moves", "promote"], intro: "P" },
    { name: "Pawn Snacks", tasks: ["spot-captures", "capture", "spot-moves"] },
    { name: "Pawn Race", tasks: ["promote", "capture", "spot-moves"] },
    { name: "Pawn Champion", tasks: ["spot-moves", "spot-captures", "capture", "promote"] },
  ]),
  {
    name: "Piece Points", icon: iconRef("abacus"), hue: "#ff9f43", blurb: "Who is worth the most?",
    pieces: ["Q", "R", "B", "N", "P"], size: 5,
    lessons: [
      { name: "Count the Points", tasks: ["count", "capture"], intro: "values" },
      { name: "Point Hunter", tasks: ["count", "capture", "stars"] },
      { name: "Home Squares", tasks: ["place", "count"], intro: "home" },
      { name: "Points Champion", tasks: ["count", "place", "capture", "stars"] },
    ],
    souvenir: { icon: iconRef("abacus"), name: "Point Counter" },
  },
  {
    name: "Check!", icon: iconRef("bell"), hue: "#f4c542", blurb: "Watch out, the king is in danger!",
    pieces: ["Q", "R", "B", "N"], size: 5,
    lessons: [
      { name: "Spot the Danger", tasks: ["spot-attackers", "spot-safe"], intro: "check" },
      { name: "Say Check!", tasks: ["check", "spot-attackers"] },
      { name: "Run, King!", tasks: ["escape", "spot-safe", "check"] },
      { name: "Check Champion", tasks: ["check", "escape", "spot-attackers", "spot-safe"] },
    ],
    souvenir: { icon: iconRef("bell"), name: "Check Bell" },
  },
  {
    name: "Checkmate!", icon: iconRef("crown"), hue: "#b794ff", blurb: "Trap the king and win!",
    pieces: ["Q", "R"], size: 5,
    lessons: [
      { name: "The King Is Trapped", tasks: ["mate", "check"], intro: "mate" },
      { name: "Queen Mates", tasks: ["mate", "check"], pieces: ["Q"] },
      { name: "Rook Mates", tasks: ["mate", "escape"], pieces: ["R"] },
      { name: "Grand Champion", tasks: ["mate", "check", "escape", "capture", "stars"] },
    ],
    souvenir: { icon: iconRef("crown"), name: "Champion Crown" },
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

function buildUnit(seed: UnitSeed, unitIndex: number, earlier: PieceType[]): ChessUnit {
  const lessons = seed.lessons.map((lesson, slot): StageDef => {
    const champion = slot === seed.lessons.length - 1;
    const params: ChessParams = {
      pieces: lesson.pieces ?? seed.pieces,
      review: earlier,
      tasks: lesson.tasks,
      size: seed.size,
      ...(lesson.intro ? { intro: lesson.intro } : {}),
    };
    return {
      id: `chess-u${pad(unitIndex + 1)}-l${slot + 1}`,
      name: lesson.name,
      generator: "chess",
      params: params as unknown as StageDef["params"],
      questions: champion ? 10 : 8,
      mechanic: "tour",
      payout: 22 + unitIndex * 2 + (champion ? 8 : 0),
      skill: "chess",
    };
  });
  return {
    id: `chess-u${pad(unitIndex + 1)}`,
    name: seed.name,
    icon: seed.icon,
    hue: seed.hue,
    blurb: seed.blurb,
    pieces: seed.pieces,
    piece: seed.piece,
    lessons,
    chestDust: 40 + unitIndex * 10,
    souvenir: seed.souvenir,
  };
}

export const CHESS_UNITS: ChessUnit[] = SEEDS.reduce<ChessUnit[]>((units, seed, index) => {
  const earlier = [...new Set(units.flatMap((unit) => unit.pieces))];
  return [...units, buildUnit(seed, index, earlier)];
}, []);

export const CHESS_WORLD: WorldDef = {
  id: CHESS_WORLD_ID,
  name: "Chess Camp",
  icon: iconRef("pawn"),
  tagline: "Learn chess with Pogo!",
  stages: CHESS_UNITS.flatMap((unit) => unit.lessons),
  // One trophy per finished unit (its champion lesson).
  milestones: CHESS_UNITS.map((unit, index) => ({
    stage: (index + 1) * 4,
    name: `${unit.name} Star`,
    icon: unit.icon,
  })),
};

export function chessParams(stage: StageDef): ChessParams {
  return stage.params as unknown as ChessParams;
}
