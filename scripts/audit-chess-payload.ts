// Per-question invariants for Chess Camp puzzles (used by audit-chess.ts).
// Everything here is recomputed from the rules and the judge — nothing is
// taken from the planner's own helpers, so the two cannot agree by accident.
import {
  HOME_ROW, MISSION_DONE, PIECE_VALUE, countAnswer, missionApply, missionDestinations, missionStart, missionVerdict,
  placeAnswer, spotAnswer, spotSolution, type MissionState,
} from "../src/engine/chess/judge";
import {
  attackersOf, attacks, inCheck, isSanePosition, isStalemate, pieceAt, pseudoMoves, rowOf, squareName,
} from "../src/engine/chess/rules";
import {
  chessPayload, type ChessParams, type ChessPayload, type CountPayload, type MissionPayload, type Move, type Piece,
  type PieceType, type PlacePayload, type Position, type SpotPayload,
} from "../src/engine/chess/types";
import type { Question } from "../src/engine/generators/types";
import { CHESS } from "../src/strings/chess";

type Report = (message: string) => void;

const TYPES: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
const KIND_OF: Record<string, ChessPayload["tour"]> = {
  "spot-moves": "chess-spot", "spot-captures": "chess-spot", "spot-attackers": "chess-spot", "spot-safe": "chess-spot",
  stars: "chess-mission", capture: "chess-mission", promote: "chess-mission", check: "chess-mission",
  escape: "chess-mission", mate: "chess-mission", count: "chess-count", place: "chess-place",
};
const ASK_OF: Record<string, SpotPayload["ask"]> = {
  "spot-moves": "moves", "spot-captures": "captures", "spot-attackers": "attackers", "spot-safe": "safe",
};
/** Fewest / most moves each mission may ask for. */
const BUDGET: Record<MissionPayload["goal"], [number, number]> = {
  stars: [1, 4], capture: [1, 3], promote: [2, 4], check: [1, 1], escape: [1, 1], mate: [1, 1],
};

const whites = (position: Position) => position.pieces.filter((piece) => piece.side === "w");
const blacks = (position: Position) => position.pieces.filter((piece) => piece.side === "b");
const typesOf = (pieces: Piece[]) => pieces.map((piece) => piece.type).sort((a, b) => a.localeCompare(b)).join("");

function checkPosition(position: Position, maxSize: number, report: Report): boolean {
  const { size, pieces } = position;
  if (!Number.isInteger(size) || size < 4 || size > 6 || size > maxSize) report(`board size ${size} (lesson allows ${maxSize})`);
  const inBounds = pieces.every((piece) => Number.isInteger(piece.sq) && piece.sq >= 0 && piece.sq < size * size);
  if (!inBounds) report("a piece is off the board");
  if (new Set(pieces.map((piece) => piece.sq)).size !== pieces.length) report("two pieces share a square");
  if (pieces.some((piece) => !TYPES.includes(piece.type) || !["w", "b"].includes(piece.side))) report("unknown piece");
  if (pieces.some((piece) => piece.type === "P" && [0, size - 1].includes(rowOf(piece.sq, size)))) report("pawn on an end row");
  for (const side of ["w", "b"] as const) {
    if (pieces.filter((piece) => piece.side === side && piece.type === "K").length > 1) report(`two ${side} kings`);
  }
  return inBounds;
}

// ---------- spot ----------

function checkMovesSpot(p: SpotPayload, hero: Piece, right: number[], report: Report): void {
  if (right.length < 2) report(`moves has ${right.length} squares`);
  if (hero.type === "K" && blacks(p.position).length) report("king moves drill has enemy pieces");
  if (p.position.pieces.length > 4) report("moves has more than 3 blockers");
  if (spotAnswer(right) !== spotAnswer(pseudoMoves(p.position, hero))) report("moves differ from the rules");
}

