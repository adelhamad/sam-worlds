// The SOLVED view inside the amber "Almost — look at this." sheet. It teaches
// the rule rather than only revealing an answer: the right squares lit (with
// what was missed / extra), a mission's solution replayed with numbered
// arrows, the points written out as a sum, the home row with its rule.
import { useEffect, useState } from "react";
import { HOME_ROW, PIECE_VALUE, missionApply, missionStart, spotSolution, type MissionState } from "../../../engine/chess/judge";
import { pieceAt } from "../../../engine/chess/rules";
import {
  chessPayload, type CountPayload, type MissionPayload, type PieceType, type PlacePayload, type SpotPayload,
} from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { moveKeys, startKeys, type BoardArrow, type MarkTone, type PieceKeys } from "../../../ui/chess/boardTypes";
import { ChessBoard } from "../../../ui/chess/ChessBoard";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import type { TeachProps } from "../exercises/contract";
import { HomeRow } from "./HomeRow";
import { missionLook, trappedMarks } from "./missionLook";
import "./chess.css";
import "./chessTeach.css";

const S = CHESS.exercise;

/** The squares the child marked, if `submitted` is a spot answer. */
function parseSpot(submitted: string | undefined): number[] | null {
  return submitted && /^\d+(,\d+)*$/.test(submitted) ? submitted.split(",").map(Number) : null;
}

function Legend({ tone, text }: { tone: MarkTone; text: string }) {
  return (
    <li className="ct-legend-row">
      <span className={`ct-legend-dot is-${tone}`} />
      {text}
    </li>
  );
}

function SpotTeach({ payload, submitted }: { payload: SpotPayload; submitted?: string }) {
  const right = spotSolution(payload);
  const tapped = parseSpot(submitted);
  const marks: Record<number, MarkTone> = {};
  for (const sq of right) marks[sq] = !tapped || tapped.includes(sq) ? "good" : "missed";
  for (const sq of tapped ?? []) if (!right.includes(sq)) marks[sq] = "extra";
  const tones = new Set(Object.values(marks));
  let rule = S.rule[pieceAt(payload.position, payload.focus)?.type ?? payload.piece];
  if (payload.ask === "attackers") rule = S.teachAttackers;
  if (payload.ask === "safe") rule = S.teachSafe;
  return (
    <div className="ct-split">
      <ChessBoard position={payload.position} focus={payload.focus} marks={marks} className="ct-board" />
      <div className="ct-text">
        <strong className="ct-rule">{rule}</strong>
        {tapped && (
          <ul className="ct-legend">
            {tones.has("good") && <Legend tone="good" text={S.legendGood} />}
            {tones.has("missed") && <Legend tone="missed" text={S.legendMissed[payload.ask]} />}
            {tones.has("extra") && <Legend tone="extra" text={S.legendExtra} />}
          </ul>
        )}
      </div>
    </div>
  );
}

interface Frame {
  state: MissionState;
  keys: PieceKeys;
}

/** Every position of the solution, start included. */
function solutionFrames(payload: MissionPayload): Frame[] {
  const frames: Frame[] = [{ state: missionStart(payload), keys: startKeys(payload.position) }];
  for (const move of payload.solution) {
    const before = frames[frames.length - 1];
    frames.push({ state: missionApply(payload, before.state, move), keys: moveKeys(before.keys, move) });
  }
  return frames;
}

const STEP_MS = 950;
const HOLD_STEPS = 2; // extra beats on the final position before the loop restarts

function MissionTeach({ payload }: { payload: MissionPayload }) {
  const frames = solutionFrames(payload);
  const [tick, setTick] = useState(0);
  const span = frames.length + HOLD_STEPS;
  useEffect(() => {
    const id = window.setInterval(() => setTick((now) => (now + 1) % span), STEP_MS);
    return () => window.clearInterval(id);
  }, [span]);

  const step = Math.min(tick, frames.length - 1);
  const { state, keys } = frames[step];
  const mover = pieceAt(payload.position, payload.solution[0]?.from ?? -1)?.type ?? payload.piece;
  const numbered = payload.solution.length > 1;
  const arrows: BoardArrow[] = payload.solution.map((move, i) => ({
    ...move,
    label: numbered ? String(i + 1) : undefined,
    bent: pieceAt(frames[i].state.position, move.from)?.type === "N",
  }));
  const look = missionLook(payload.goal, state, null);
  const marks = payload.goal === "mate" && state.won ? trappedMarks(state.position, "b") : undefined;
  const goalLine = payload.goal === "stars" || payload.goal === "capture" ? null : S.teachGoal[payload.goal];
  return (
    <div className="ct-split">
      <ChessBoard
        position={state.position} pieceKeys={keys} stars={state.starsLeft} targets={look.targets}
        tints={look.tints} marks={marks} arrows={arrows} className="ct-board"
      />
      <div className="ct-text">
        <strong className="ct-rule">{goalLine ?? S.rule[mover]}</strong>
        {goalLine && <span className="ct-note">{S.rule[mover]}</span>}
      </div>
    </div>
  );
}

function CountTeach({ payload, answer }: { payload: CountPayload; answer: string }) {
  return (
    <div className="ct-count">
      <div className="ct-count-row">
        {payload.pieces.map((type, i) => (
          <span key={i} className="ct-count-item" aria-label={S.worth(CHESS.piece[type], PIECE_VALUE[type])}>
            <ChessPiece type={type} size={40} />
            <b>{PIECE_VALUE[type]}</b>
          </span>
        ))}
      </div>
      <strong className="ct-sum" data-testid="teach-sum">
        {payload.pieces.map((type) => PIECE_VALUE[type]).join(" + ")} = <em>{answer}</em>
      </strong>
    </div>
  );
}

function PlaceTeach({ payload, answer }: { payload: PlacePayload; answer: string }) {
  // The answer is placeAnswer(row): one letter per square, "." for empty.
  const row = HOME_ROW.map((_, i): PieceType | null => (answer[i] && answer[i] !== "." ? (answer[i] as PieceType) : null));
  const lit = row.map((type, i) => type !== null && payload.row[i] === null);
  const kinds = new Set(payload.tray);
  return (
    <div className="ct-place">
      <HomeRow row={row} fixed={payload.row.map((type) => type !== null)} lit={lit} compact />
      <strong className="ct-rule">{kinds.size === 1 ? S.home[payload.tray[0]] : S.homeRow}</strong>
    </div>
  );
}

/** The solved view shown in the "Almost — look at this." sheet after a miss. */
export function ChessTeach({ question, submitted }: TeachProps) {
  const payload = chessPayload(question);
  if (!payload) return null;
  let body: React.ReactNode;
  switch (payload.tour) {
    case "chess-spot":
      body = <SpotTeach payload={payload} submitted={submitted} />;
      break;
    case "chess-mission":
      body = <MissionTeach payload={payload} />;
      break;
    case "chess-count":
      body = <CountTeach payload={payload} answer={question.answer} />;
      break;
    default:
      body = <PlaceTeach payload={payload} answer={question.answer} />;
  }
  return <div className="ct" data-testid={`teach-${payload.tour}`}>{body}</div>;
}
