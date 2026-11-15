// The program as a wrapping row of chunky blocks after a start cap. One view
// for every use: "build" (tap an arrow to take it out, a loop to put arrows in
// it), "edit" (debug: tap an arrow to turn it), "read" (trace: big, read-only)
// and "mini" (teach cards, demos). While a run plays, the block that made the
// current step lights up; inside a loop the body arrow lights and the loop
// counts its passes.
import type { CSSProperties, MouseEvent } from "react";
import type { CodeBlock, Dir, LoopBlock } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import { ArrowGlyph, CrossIcon, PlayIcon, RepeatIcon, TickIcon, WrenchIcon } from "./CodeGlyphs";
import { arrowKey, isLoop, LOOP_SLOTS, type BlockRef } from "./codeRun";
import "./codeBlocks.css";

const S = CODE.exercise;

export type TrackMode = "build" | "edit" | "read" | "mini";
export type ArrowMark = "edit" | "fixed";

export interface ProgramTrackProps {
  program: CodeBlock[];
  mode: TrackMode;
  /** Top-level block limit: shows "used / max". */
  max?: number | null;
  /** The block of the step being played. */
  active?: BlockRef | null;
  /** The loop arrows currently go into (build). */
  open?: number | null;
  /** Badges on arrows by key ("i" / "i-j"): a wrench (edit) or a highlight (fixed). */
  marks?: Record<string, ArrowMark>;
  /** The arrow whose picker is open (edit). */
  picked?: string | null;
  /** An arrow that just snapped back (edit): `n` replays the shuffle. */
  shuffle?: { key: string; n: number } | null;
  /** Changes when the limit is hit: the counter wobbles. */
  wobble?: number;
  onArrow?: (key: string) => void;
  onLoop?: (i: number) => void;
  onRemoveLoop?: (i: number) => void;
  onCloseLoop?: () => void;
  /** A tap on the track itself (outside every block). */
  onTrack?: () => void;
  disabled?: boolean;
  className?: string;
}

interface ArrowProps {
  dir: Dir;
  testId: string;
  lit: boolean;
  mark?: ArrowMark;
  picked: boolean;
  shuffled: number | null;
  mode: TrackMode;
  disabled: boolean;
  onTap?: () => void;
}

function stop(event: MouseEvent) {
  event.stopPropagation();
}

/** One arrow block: a button while it can be tapped, a picture otherwise. */
function Arrow({ dir, testId, lit, mark, picked, shuffled, mode, disabled, onTap }: ArrowProps) {
  const cls = [
    "cp-block", `d-${dir}`, lit ? "is-lit" : "", mark ? `is-${mark}` : "", picked ? "is-picked" : "",
    shuffled === null ? "" : `is-shuffle-${shuffled % 2}`,
  ].filter(Boolean).join(" ");
  const art = (
    <>
      <ArrowGlyph dir={dir} />
      {mode === "build" && <span className="cp-x" aria-hidden="true"><CrossIcon /></span>}
      {mark === "edit" && <span className="cp-wrench" aria-hidden="true"><WrenchIcon /></span>}
    </>
  );
  if (!onTap) {
    return <span className={cls} data-testid={testId} role="img" aria-label={S.arrow(S.dir[dir])}>{art}</span>;
  }
  const label = mode === "build" ? S.remove(S.dir[dir]) : S.change(S.dir[dir]);
  return (
    <button
      type="button" className={cls} data-testid={testId} aria-label={label} aria-pressed={mode === "edit" ? picked : undefined}
      disabled={disabled} onClick={(event) => { stop(event); onTap(); }}
    >
      {art}
    </button>
  );
}

interface LoopProps extends Omit<ProgramTrackProps, "program" | "max" | "wobble" | "onTrack" | "className"> {
  block: LoopBlock;
  i: number;
}

