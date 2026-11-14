// The one chess board every widget, teach card and demo draws on. Purely a
// view: it shows a Position plus overlays and reports taps and drops — rules
// and judging live in engine/chess. Each square is a real button; pieces sit in
// a layer above and SLIDE between squares (a knight hops in an arc). A piece
// listed in `draggable` can also be picked up and carried like a real one.
import type { CSSProperties } from "react";
import { colOf, isLightSquare, pieceAt, rowOf, squareName } from "../../engine/chess/rules";
import type { Piece, Position } from "../../engine/chess/types";
import { CHESS } from "../../strings/chess";
import { BoardArrows } from "./BoardArrows";
import type { BoardArrow, BoardBurst, MarkTone, PieceKeys, SquareTint } from "./boardTypes";
import { ChessPiece } from "./ChessPiece";
import { CrossGlyph, StarGlyph, TickGlyph } from "./Glyphs";
import { usePieceMotion, type PlacedPiece } from "./pieceMotion";
import { usePieceDrag } from "./usePieceDrag";
import "./chessBoard.css";

export interface ChessBoardProps {
  position: Position;
  /** Square → stable key, so a moved piece glides (see startKeys / moveKeys). */
  pieceKeys?: PieceKeys;
  /** Square of the picked-up piece (lifted, its square lit). */
  selected?: number | null;
  /** Square of the piece the question is about (glows, bobs gently). */
  focus?: number | null;
  /** Legal destinations: a dot on an empty square, a ring around a piece. */
  dots?: number[];
  /** Squares the child marked (or the solved view's verdicts), by tone. */
  marks?: Record<number, MarkTone>;
  /** Squares of pieces that gently bob: "you can pick me". */
  hints?: number[];
  /** Squares holding a star to collect. */
  stars?: number[];
  /** Squares of pieces to capture (pulsing ring). */
  targets?: number[];
  /** Colour washes: danger halo, line of fire, goal row, flash, last-move trail. */
  tints?: Record<number, SquareTint>;
  /** Numbered arrows (a solution). */
  arrows?: BoardArrow[];
  /** One-shot effects (capture puff, star sparkle, crowning). */
  bursts?: BoardBurst[];
  /** Change `n` to give the piece on `sq` a tiny "not there" wobble. */
  wobble?: { sq: number; n: number } | null;
  /** Called with the tapped square. Without it the board is a picture. */
  onSquare?: (sq: number) => void;
  /** Squares whose piece can be picked up and carried (drag and drop). */
  draggable?: number[];
  /** A draggable piece was pressed: put it in hand, so `dots` shows where it may go. */
  onGrab?: (sq: number) => void;
  /** A carried piece was set down on `to` — only ever a square listed in `dots`. */
  onDrop?: (from: number, to: number) => void;
  /** Ignore taps (feedback showing, input locked). */
  disabled?: boolean;
  className?: string;
}

function at(sq: number, size: number): CSSProperties {
  return { "--c": colOf(sq, size), "--r": rowOf(sq, size) } as CSSProperties;
}

function Mark({ tone, ring }: { tone: MarkTone; ring: boolean }) {
  return (
    <span className={`cb-mark is-${tone} ${ring ? "is-ring" : ""}`}>
      {tone === "good" && !ring && <TickGlyph />}
      {(tone === "extra" || tone === "no") && !ring && <CrossGlyph />}
    </span>
  );
}

const RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

function Burst({ burst, size }: { burst: BoardBurst; size: number }) {
  return (
    <span className={`cb-burst cb-burst-${burst.kind}`} style={at(burst.sq, size)}>
      {burst.piece && <span className="cb-burst-ghost"><ChessPiece type={burst.piece.type} side={burst.piece.side} fit /></span>}
      <span className="cb-burst-ring" />
      {RAYS.map((i) => <i key={i} style={{ "--a": `${i * 45}deg` } as CSSProperties} />)}
    </span>
  );
}

function pieceClass(sq: number, selected: number | null, focus: number | null, hints: number[] | undefined): string {
  if (sq === selected) return "cb-piece is-selected";
  if (sq === focus) return "cb-piece is-focus";
  return hints?.includes(sq) ? "cb-piece is-hint" : "cb-piece";
}

