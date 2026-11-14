// How a piece moves on the board once its square changes: the wrapper glides
// (a CSS transition in chessBoard.css) while the art on top plays a flourish —
// a hop for knights, a soft landing for sliders, a squash when it was set down
// by hand, a flourish when a pawn is crowned. Web Animations API, so nothing
// re-renders; skipped entirely under reduced motion.
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import type { Piece } from "../../engine/chess/types";

const SPRING = "cubic-bezier(0.3, 1.3, 0.5, 1)";

const HOP: Keyframe[] = [
  { transform: "translateY(0) scale(1)" },
  { transform: "translateY(-46%) scale(1.2)", offset: 0.45 },
  { transform: "translateY(0) scale(1.06, 0.9)", offset: 0.86 },
  { transform: "translateY(0) scale(1)" },
];
const LAND: Keyframe[] = [
  { transform: "translateY(-7%) scale(1.1)" },
  { transform: "translateY(-7%) scale(1.1)", offset: 0.6 },
  { transform: "translateY(0) scale(1.08, 0.9)", offset: 0.85 },
  { transform: "translateY(0) scale(1)" },
];
/** Set down by hand: it was already carried there, so only the squash. */
const SET_DOWN: Keyframe[] = [
  { transform: "scale(1.16)" },
  { transform: "scale(1.12, 0.84)", offset: 0.55 },
  { transform: "scale(0.97, 1.04)", offset: 0.8 },
  { transform: "scale(1)" },
];
const CROWN: Keyframe[] = [
  { transform: "scale(1) rotate(0)" }, { transform: "scale(1.45) rotate(-8deg)", offset: 0.4 }, { transform: "scale(1) rotate(0)" },
];
const WOBBLE: Keyframe[] = [
  { transform: "translateX(0)" }, { transform: "translateX(-7%)" }, { transform: "translateX(6%)" },
  { transform: "translateX(-3%)" }, { transform: "translateX(0)" },
];

function reduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function flourish(wrap: HTMLElement, art: Element, frames: Keyframe[], crowned: boolean): void {
  wrap.style.zIndex = "5"; // above everything it passes
  const anim = art.animate(frames, { duration: frames === HOP ? 380 : 320, easing: "ease-out" });
  anim.onfinish = () => {
    wrap.style.zIndex = "";
    if (crowned) art.animate(CROWN, { duration: 460, easing: SPRING });
  };
}

export interface PlacedPiece {
  key: string;
  piece: Piece;
}

export interface PieceMotion {
  /** Ref for the board's field (the element holding squares and pieces). */
  field: RefObject<HTMLDivElement>;
  /** Call right before reporting a drop: the next move is set down, not slid. */
  setDown: () => void;
}

/** `wobble.n` changes to shake the piece on `wobble.sq`. */
export function usePieceMotion(placed: PlacedPiece[], wobble: { sq: number; n: number } | null): PieceMotion {
  const field = useRef<HTMLDivElement>(null);
  const carried = useRef(false);
  const last = useRef(new Map<string, Piece>());
  const lastWobble = useRef(wobble?.n);

  useLayoutEffect(() => {
    const before = last.current;
    const now = new Map<string, Piece>();
    const byHand = carried.current;
    for (const { key, piece } of placed) {
      now.set(key, piece);
      const was = before.get(key);
      if (!was || (was.sq === piece.sq && was.type === piece.type)) continue;
      const wrap = field.current?.querySelector<HTMLElement>(`[data-piece="${key}"]`);
      const art = wrap?.firstElementChild;
      if (!wrap || !art?.animate || reduced()) continue;
      const crowned = was.type !== piece.type;
      let frames = LAND;
      if (byHand) frames = SET_DOWN;
      else if (was.type === "N") frames = HOP;
      flourish(wrap, art, frames, crowned);
    }
    carried.current = false;
    last.current = now;
  });

  useLayoutEffect(() => {
    if (!wobble || wobble.n === lastWobble.current) return;
    lastWobble.current = wobble.n;
    const art = field.current?.querySelector(`[data-at="${wobble.sq}"]`)?.firstElementChild;
    if (art?.animate && !reduced()) art.animate(WOBBLE, { duration: 260, easing: "ease-out" });
  }, [wobble]);

  const setDown = useCallback(() => {
    carried.current = true;
  }, []);
  return { field, setDown };
}