function checkCapturesSpot(p: SpotPayload, hero: Piece, right: number[], report: Report): void {
  const enemies = blacks(p.position);
  if (hero.type === "K") report("captures drill about the king");
  if (enemies.length < 3 || enemies.length > 5) report(`captures has ${enemies.length} black pieces`);
  if (right.length > 3 || right.length >= enemies.length) report(`captures: ${right.length} of ${enemies.length} can be taken`);
  if (right.some((sq) => pieceAt(p.position, sq)?.side !== "b")) report("a capture square holds no black piece");
}

function checkAttackersSpot(p: SpotPayload, hero: Piece, right: number[], report: Report): void {
  const enemies = blacks(p.position);
  if (hero.type !== "K" || p.guessable !== false) report("attackers must be about the king, guessable false");
  if (enemies.length < 2 || enemies.length > 4) report(`attackers has ${enemies.length} black pieces`);
  if (right.length > 2 || right.length >= enemies.length) report(`attackers: ${right.length} of ${enemies.length} attack`);
  const really = attackersOf(p.position, p.focus, "b").map((piece) => piece.sq);
  if (spotAnswer(right) !== spotAnswer(really)) report("attackers differ from the rules");
}

function checkSafeSpot(p: SpotPayload, hero: Piece, right: number[], report: Report): void {
  const enemies = blacks(p.position);
  const around = attacks(p.position, hero);
  if (hero.type !== "K") report("safe must be about the king");
  if (enemies.length < 1 || enemies.length > 3) report(`safe has ${enemies.length} black pieces`);
  if (right.length > 6) report(`safe has ${right.length} safe squares`);
  if (!around.some((sq) => !right.includes(sq))) report("safe has no unsafe neighbouring square");
  // Recomputed by hand: step there (taking what stands on it) and see whether anything attacks the king.
  const really = around.filter((sq) => {
    const rest = p.position.pieces.filter((piece) => piece.sq !== sq && piece.sq !== p.focus);
    return pieceAt(p.position, sq)?.side !== "w" && !inCheck({ size: p.position.size, pieces: [...rest, { ...hero, sq }] }, "w");
  });
  if (spotAnswer(really) !== spotAnswer(right)) report("safe squares differ from the rules");
}

const SPOT_CHECKS = { moves: checkMovesSpot, captures: checkCapturesSpot, attackers: checkAttackersSpot, safe: checkSafeSpot };

function checkSpot(q: Question, p: SpotPayload, report: Report): void {
  const hero = pieceAt(p.position, p.focus);
  if (!hero || hero.side !== "w") return report("focus piece is missing or not white");
  if (hero.type !== p.piece) report(`focus is a ${hero.type}, payload.piece says ${p.piece}`);
  if (p.ask !== ASK_OF[p.task]) report(`ask ${p.ask} for task ${p.task}`);
  const right = spotSolution(p);
  if (q.answer !== spotAnswer(right)) report("answer is not spotAnswer(spotSolution(payload))");
  if (right.length < 1 || right.length > 9) report(`${right.length} squares to tap`);
  SPOT_CHECKS[p.ask](p, hero, right, report);
}

// ---------- mission ----------

function stateKey(state: MissionState): string {
  const pieces = state.position.pieces.map((piece) => `${piece.side}${piece.type}${piece.sq}`).sort((a, b) => a.localeCompare(b));
  return JSON.stringify([pieces, state.starsLeft, state.targetsLeft]);
}

function movesOf(p: MissionPayload, state: MissionState): Move[] {
  return whites(state.position).flatMap((piece) => missionDestinations(p, state, piece.sq).map((to) => ({ from: piece.sq, to })));
}

/** Independent breadth-first search: the fewest moves that reach the goal within the budget. */
function fewestMoves(p: MissionPayload): number | null {
  let frontier = [missionStart(p)];
  const seen = new Set(frontier.map(stateKey));
  for (let depth = 1; depth <= p.budget; depth++) {
    const next: MissionState[] = [];
    for (const state of frontier) {
      for (const move of movesOf(p, state)) {
        const after = missionApply(p, state, move);
        if (after.won) return depth;
        if (seen.has(stateKey(after))) continue;
        seen.add(stateKey(after));
        next.push(after);
      }
    }
    frontier = next;
  }
  return null;
}