function squareLabel(position: Position, sq: number, piece: Piece | undefined, star: boolean): string {
  const name = squareName(sq, position.size);
  if (piece) return CHESS.exercise.squarePiece(name, CHESS.exercise.side[piece.side], CHESS.piece[piece.type]);
  return star ? CHESS.exercise.squareStar(name) : name;
}

export function ChessBoard({
  position, pieceKeys, selected = null, focus = null, hints, dots, marks, stars, targets, tints, arrows, bursts,
  wobble = null, onSquare, draggable, onGrab, onDrop, disabled = false, className = "",
}: ChessBoardProps) {
  const { size } = position;
  const placed: PlacedPiece[] = position.pieces.map((piece) => ({
    key: pieceKeys?.[piece.sq] ?? `${piece.side}${piece.type}${piece.sq}`,
    piece,
  }));
  const { field, setDown } = usePieceMotion(placed, wobble);
  const locked = disabled || !onSquare;
  const carry = !locked && Boolean(draggable?.length);
  const drag = usePieceDrag<number>({
    enabled: carry,
    target: "data-sq",
    // a square of THIS board that the piece in hand may go to
    accepts: (el) => el.hasAttribute("data-go") && Boolean(field.current?.contains(el)),
    onDrop: (from, el) => {
      setDown(); // a squash on arrival instead of the slide / hop
      onDrop?.(from, Number(el.getAttribute("data-sq")));
    },
  });

  const press = (event: React.PointerEvent<HTMLButtonElement>, sq: number) => {
    if (!carry || !draggable?.includes(sq)) return;
    const ghost = field.current?.querySelector<HTMLElement>(`[data-at="${sq}"]`) ?? null;
    if (drag.start(event, sq, ghost)) onGrab?.(sq);
  };
  const click = (sq: number) => {
    // The press on a draggable piece already picked it up (onGrab).
    if (!drag.clickHandled(sq, "press")) onSquare?.(sq);
  };

  const squares = Array.from({ length: size * size }, (_, sq) => {
    const piece = pieceAt(position, sq);
    const tint = tints?.[sq];
    const mark = marks?.[sq];
    const star = stars?.includes(sq) ?? false;
    const cls = [
      "cb-sq",
      isLightSquare(sq, size) ? "is-light" : "is-dark",
      sq === selected ? "is-selected" : "",
      sq === focus ? "is-focus" : "",
      tint ? `tint-${tint}` : "",
    ].filter(Boolean).join(" ");
    return (
      <button
        key={sq} type="button" className={cls} disabled={locked} data-testid={`sq-${sq}`}
        data-sq={sq} data-go={dots?.includes(sq) ? "" : undefined}
        aria-label={squareLabel(position, sq, piece, star)}
        aria-pressed={mark === "plain" || sq === selected ? true : undefined}
        onPointerDown={(event) => press(event, sq)} onClick={() => click(sq)}
      >
        {star && <StarGlyph className="cb-star" />}
        {targets?.includes(sq) && <span className="cb-target" />}
        {dots?.includes(sq) && <span className={`cb-dot ${piece || star ? "is-ring" : ""}`} data-testid={`dot-${sq}`} />}
        {mark && <Mark tone={mark} ring={Boolean(piece)} />}
      </button>
    );
  });

  return (
    <div className={`cb ${locked ? "is-locked" : ""} ${carry ? "is-carry" : ""} ${className}`} style={{ "--n": size } as CSSProperties}>
      <div className="cb-field" ref={field}>
        <div className="cb-grid">{squares}</div>
        {arrows && arrows.length > 0 && <BoardArrows arrows={arrows} size={size} />}
        <div className="cb-pieces" aria-hidden="true">
          {placed.map(({ key, piece }) => (
            <span
              key={key} data-piece={key} data-at={piece.sq} style={at(piece.sq, size)}
              className={pieceClass(piece.sq, selected, focus, hints)}
            >
              <span className="cb-piece-art"><ChessPiece type={piece.type} side={piece.side} fit /></span>
            </span>
          ))}
          {bursts?.map((burst) => <Burst key={burst.id} burst={burst} size={size} />)}
        </div>
      </div>
    </div>
  );
}
