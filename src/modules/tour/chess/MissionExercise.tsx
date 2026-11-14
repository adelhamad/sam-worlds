// chess-mission — the star of the course: move White's pieces to reach a goal
// within a move budget. Pick a piece up and carry it to a dot (drag and drop),
// or tap it (auto-picked when only one can move) and then tap a dot.
// Self-submitting: the verdict comes from useMission.
import { useRef, useState, type CSSProperties } from "react";
import { pieceAt } from "../../../engine/chess/rules";
import type { MissionPayload } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { ChessBoard } from "../../../ui/chess/ChessBoard";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { AimGlyph, ShieldGlyph, StarGlyph } from "../../../ui/chess/Glyphs";
import type { WidgetProps } from "../exercises/shared";
import { missionLook } from "./missionLook";
import { useMission, type Mission } from "./useMission";

const S = CHESS.exercise;

interface Flight {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
}

/** What to do, as a picture: stars / captures show a running count. */
function GoalChip({ payload, mission }: { payload: MissionPayload; mission: Mission }) {
  const { goal } = payload;
  if (goal === "stars") {
    return (
      <>
        <StarGlyph size={30} />
        <span className="cx-goal-num" data-testid="mission-stars">{mission.starsGot}/{payload.stars.length}</span>
        <span className="cx-sr">{S.starsGot(mission.starsGot, payload.stars.length)}</span>
      </>
    );
  }
  if (goal === "capture") {
    const got = payload.targets.length - mission.state.targetsLeft.length;
    return (
      <>
        <AimGlyph size={28} />
        <span className="cx-goal-num">{got}/{payload.targets.length}</span>
        <span className="cx-sr">{S.capturesGot(got, payload.targets.length)}</span>
      </>
    );
  }
  return (
    <>
      {goal === "escape" && <ShieldGlyph size={26} />}
      <ChessPiece type={goal === "promote" ? "Q" : "K"} side={goal === "check" || goal === "mate" ? "b" : "w"} size={30} />
      {(goal === "check" || goal === "mate") && <AimGlyph size={24} />}
      <span className="cx-sr">{S.goal[goal]}</span>
    </>
  );
}

function helpLine(goal: MissionPayload["goal"], mission: Mission): string {
  if (mission.phase === "won") return S.won;
  if (mission.phase === "out") return goal === "escape" ? S.stillDanger : S.outOfMoves;
  // Name the piece when there is only one to move: "Drag the rook to a star."
  const only = mission.single && mission.active !== null ? pieceAt(mission.state.position, mission.active) : undefined;
  return S.missionHelp[goal](only ? CHESS.piece[only.type] : null);
}

export function MissionExercise({ payload, disabled, onSubmit }: WidgetProps<MissionPayload>) {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  /** A collected star flies from its square to the counter. */
  const flyStar = (sq: number) => {
    const from = root.current?.querySelector(`[data-testid="sq-${sq}"]`)?.getBoundingClientRect();
    const to = chip.current?.getBoundingClientRect();
    const base = root.current?.getBoundingClientRect();
    if (!from || !to || !base) return;
    const size = from.width * 0.66;
    const x = from.left - base.left + (from.width - size) / 2;
    const y = from.top - base.top + (from.height - size) / 2;
    setFlights((now) => [...now, {
      id: now.length, x, y, size,
      dx: to.left - base.left + 8 - x - (size - 30) / 2,
      dy: to.top - base.top + (to.height - 30) / 2 - y - (size - 30) / 2,
    }]);
  };

  const mission = useMission(payload, disabled, onSubmit, flyStar);
  const { state, phase } = mission;
  const look = missionLook(payload.goal, state, mission.last);
  const left = payload.budget - state.used;

  return (
    <div className={`cx cx-mission is-${phase}`} ref={root} data-testid="chess-mission" data-phase={phase}>
      <div className="cx-bar">
        <div className={`cx-goal is-${payload.goal}`} ref={chip} key={mission.starsGot + state.targetsLeft.length}>
          <GoalChip payload={payload} mission={mission} />
        </div>
        <p className="cx-help" aria-live="polite" key={phase}>{helpLine(payload.goal, mission)}</p>
        <div className="cx-pips" role="img" aria-label={S.movesLeft(left)} data-testid="mission-moves" data-left={left}>
          {Array.from({ length: payload.budget }, (_, i) => (
            <span key={i} className={`cx-pip ${i < left ? "is-left" : "is-used"}`} />
          ))}
        </div>
      </div>
      <ChessBoard
        position={state.position} pieceKeys={mission.keys} selected={mission.active} hints={mission.hints} dots={mission.dots}
        stars={state.starsLeft} targets={look.targets} tints={look.tints} bursts={mission.bursts}
        wobble={mission.wobble} onSquare={mission.tap} draggable={mission.movable} onGrab={mission.grab}
        onDrop={mission.drop} disabled={disabled || phase !== "play"}
      />
      {flights.map((flight) => (
        <span
          key={flight.id} className="cx-fly" aria-hidden="true"
          style={{ left: flight.x, top: flight.y, width: flight.size, height: flight.size, "--dx": `${flight.dx}px`, "--dy": `${flight.dy}px` } as CSSProperties}
        >
          <StarGlyph />
        </span>
      ))}
    </div>
  );
}