function checkStars(p: MissionPayload, report: Report): void {
  const army = whites(p.position);
  if (army.length !== 1 || army[0].type === "P" || army[0].type !== p.piece) report("stars needs one white hero that is not a pawn");
  if (p.stars.length < 1 || p.stars.length > 3 || new Set(p.stars).size !== p.stars.length) report(`${p.stars.length} stars`);
  if (p.stars.some((sq) => pieceAt(p.position, sq) || sq < 0 || sq >= p.position.size ** 2)) report("a star is not on an empty square");
  if (blacks(p.position).length > 3) report("stars has more than 3 blockers");
  if (army[0]?.type === "K" && blacks(p.position).length) report("king star hunt has enemy pieces");
}

function checkBestCapture(p: MissionPayload, hero: Piece | undefined, params: ChessParams, report: Report): void {
  if (!params.tasks.includes("count")) report("best-piece capture outside a piece-values lesson");
  if (!hero || p.budget !== 1 || p.targets.length !== 1) return report("best-piece capture needs one hero, one target, one move");
  const takeable = pseudoMoves(p.position, hero).map((sq) => pieceAt(p.position, sq)).filter((piece): piece is Piece => !!piece);
  const best = Math.max(...takeable.map((piece) => PIECE_VALUE[piece.type]));
  const top = takeable.filter((piece) => PIECE_VALUE[piece.type] === best);
  if (takeable.length < 2 || top.length !== 1 || top[0].sq !== p.targets[0]) report("best-piece target is not the single most valuable capture");
}

function checkCapture(q: Question, p: MissionPayload, params: ChessParams, report: Report): void {
  const army = whites(p.position);
  const enemies = blacks(p.position);
  if (p.targets.some((sq) => pieceAt(p.position, sq)?.side !== "b")) report("a target holds no black piece");
  if (!p.targets.length || new Set(p.targets).size !== p.targets.length) report("capture targets missing or repeated");
  if (p.piece === "P" ? army.length > 3 || army.some((piece) => piece.type !== "P") : army.length !== 1 || army[0].type !== p.piece) {
    report(`capture army ${typesOf(army)} for hero ${p.piece}`);
  }
  if (q.prompt === CHESS.engine.captureBest) return checkBestCapture(p, army[0], params, report);
  if (enemies.length < 1 || enemies.length > 3 || p.targets.length !== enemies.length) report("every black piece (1–3) must be a target");
  if (p.piece === "K" && inCheck(p.position, "w")) report("king capture starts in check");
  if (p.piece === "P" && p.solution.some((move) => rowOf(move.to, p.position.size) === 0)) report("pawn capture solution promotes");
}

function checkPromote(p: MissionPayload, report: Report): void {
  const army = whites(p.position);
  if (army.length < 1 || army.length > 2 || army.some((piece) => piece.type !== "P")) report(`promote army ${typesOf(army)}`);
  if (p.position.size < 5) report("promote on a board smaller than 5");
  if (blacks(p.position).length > 3) report("promote has more than 3 black pieces");
}

/** First moves that win on the spot, and all first moves (one-move missions). */
function firstMoveWins(p: MissionPayload): [number, number] {
  const start = missionStart(p);
  const moves = movesOf(p, start);
  return [moves.filter((move) => missionApply(p, start, move).won).length, moves.length];
}

