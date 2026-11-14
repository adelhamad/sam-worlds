// Optional drag for the sort exercise: press a tray card, drag it over a bucket,
// let go. A press that doesn't travel stays a plain tap (handled by onClick).
import { useCallback, useEffect, useRef } from "react";

const SLOP = 10; // px of travel before a press becomes a drag

function bucketAt(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y)?.closest("[data-bucket]") ?? null;
}

/**
 * Returns `start(event, id)` for a card's onPointerDown, and `wasDrag()` which
 * the card's onClick uses to swallow the click that follows a drag.
 */
export function useCardDrag(onDrop: (id: string, bucket: string) => void, enabled: boolean) {
  const abort = useRef<(() => void) | null>(null);
  const dragged = useRef(false);
  const drop = useRef(onDrop);
  useEffect(() => {
    drop.current = onDrop;
  });
  useEffect(() => () => abort.current?.(), []);

  const start = useCallback((event: React.PointerEvent<HTMLElement>, id: string) => {
    dragged.current = false;
    if (!enabled || abort.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const el = event.currentTarget;
    const pointer = event.pointerId;
    const x0 = event.clientX;
    const y0 = event.clientY;
    let moving = false;
    let over: Element | null = null;

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (!moving && Math.hypot(dx, dy) < SLOP) return;
      if (!moving) {
        moving = true;
        dragged.current = true;
        el.classList.add("is-dragging");
      }
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.08) rotate(-3deg)`;
      const now = bucketAt(e.clientX, e.clientY);
      if (now !== over) {
        over?.classList.remove("is-over");
        now?.classList.add("is-over");
        over = now;
      }
    };
    const stop = () => {
      abort.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      over?.classList.remove("is-over");
      el.classList.remove("is-dragging");
      el.style.transform = "";
    };
    function end(e: PointerEvent) {
      if (e.pointerId !== pointer) return;
      // Look under the finger BEFORE the card is released back into the tray.
      const bucket = moving && e.type === "pointerup"
        ? bucketAt(e.clientX, e.clientY)?.getAttribute("data-bucket")
        : null;
      stop();
      if (bucket) drop.current(id, bucket);
    }

    abort.current = stop;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }, [enabled]);

  const wasDrag = useCallback(() => {
    const was = dragged.current;
    dragged.current = false;
    return was;
  }, []);

  return { start, wasDrag };
}
