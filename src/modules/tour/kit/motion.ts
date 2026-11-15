// Motion + drag helpers shared by the kit widgets.
//  - useFlip: cards fly to their new home (tray → slot, bank → line, back).
//  - useKitDrag: press a card, carry it over a drop zone, let go. A press that
//    does not travel stays a plain tap, so tapping alone is always enough.
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { reducedMotion } from "../exercises/shared";

const FLY_MS = 260;
const FLY_EASE = "cubic-bezier(0.2, 1.25, 0.4, 1)";

/**
 * FLIP for every `[data-flip="key"]` inside `root`: call the returned
 * `capture()` right before a state change; after the re-render each element
 * whose key existed before flies from its old box to its new one.
 */
export function useFlip(root: RefObject<HTMLElement>): () => void {
  const before = useRef<Map<string, DOMRect> | null>(null);
  useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || !root.current || reducedMotion()) return;
    root.current.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const from = prev.get(el.dataset.flip ?? "");
      if (!from) return;
      const now = el.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (now.left + now.width / 2);
      const dy = from.top + from.height / 2 - (now.top + now.height / 2);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(1.05)`, zIndex: 4 },
          { transform: "translate(0, 0) scale(1)", zIndex: 4 },
        ],
        { duration: FLY_MS, easing: FLY_EASE },
      );
    });
  });
  return () => {
    const map = new Map<string, DOMRect>();
    root.current?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      if (el.dataset.flip) map.set(el.dataset.flip, el.getBoundingClientRect());
    });
    before.current = map;
  };
}

const SLOP = 10; // px of travel before a press becomes a drag

function dropAt(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y)?.closest("[data-drop]") ?? null;
}

/**
 * Drag between drop zones marked `data-drop="<target>"`. Returns `start(event,
 * id)` for a card's onPointerDown and `wasDrag()` for the first line of its
 * onClick (swallows the click that follows a drag). `onDrop` runs while the
 * card still sits under the finger, so a FLIP capture there flies it home.
 */
export function useKitDrag(onDrop: (id: string, target: string) => void, enabled: boolean) {
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
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.06) rotate(-2deg)`;
      const now = dropAt(e.clientX, e.clientY);
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
      const target = moving && e.type === "pointerup" ? dropAt(e.clientX, e.clientY)?.getAttribute("data-drop") : null;
      if (target) drop.current(id, target);
      stop();
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
