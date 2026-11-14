// Drag and drop for chess pieces — pick a piece up like a real one, carry it,
// set it down. Pointer events (touch, mouse, pen), driven straight on the DOM so
// the piece follows the finger 1:1 without re-rendering React every frame.
//
// The "ghost" (the element that visually moves) is steered with two CSS custom
// properties, `--dx` / `--dy`, and marked `[data-dragging]`; its stylesheet
// decides how they apply (see chessBoard.css, chess.css). Drop targets are
// found under the finger by attribute and marked `[data-over]` while hovered.
// A press that does not travel stays a tap.
import { useCallback, useEffect, useRef } from "react";

const SLOP = 10; // px of travel before a press becomes a drag
const CLICK_WINDOW_MS = 350; // the click that follows a press arrives within this
/** How far above the fingertip the piece rides, in piece heights (a finger hides more than a cursor). */
const LIFT = { touch: 0.5, mouse: 0.12 };

export interface PieceDragOptions<T extends string | number> {
  /** Never start a drag while this is false (input locked). */
  enabled: boolean;
  /** The attribute that marks drop targets, e.g. "data-sq". */
  target: string;
  /** May this target take the piece right now? Decides the hover highlight and the drop. */
  accepts: (el: Element, id: T) => boolean;
  /** Released over an accepting target. Anything else just glides home. */
  onDrop: (id: T, el: Element) => void;
}

export interface PieceDrag<T extends string | number> {
  /** Call from onPointerDown. `ghost` is the element to carry. True when the press is being tracked. */
  start: (event: React.PointerEvent<HTMLElement>, id: T, ghost: HTMLElement | null) => boolean;
  /**
   * Call first in onClick: true when the click belongs to a press on `id` this
   * hook already handled — any press ("press") or only one that travelled ("drag").
   */
  clickHandled: (id: T, when: "press" | "drag") => boolean;
}

interface Press<T> {
  id: T;
  moved: boolean;
  until: number;
}

export function usePieceDrag<T extends string | number>(options: PieceDragOptions<T>): PieceDrag<T> {
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });
  const abort = useRef<(() => void) | null>(null);
  const press = useRef<Press<T> | null>(null);
  useEffect(() => () => abort.current?.(), []);

  const start = useCallback((event: React.PointerEvent<HTMLElement>, id: T, ghost: HTMLElement | null) => {
    // One drag at a time: a second finger is ignored while a piece is in hand.
    if (!opts.current.enabled || abort.current || !ghost) return false;
    if (event.pointerType === "mouse" && event.button !== 0) return false;
    const holder = event.currentTarget;
    const pointer = event.pointerId;
    const x0 = event.clientX;
    const y0 = event.clientY;
    const lift = event.pointerType === "mouse" ? LIFT.mouse : LIFT.touch;
    const record: Press<T> = { id, moved: false, until: Infinity };
    press.current = record;
    let home: { x: number; y: number; rise: number } | null = null; // set once the drag begins
    let over: Element | null = null;
    try {
      holder.setPointerCapture(pointer); // keep receiving the pointer wherever it goes
    } catch {
      // no active pointer with this id (synthetic events in tests): window listeners still work
    }

    const targetAt = (x: number, y: number): Element | null => {
      const el = document.elementFromPoint(x, y)?.closest(`[${opts.current.target}]`) ?? null;
      return el && opts.current.accepts(el, id) ? el : null;
    };
    const hover = (now: Element | null) => {
      if (now === over) return;
      over?.removeAttribute("data-over");
      now?.setAttribute("data-over", "");
      over = now;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!home) {
        if (Math.hypot(e.clientX - x0, e.clientY - y0) < SLOP) return;
        record.moved = true;
        ghost.style.transition = "none";
        ghost.style.setProperty("--dx", "0px");
        ghost.style.setProperty("--dy", "0px");
        ghost.setAttribute("data-dragging", "");
        const rect = ghost.getBoundingClientRect(); // where the piece rests, in its carried look
        home = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rise: rect.height * lift };
      }
      ghost.style.setProperty("--dx", `${e.clientX - home.x}px`);
      ghost.style.setProperty("--dy", `${e.clientY - home.y - home.rise}px`);
      hover(targetAt(e.clientX, e.clientY));
    };

    const stop = () => {
      abort.current = null;
      record.until = performance.now() + CLICK_WINDOW_MS;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      hover(null);
      if (holder.hasPointerCapture?.(pointer)) holder.releasePointerCapture(pointer);
      // Back to the stylesheet: the piece glides to wherever it now belongs
      // (its new square after a drop, home otherwise).
      ghost.removeAttribute("data-dragging");
      ghost.style.removeProperty("--dx");
      ghost.style.removeProperty("--dy");
      ghost.style.transition = "";
    };

    function end(e: PointerEvent) {
      if (e.pointerId !== pointer) return;
      // Look under the finger BEFORE the piece is let go.
      const target = home && e.type === "pointerup" ? targetAt(e.clientX, e.clientY) : null;
      stop();
      if (target) opts.current.onDrop(id, target);
    }

    abort.current = stop;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return true;
  }, []);

  const clickHandled = useCallback((id: T, when: "press" | "drag") => {
    const last = press.current;
    if (!last || last.id !== id || performance.now() > last.until) return false;
    press.current = null;
    return when === "press" || last.moved;
  }, []);

  return { start, clickHandled };
}
