// Hand-written chess questions for the DEV lab: one per variant the widgets
// must handle (every mission goal, every spot question, a 6×6 board, two
// movers), independent of what the lesson planner currently produces.
import type { Question } from "../../../engine/generators/types";
import { MISSION_DONE, countAnswer, placeAnswer, spotAnswer, spotSolution } from "../../../engine/chess/judge";
import type { ChessPayload, MissionPayload, Piece, PieceType, Side, SpotPayload } from "../../../engine/chess/types";

function q(prompt: string, answer: string, hint: string, payload: ChessPayload): Question {
  return {
    id: "", prompt, answer, choices: [], hint, inputMode: "tour", repeatable: true,
    dedupeKey: `lab:${payload.task}:${payload.piece}`, payload: payload as unknown as Record<string, unknown>,
  };
}

const p = (type: PieceType, side: Side, sq: number): Piece => ({ type, side, sq });

function spot(prompt: string, payload: Omit<SpotPayload, "tour">): Question {
  const full: SpotPayload = { tour: "chess-spot", ...payload };
  return q(prompt, spotAnswer(spotSolution(full)), "Look along its lines.", full);
}

function mission(prompt: string, payload: Omit<MissionPayload, "tour">): Question {
  return q(prompt, MISSION_DONE, "Look at the arrows.", { tour: "chess-mission", ...payload });
}

// 5×5 boards unless noted: square = row * 5 + col, row 0 at the top.
const EXTRAS: Question[] = [
  spot("What can the queen capture?", {
    task: "spot-captures", piece: "Q", ask: "captures", focus: 12,
    position: { size: 5, pieces: [p("Q", "w", 12), p("P", "b", 2), p("N", "b", 14), p("R", "b", 0), p("P", "w", 10), p("B", "b", 23), p("P", "b", 21)] },
  }),
  spot("Who is attacking your king?", {
    task: "spot-attackers", piece: "K", ask: "attackers", focus: 12,
    position: { size: 5, pieces: [p("K", "w", 12), p("R", "b", 2), p("B", "b", 24), p("N", "b", 1), p("P", "b", 22), p("R", "b", 19)] },
  }),
  spot("Where is the king safe?", {
    task: "spot-safe", piece: "K", ask: "safe", focus: 12,
    position: { size: 5, pieces: [p("K", "w", 12), p("R", "b", 3), p("B", "b", 21)] },
  }),
  spot("Where can the knight go?", {
    task: "spot-moves", piece: "N", ask: "moves", focus: 14,
    position: { size: 6, pieces: [p("N", "w", 14), p("P", "w", 27), p("P", "b", 1), p("B", "b", 20)] },
  }),
  mission("Reach the top in 3 moves", {
    task: "promote", piece: "P", goal: "promote", budget: 3, stars: [], targets: [],
    position: { size: 6, pieces: [p("P", "w", 25), p("N", "b", 9)] },
    solution: [{ from: 25, to: 13 }, { from: 13, to: 7 }, { from: 7, to: 1 }],
  }),
  mission("Check the king in 1 move", {
    task: "check", piece: "Q", goal: "check", budget: 1, stars: [], targets: [],
    position: { size: 5, pieces: [p("K", "b", 2), p("Q", "w", 20), p("K", "w", 24)] },
    solution: [{ from: 20, to: 22 }],
  }),
  mission("Save your king!", {
    task: "escape", piece: "K", goal: "escape", budget: 1, stars: [], targets: [],
    position: { size: 5, pieces: [p("K", "w", 22), p("R", "b", 2), p("B", "b", 9)] },
    solution: [{ from: 22, to: 23 }],
  }),
  mission("Collect the stars in 2 moves", {
    task: "stars", piece: "N", goal: "stars", budget: 2, stars: [11, 4], targets: [],
    position: { size: 5, pieces: [p("N", "w", 20), p("R", "w", 24)] },
    solution: [{ from: 20, to: 11 }, { from: 24, to: 4 }],
  }),
  mission("Capture every piece in 2 moves", {
    task: "capture", piece: "Q", goal: "capture", budget: 2, stars: [], targets: [0, 4],
    position: { size: 5, pieces: [p("Q", "w", 20), p("P", "b", 0), p("N", "b", 4), p("B", "b", 13)] },
    solution: [{ from: 20, to: 0 }, { from: 0, to: 4 }],
  }),
  mission("Collect the stars in 3 moves", {
    task: "stars", piece: "N", goal: "stars", budget: 3, stars: [9, 22, 33], targets: [],
    position: { size: 6, pieces: [p("N", "w", 1), p("P", "w", 14), p("P", "w", 15)] },
    solution: [{ from: 1, to: 9 }, { from: 9, to: 22 }, { from: 22, to: 33 }],
  }),
  q("How many points?", countAnswer(["Q", "R", "B", "N", "P", "P"]), "Queen 9, rook 5, bishop 3, knight 3, pawn 1.", {
    tour: "chess-count", task: "count", piece: "Q", pieces: ["Q", "R", "B", "N", "P", "P"],
  }),
  q("Put the king and queen at home", placeAnswer(["R", "N", "B", "Q", "K", "B", "N", "R"]), "Queen on her colour.", {
    tour: "chess-place", task: "place", piece: "Q", row: ["R", "N", "B", null, null, "B", "N", "R"], tray: ["K", "Q"],
  }),
  q("Set up the back row", placeAnswer(["R", "N", "B", "Q", "K", "B", "N", "R"]), "Rooks, knights, bishops, then queen and king.", {
    tour: "chess-place", task: "place", piece: "R", row: [null, null, null, null, null, null, null, null],
    tray: ["B", "R", "N", "Q", "K", "N", "R", "B"],
  }),
];

export const LAB_EXTRAS: Question[] = EXTRAS.map((question, i) => ({ ...question, id: `lab-extra-${i}`, dedupeKey: `${question.dedupeKey}:${i}` }));