function LoopView({ block, i, mode, active, open, marks, picked, shuffle, onArrow, onLoop, onRemoveLoop, onCloseLoop, disabled = false }: LoopProps) {
  const isOpen = open === i;
  const lit = active?.i === i ? active : null;
  // only the next free slot shows: the open loop stays narrow enough for a phone row
  const slots = isOpen && block.body.length < LOOP_SLOTS ? 1 : 0;
  const head = (
    <>
      <RepeatIcon />
      <span className="cp-times">×{block.times}</span>
      {lit && <span key={lit.iter} className="cp-count" data-testid={`code-count-${i}`}>{lit.iter + 1}</span>}
    </>
  );
  const interactive = mode === "build" && onLoop;
  return (
    <span
      className={`cp-loop ${isOpen ? "is-open" : ""} ${lit ? "is-lit" : ""} ${block.body.length === 0 ? "is-empty" : ""}`}
      data-testid={`code-loopblock-${i}`}
    >
      {interactive ? (
        <button
          type="button" className="cp-loop-head" data-testid={`code-block-${i}`} disabled={disabled}
          aria-label={S.openLoop(block.times)} aria-expanded={isOpen} onClick={(event) => { stop(event); onLoop(i); }}
        >
          {head}
        </button>
      ) : (
        <span className="cp-loop-head" data-testid={`code-block-${i}`} role="img" aria-label={S.loop(block.times)}>{head}</span>
      )}
      <span className="cp-loop-body">
        {block.body.map((dir, j) => {
          const key = arrowKey(i, j);
          return (
            <Arrow
              key={j} dir={dir} testId={`code-block-${i}-${j}`} lit={lit?.j === j} mark={marks?.[key]} picked={picked === key}
              shuffled={shuffle?.key === key ? shuffle.n : null} mode={mode} disabled={disabled}
              onTap={onArrow && (mode === "build" || mode === "edit") ? () => onArrow(key) : undefined}
            />
          );
        })}
        {slots > 0 && <span className="cp-slot is-next" />}
        {isOpen && onCloseLoop && (
          <button
            type="button" className="cp-done" data-testid="code-loop-done" disabled={disabled} aria-label={S.closeLoop}
            onClick={(event) => { stop(event); onCloseLoop(); }}
          >
            <TickIcon />
          </button>
        )}
      </span>
      {interactive && onRemoveLoop && (
        <button
          type="button" className="cp-loop-x" data-testid={`code-remove-${i}`} disabled={disabled} aria-label={S.removeLoop}
          onClick={(event) => { stop(event); onRemoveLoop(i); }}
        >
          <CrossIcon />
        </button>
      )}
    </span>
  );
}

export function ProgramTrack(props: ProgramTrackProps) {
  const { program, mode, max = null, active = null, marks, picked = null, shuffle = null, wobble = 0, onArrow, onTrack, disabled = false, className = "" } = props;
  const room = max !== null && program.length < max;
  return (
    <div
      className={`cp-track mode-${mode} ${disabled ? "is-locked" : ""} ${className}`} data-testid="code-track"
      onClick={onTrack && !disabled ? onTrack : undefined}
    >
      <span className="cp-cap" aria-hidden="true"><PlayIcon /></span>
      {program.map((block, i) => (
        isLoop(block) ? (
          <LoopView key={i} {...props} block={block} i={i} />
        ) : (
          <Arrow
            key={i} dir={block} testId={`code-block-${i}`} lit={active?.i === i} mark={marks?.[arrowKey(i)]}
            picked={picked === arrowKey(i)} shuffled={shuffle?.key === arrowKey(i) ? shuffle.n : null} mode={mode} disabled={disabled}
            onTap={onArrow && (mode === "build" || mode === "edit") ? () => onArrow(arrowKey(i)) : undefined}
          />
        )
      ))}
      {mode === "build" && room && program.length === 0 && <span className="cp-slot is-ghost is-next" aria-hidden="true" />}
      {mode === "build" && program.length === 0 && <span className="cp-empty">{S.empty}</span>}
      {max !== null && (
        <span
          key={wobble} className={`cp-used ${wobble > 0 ? "is-wobble" : ""} ${room ? "" : "is-full"}`}
          style={{ "--fill": program.length / max } as CSSProperties} data-testid="code-used"
          role="img" aria-label={S.used(program.length, max)}
        >
          {program.length}/{max}
        </span>
      )}
    </div>
  );
}