function checkCheck(p: MissionPayload, params: ChessParams, report: Report): void {
  const attackers = whites(p.position).filter((piece) => piece.type !== "K");
  if (!isSanePosition(p.position) || inCheck(p.position, "b")) report("check: Black is already in check / position not sane");
  if (inCheck(p.position, "w")) report("check: White starts in check");
  if (typesOf(blacks(p.position).filter((piece) => piece.type === "K")) !== "K") report("check: no black king");
  if (attackers.length < 1 || attackers.length > 2 || attackers.some((piece) => !"QRBN".includes(piece.type))) report(`check army ${typesOf(attackers)}`);
  const allowed = params.pieces.filter((type) => "QRBN".includes(type));
  if (allowed.length && attackers.some((piece) => !allowed.includes(piece.type))) report(`check army ${typesOf(attackers)} is not from the lesson`);
  const [wins, all] = firstMoveWins(p);
  if (wins < 1 || wins > all * 0.4) report(`check: ${wins} of ${all} moves give check`);
}

function checkEscape(p: MissionPayload, report: Report): void {
  const army = whites(p.position);
  if (!inCheck(p.position, "w")) report("escape: White is not in check");
  if (p.guessable !== true) report("escape must be guessable");
  if (!["K", "KP"].includes(typesOf(army))) report(`escape army ${typesOf(army)}`);
  const [wins, all] = firstMoveWins(p);
  if (wins < 1 || wins >= all) report(`escape: ${wins} of ${all} first moves save the king`);
}

function checkMate(p: MissionPayload, params: ChessParams, report: Report): void {
  if (!isSanePosition(p.position)) report("mate: position not sane");
  if (inCheck(p.position, "b") || isStalemate(p.position, "b")) report("mate: Black starts in check or stalemate");
  if (inCheck(p.position, "w")) report("mate: White starts in check");
  const army = typesOf(whites(p.position).filter((piece) => piece.type !== "K"));
  if (!["Q", "R", "RR", "QR"].includes(army) || whites(p.position).length !== army.length + 1) report(`mate army ${army}`);
  const allowed = params.pieces.filter((type) => "QR".includes(type));
  if (allowed.length && [...army].some((type) => !allowed.includes(type as PieceType))) report(`mate army ${army} is not from the lesson`);
  if (!["K", "KP"].includes(typesOf(blacks(p.position)))) report(`mate: Black has ${typesOf(blacks(p.position))}`);
  const [wins] = firstMoveWins(p);
  if (wins < 1 || wins > 2) report(`mate: ${wins} mating moves`);
}

function checkMission(q: Question, p: MissionPayload, params: ChessParams, report: Report): void {
  if (p.goal !== p.task) report(`goal ${p.goal} for task ${p.task}`);
  if (q.answer !== MISSION_DONE) report("mission answer is not MISSION_DONE");
  const [low, high] = BUDGET[p.goal];
  if (p.budget < low || p.budget > high) report(`${p.goal} budget ${p.budget}`);
  if (p.solution.length !== p.budget) report(`solution has ${p.solution.length} moves, budget is ${p.budget}`);
  if (missionVerdict(p, p.solution) !== MISSION_DONE) report("solution does not reach the goal");
  const fewest = fewestMoves(p);
  if (fewest !== p.budget) report(`goal is reachable in ${fewest ?? "no"} moves, budget is ${p.budget}`);
  if (p.goal !== "stars" && p.stars.length) report("stars outside a star hunt");
  if (p.goal !== "capture" && p.targets.length) report("targets outside a capture mission");
  if (p.goal !== "escape" && p.guessable) report(`${p.goal} marked guessable`);
  if (p.goal === "stars") checkStars(p, report);
  if (p.goal === "capture") checkCapture(q, p, params, report);
  if (p.goal === "promote") checkPromote(p, report);
  if (p.goal === "check") checkCheck(p, params, report);
  if (p.goal === "escape") checkEscape(p, report);
  if (p.goal === "mate") checkMate(p, params, report);
}

// ---------- count / place ----------

