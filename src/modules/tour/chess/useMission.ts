// The mission widget's brain: holds the MissionState (engine/chess/judge.ts
// does the rules), turns taps into moves and reports the verdict once — after
// a short beat — when the goal is reached or the moves run out. The widget
// never judges: it submits missionVerdict(payload, moves).
import { useEffect, useRef, useState } from "react";
import {
  missionApply, missionDestinations, missionMovers, missionOpen, missionStart, missionVerdict, type MissionState,
} from "../../../engine/chess/judge";
import { pieceAt } from "../../../engine/chess/rules";
import type { MissionPayload, Move } from "../../../engine/chess/types";
import { moveKeys, startKeys, type BoardBurst, type PieceKeys } from "../../../ui/chess/boardTypes";
import { useTimers } from "../exercises/shared";
import { chessSound } from "./chessSound";

/** The piece needs ~300ms to arrive; then the beat the brief asks for. */
const WIN_BEAT_MS = 1000;
const OUT_BEAT_MS = 900;

export type MissionPhase = "play" | "won" | "out";

interface Play {
  state: MissionState;
  moves: Move[];
  keys: PieceKeys;
}

export interface Mission {
  state: MissionState;
  keys: PieceKeys;
  phase: MissionPhase;
  /** The piece in hand (auto-picked when only one piece can move). */
  active: number | null;
  /** True when only one piece can move, so there is nothing to pick. */
  single: boolean;
  /** Pieces to nudge ("pick me") while nothing is in hand. */
  hints: number[];
  dots: number[];
  last: Move | null;
  bursts: BoardBurst[];
  wobble: { sq: number; n: number } | null;
  starsGot: number;
  /** Pieces that can be picked up and carried right now. */
  movable: number[];
  tap: (sq: number) => void;
  /** A piece was pressed (drag and drop): put it in hand. */
  grab: (sq: number) => void;
  /** A carried piece was set down on `to`. */
  drop: (from: number, to: number) => void;
}

interface MoveFx {
  burst: Omit<BoardBurst, "id"> | null;
  star: boolean;
}

/** Sound + the effect to draw for one applied move. */
function moveFx(payload: MissionPayload, before: MissionState, next: MissionState, move: Move): MoveFx {
  const mover = pieceAt(before.position, move.from);
  const victim = pieceAt(before.position, move.to);
  const star = before.starsLeft.includes(move.to);
  const crowned = mover?.type === "P" && pieceAt(next.position, move.to)?.type === "Q";
  if (mover?.type === "N") chessSound.hop();
  else chessSound.slide();
  if (victim) chessSound.capture();
  if (star) chessSound.star(payload.stars.length - next.starsLeft.length);
  if (crowned) chessSound.crown();
  else if (next.won && !star) chessSound.win();

  if (victim) return { star, burst: { sq: move.to, kind: "puff", piece: { type: victim.type, side: victim.side } } };
  if (crowned) return { star, burst: { sq: move.to, kind: "crown" } };
  if (star || next.won) return { star, burst: { sq: move.to, kind: "sparkle" } };
  return { star, burst: null };
}

/** The picked piece if it can still move; otherwise the only piece that can. */
function pieceInHand(picked: number | null, movers: number[]): number | null {
  if (picked !== null && movers.includes(picked)) return picked;
  return movers.length === 1 ? movers[0] : null;
}

export function useMission(
  payload: MissionPayload, disabled: boolean, onSubmit: (value: string) => void, onStar: (sq: number) => void,
): Mission {
  const [play, setPlay] = useState<Play>(() => ({
    state: missionStart(payload), moves: [], keys: startKeys(payload.position),
  }));
  const [picked, setPicked] = useState<number | null>(null);
  const [bursts, setBursts] = useState<BoardBurst[]>([]);
  const [wobble, setWobble] = useState<{ sq: number; n: number } | null>(null);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });

  const { state, moves, keys } = play;
  const movers = missionMovers(payload, state);
  let phase: MissionPhase = "out";
  if (state.won) phase = "won";
  else if (movers.length > 0) phase = "play";

  const single = movers.length === 1;
  const active = phase === "play" ? pieceInHand(picked, movers.map((piece) => piece.sq)) : null;
  const dots = active === null ? [] : missionDestinations(payload, state, active);

  // A puzzle with no possible move at all (never expected): report it instead of hanging.
  const stuck = phase === "out" && moves.length === 0;
  useEffect(() => {
    if (stuck) later(() => submit.current(missionVerdict(payload, [])), OUT_BEAT_MS);
  }, [stuck, later, payload]);

  const go = (move: Move) => {
    const next = missionApply(payload, state, move);
    if (next === state) return;
    const trail = [...moves, move];
    const fx = moveFx(payload, state, next, move);
    if (fx.burst) setBursts((now) => [...now, { ...fx.burst, id: now.length } as BoardBurst]);
    if (fx.star) onStar(move.to);
    setPlay({ state: next, moves: trail, keys: moveKeys(keys, move) });
    setPicked(move.to); // carry on with the same piece
    const open = missionOpen(payload, next) && missionMovers(payload, next).length > 0;
    if (next.won) later(() => submit.current(missionVerdict(payload, trail)), WIN_BEAT_MS);
    else if (!open) later(() => submit.current(missionVerdict(payload, trail)), OUT_BEAT_MS);
  };

  const tap = (sq: number) => {
    if (disabled || phase !== "play") return;
    if (active !== null && dots.includes(sq)) {
      go({ from: active, to: sq });
      return;
    }
    if (movers.some((piece) => piece.sq === sq)) {
      chessSound.pick();
      setPicked(sq === picked ? null : sq);
      return;
    }
    setPicked(null);
    if (active !== null) setWobble((now) => ({ sq: active, n: (now?.n ?? 0) + 1 }));
  };

  const movable = disabled || phase !== "play" ? [] : movers.map((piece) => piece.sq);
  const grab = (sq: number) => {
    if (!movable.includes(sq) || sq === active) return;
    chessSound.pick();
    setPicked(sq);
  };
  const drop = (from: number, to: number) => {
    if (movable.includes(from) && missionDestinations(payload, state, from).includes(to)) go({ from, to });
  };

  return {
    state, keys, phase, active, single, dots, bursts, wobble, tap, movable, grab, drop,
    hints: phase === "play" && active === null ? movers.map((piece) => piece.sq) : [],
    last: moves.length > 0 ? moves[moves.length - 1] : null,
    starsGot: payload.stars.length - state.starsLeft.length,
  };
}
