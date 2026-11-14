// Finds the FEWEST moves that finish a mission, by breadth-first search over
// the judge's own simulator — so a puzzle's budget and the verdict the widget
// reports can never disagree.
import type { Question } from "../generators/types";
import { chessQuestion, fingerprint } from "./boards";
import { MISSION_DONE, missionApply, missionDestinations, missionStart, type MissionState } from "./judge";
import type { MissionPayload, Move } from "./types";

/** A mission before its budget is known. */
export type MissionBase = Omit<MissionPayload, "budget" | "solution">;

/** Lets a search leave some moves out (e.g. "no promotions"). */
export type MoveFilter = (state: MissionState, move: Move) => boolean;

interface Node {
  state: MissionState;
  path: Move[];
}

function stateKey(state: MissionState): string {
  return `${fingerprint(state.position)}|${state.starsLeft.join(",")}|${state.targetsLeft.join(",")}`;
}

function movesFrom(probe: MissionPayload, state: MissionState): Move[] {
  return state.position.pieces
    .filter((piece) => piece.side === "w")
    .flatMap((piece) => missionDestinations(probe, state, piece.sq).map((to) => ({ from: piece.sq, to })));
}

/** One shortest winning line of at most `maxDepth` moves, or null. */
export function solveMission(base: MissionBase, maxDepth: number, allow?: MoveFilter): Move[] | null {
  const probe: MissionPayload = { ...base, budget: maxDepth, solution: [] };
  const start = missionStart(probe);
  let frontier: Node[] = [{ state: start, path: [] }];
  const seen = new Set([stateKey(start)]);
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Node[] = [];
    for (const node of frontier) {
      for (const move of movesFrom(probe, node.state)) {
        if (allow && !allow(node.state, move)) continue;
        const state = missionApply(probe, node.state, move);
        const path = [...node.path, move];
        if (state.won) return path;
        const key = stateKey(state);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ state, path });
      }
    }
    frontier = next;
  }
  return null;
}

export interface FirstMove {
  move: Move;
  /** This single move reaches the goal. */
  won: boolean;
}

/** Every move White may play first, and whether it wins on the spot (one-move missions). */
export function firstMoves(base: MissionBase): FirstMove[] {
  const probe: MissionPayload = { ...base, budget: 1, solution: [] };
  const start = missionStart(probe);
  return movesFrom(probe, start).map((move) => ({ move, won: missionApply(probe, start, move).won }));
}

/** A finished mission question: the budget is the length of its shortest solution. */
export function missionQuestion(prompt: string, hint: string, base: MissionBase, solution: Move[]): Question {
  const payload: MissionPayload = { ...base, budget: solution.length, solution };
  const print = `${fingerprint(base.position)}*${base.stars.join(".")}x${base.targets.join(".")}`;
  return chessQuestion(prompt, MISSION_DONE, hint, payload, print);
}
