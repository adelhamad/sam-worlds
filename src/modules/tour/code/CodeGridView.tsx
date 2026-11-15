// The one Code Lab grid every widget, teach card and demo draws on: a little
// garden map of soft stepping-stone tiles, rocks, stars, a flag and Pogo
// himself, who hops from tile to tile while a program runs. Purely a view —
// runs are played by useRun, judging lives in engine/code.
import type { CSSProperties } from "react";
import type { CodeGrid, Dir } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import { Pogo } from "../../../ui/tour/Pogo";
import { FlagIcon, PinIcon, StarIcon } from "./CodeGlyphs";
import { colOf, rowOf } from "./codeRun";
import type { PogoPose } from "./useRun";
import "./code.css";

const S = CODE.exercise;

const DELTA: Record<Dir, readonly [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

export interface CodeGridViewProps {
  grid: CodeGrid;
  pogo: PogoPose;
  /** A see-through second Pogo: the end of the preview, the trace pin, the debug "watch" run. */
  ghost?: PogoPose | null;
  /** A dotted path through these squares (the live preview). */
  path?: number[] | null;
  /** The dotted path ends in a bump: a little spark on that edge. */
  bumpAt?: { sq: number; dir: Dir } | null;
  /** Numbered footprints on these squares (teach cards; the start is skipped). */
  trail?: number[] | null;
  /** Stars still to grab (default: all of them). Grabbed ones pop away. */
  stars?: number[];
  /** The trace answer the child picked. */
  pin?: number | null;
  /** A soft ring on a square (where the child tapped, in a teach card). */
  ring?: number | null;
  /** The flag was reached: sparkle. */
  won?: boolean;
  /** Tappable squares (trace). Without it the grid is a picture. */
  onSquare?: (sq: number) => void;
  disabled?: boolean;
  className?: string;
}

function at(sq: number, size: number, extra?: Record<string, string | number>): CSSProperties {
  return { "--c": colOf(sq, size), "--r": rowOf(sq, size), ...extra } as CSSProperties;
}

function animClass(pose: PogoPose): string {
  if (pose.hop === 0) return "";
  return `${pose.bonk ? "is-bonk" : "is-hop"}-${pose.hop % 2}`;
}

function Token({ pose, size, ghost = false }: { pose: PogoPose; size: number; ghost?: boolean }) {
  const [dx, dy] = pose.dir ? DELTA[pose.dir] : [0, 0];
  const mood = ghost ? "idle" : pose.mood;
  return (
    <span
      className={["cg-token", ghost ? "is-ghost" : "", pose.dir ? "lean-" + pose.dir : "", pose.hop === 0 ? "is-rest" : ""].join(" ")}
      style={at(pose.at, size, { "--dx": dx, "--dy": dy })} data-testid={ghost ? "code-ghost" : "code-pogo"} data-at={pose.at}
    >
      <span className={`cg-hop ${animClass(pose)}`}>
        <Pogo mood={mood} still={mood === "idle"} size={40} replayKey={pose.hop} />
      </span>
      {pose.bonk && !ghost && <span key={pose.hop} className="cg-bonk" aria-hidden="true" />}
    </span>
  );
}

function squareLabel(grid: CodeGrid, sq: number, pogoAt: number, stars: number[]): string {
  const row = rowOf(sq, grid.size) + 1;
  const col = colOf(sq, grid.size) + 1;
  if (sq === pogoAt) return S.squareStart(row, col);
  return stars.includes(sq) ? S.squareStar(row, col) : S.square(row, col);
}

function center(sq: number, size: number): string {
  return `${colOf(sq, size) + 0.5},${rowOf(sq, size) + 0.5}`;
}

/** The dotted preview path (+ a spark where it bumps). */
function PathLine({ path, bumpAt, size }: { path: number[]; bumpAt?: { sq: number; dir: Dir } | null; size: number }) {
  const points = path.map((sq) => center(sq, size)).join(" ");
  let spark: { x: number; y: number } | null = null;
  if (bumpAt) {
    const [dx, dy] = DELTA[bumpAt.dir];
    spark = { x: colOf(bumpAt.sq, size) + 0.5 + dx * 0.44, y: rowOf(bumpAt.sq, size) + 0.5 + dy * 0.44 };
  }
  return (
    <svg className="cg-path" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" data-testid="code-preview">
      {path.length > 1 && <polyline className="cg-path-under" points={points} />}
      {path.length > 1 && <polyline className="cg-path-dots" points={points} />}
      {spark && (
        <g className="cg-path-bump" transform={`translate(${spark.x} ${spark.y})`}>
          <path d="M0 -0.2 0.06 -0.06 0.2 0 0.06 0.06 0 0.2 -0.06 0.06 -0.2 0 -0.06 -0.06Z" />
        </g>
      )}
    </svg>
  );
}

/** Numbered footprints (teach cards). A square visited twice keeps its first number. */
function Trail({ trail, size }: { trail: number[]; size: number }) {
  const seen = new Set<number>();
  return (
    <>
      {trail.slice(1).map((sq, k) => {
        if (seen.has(sq)) return null;
        seen.add(sq);
        return <span key={k} className="cg-step" style={at(sq, size, { "--k": k })}><b>{k + 1}</b></span>;
      })}
    </>
  );
}

export function CodeGridView({
  grid, pogo, ghost = null, path = null, bumpAt = null, trail = null, stars, pin = null, ring = null, won = false,
  onSquare, disabled = false, className = "",
}: CodeGridViewProps) {
  const { size } = grid;
  const left = stars ?? grid.stars;
  const tappable = Boolean(onSquare);

  const tiles = Array.from({ length: size * size }, (_, sq) => {
    const wall = grid.walls.includes(sq);
    const tone = (rowOf(sq, size) + colOf(sq, size)) % 2 === 0 ? "is-a" : "is-b";
    const cls = `cg-tile ${tone} ${wall ? "is-wall" : ""} ${sq === grid.start ? "is-start" : ""} ${sq === pin ? "is-pinned" : ""}`;
    const inner = (
      <>
        {wall && <span className={`cg-rock rock-${sq % 3}`} />}
        {sq === grid.start && <span className="cg-pad" />}
        {grid.stars.includes(sq) && <StarIcon className={`cg-star ${left.includes(sq) ? "" : "is-got"}`} />}
        {sq === grid.goal && <FlagIcon className={`cg-flag ${won ? "is-won" : ""}`} />}
        {sq === ring && <span className="cg-ring" />}
      </>
    );
    if (!tappable || wall) return <div key={sq} className={cls}>{inner}</div>;
    return (
      <button
        key={sq} type="button" className={cls} disabled={disabled} data-testid={`code-sq-${sq}`}
        aria-label={squareLabel(grid, sq, pogo.at, left)} aria-pressed={sq === pin}
        onClick={() => onSquare?.(sq)}
      >
        {inner}
      </button>
    );
  });

  return (
    <div
      className={`cg ${tappable ? "is-tappable" : ""} ${className}`} style={{ "--n": size } as CSSProperties}
      data-testid="code-grid"
    >
      <div className="cg-field">
        <div className="cg-tiles">{tiles}</div>
        <div className="cg-layer" aria-hidden="true">
          {path && path.length > 0 && <PathLine path={path} bumpAt={bumpAt} size={size} />}
          {trail && <Trail trail={trail} size={size} />}
          {won && grid.goal >= 0 && (
            <span className="cg-burst" style={at(grid.goal, size)}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} style={{ "--a": `${i * 45}deg` } as CSSProperties} />)}
            </span>
          )}
          {ghost && <Token pose={ghost} size={size} ghost />}
          {pin !== null && (
            <span className="cg-pin" style={at(pin, size)} key={pin}>
              <PinIcon />
            </span>
          )}
          <Token pose={pogo} size={size} />
        </div>
      </div>
      {pin !== null && <span className="cg-sr" aria-live="polite">{S.pinned}</span>}
    </div>
  );
}