function checkCount(q: Question, p: CountPayload, report: Report): void {
  if (p.pieces.length < 2 || p.pieces.length > 5 || p.pieces.some((type) => !"PNBRQ".includes(type))) report(`count pieces ${p.pieces.join("")}`);
  const sum = p.pieces.reduce((total, type) => total + PIECE_VALUE[type], 0);
  if (q.answer !== String(sum) || q.answer !== countAnswer(p.pieces) || sum > 30) report(`count answer ${q.answer} for ${p.pieces.join("")}`);
  if (PIECE_VALUE[p.piece] !== Math.max(...p.pieces.map((type) => PIECE_VALUE[type]))) report("count piece is not the most valuable one");
  for (const type of new Set(p.pieces)) {
    if (!q.hint.toLowerCase().includes(`${CHESS.piece[type]} ${PIECE_VALUE[type]}`)) report(`count hint misses the ${CHESS.piece[type]}`);
  }
}

function checkPlace(q: Question, p: PlacePayload, report: Report): void {
  if (p.row.length !== 8 || p.row.some((type, index) => type !== null && type !== HOME_ROW[index])) report("place row is not a partial home row");
  if (!p.tray.length || p.tray.length > 8) report(`place tray has ${p.tray.length} pieces`);
  const done = [...q.answer].map((mark) => (mark === "." ? null : (mark as PieceType)));
  if (done.length !== 8 || q.answer !== placeAnswer(done)) report("place answer is not a back row");
  if (done.some((type, index) => type !== null && type !== HOME_ROW[index])) report("place answer breaks HOME_ROW");
  if (p.row.some((type, index) => type !== null && done[index] !== type)) report("place answer moves a piece that was already home");
  const added = done.filter((type, index) => type !== null && p.row[index] === null) as PieceType[];
  const sort = (list: PieceType[]) => [...list].sort((a, b) => a.localeCompare(b)).join("");
  if (sort(added) !== sort(p.tray)) report(`place tray ${sort(p.tray)} does not fill ${sort(added)}`);
  if (!p.tray.includes(p.piece)) report("place piece is not in the tray");
}

// ---------- every question ----------

function checkText(q: Question, p: ChessPayload, report: Report): void {
  if (!q.prompt.trim() || !q.answer.trim() || !q.hint.trim()) report("blank prompt, answer or hint");
  if (q.prompt.trim().split(/\s+/).length > 8) report(`prompt has more than 8 words: "${q.prompt}"`);
  if (/wrong|fail/i.test(`${q.prompt} ${q.hint}`)) report("forbidden word in prompt or hint");
  const size = "position" in p ? p.position.size : 8;
  const named = Array.from({ length: size * size }, (_, sq) => squareName(sq, size));
  if (q.hint.split(/[^a-z0-9]+/i).some((word) => named.includes(word))) report(`hint names a square: "${q.hint}"`);
}

/** Checks one question against the contract; returns its payload, or null when it is not a chess question at all. */
export function checkChessQuestion(q: Question, params: ChessParams, label: string, failures: string[]): ChessPayload | null {
  const report: Report = (message) => failures.push(`${label} [${q.dedupeKey}]: ${message}`);
  const p = chessPayload(q);
  if (!p || KIND_OF[p.task] !== p.tour) {
    report("not a well-formed chess payload");
    return null;
  }
  if (q.inputMode !== "tour" || q.repeatable !== true || q.choices.length) report("inputMode / repeatable / choices");
  if (!TYPES.includes(p.piece) || !q.dedupeKey?.startsWith(`chess:${p.task}:${p.piece}:`)) report("piece or dedupeKey prefix");
  checkText(q, p, report);
  if (p.tour === "chess-count") checkCount(q, p, report);
  else if (p.tour === "chess-place") checkPlace(q, p, report);
  else if (checkPosition(p.position, p.task === "promote" ? Math.max(5, params.size) : params.size, report)) {
    if (p.tour === "chess-spot") checkSpot(q, p, report);
    else checkMission(q, p, params, report);
  }
  return p;
}
