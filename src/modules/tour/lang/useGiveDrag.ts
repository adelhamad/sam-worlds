// Drag a picture from the table to Pogo (lang-give). Pointer Events with
// capture (touch, mouse, pen), driven straight on the DOM so the picture
// follows the finger 1:1 without re-rendering React per move.
//
// What moves is a "ghost": a copy of the picture in a fixed layer on <body>,
// so no scrolling or clipping parent can cut it off on its way up to Pogo.
// The table keeps an empty spot while it travels. Released over Pogo, the
// ghost is handed to `onDrop` (the widget flies it into his hands); released
// anywhere else it glides home. A press that does not travel stays a tap.
import { useCallback, useEffect, useRef } from "react";
import { reducedMotion } from "../exercises/shared";

const SLOP = 8; // px of travel before a press becomes a drag
const CLICK_WINDOW_MS = 350; // the click that follows a press arrives within this
const HOME_MS = 260;
/** Extra room around Pogo that still counts as "on Pogo" (px). */
const REACH = 18;

/** How close the picture is to Pogo while it is carried. */
export type Band = "far" | "near" | "over";

export interface Ghost {
  el: HTMLElement;
  remove: () => void;
}

/** Copy `source` into a fixed layer exactly where it sits now. */
export function liftGhost(source: HTMLElement): Ghost {
  const rect = source.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "tour lxg-layer";
  const el = source.cloneNode(true) as HTMLElement;
  el.classList.add("lxg-ghost");
  el.removeAttribute("data-testid");
  Object.assign(el.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  layer.appendChild(el);
  document.body.appendChild(layer);
  return { el, remove: () => layer.remove() };
}

/** Glide a ghost so its centre lands on `to`'s centre at `to`'s size. */
export function flyGhost(ghost: Ghost, to: DOMRect, ms: number): void {
  const { style } = ghost.el;
  const [x, y, w, h] = [style.left, style.top, style.width, style.height].map(parseFloat);
  const dx = to.left + to.width / 2 - (x + w / 2);
  const dy = to.top + to.height / 2 - (y + h / 2);
  const ease = `${ms}ms cubic-bezier(0.3, 0.7, 0.35, 1)`;
  ghost.el.classList.remove("is-carried");
  ghost.el.classList.add("is-flying");
  style.transition = `transform ${ease}, scale ${ease}, rotate ${ease}`;
  style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  style.scale = String(to.width / Math.max(1, w));
  style.rotate = "0deg";
}

function inside(x: number, y: number, rect: DOMRect, reach: number): boolean {
  return x >= rect.left - reach && x <= rect.right + reach && y >= rect.top - reach && y <= rect.bottom;
}

export interface GiveDragOptions {
  /** Never start a drag while this is false. */
  enabled: boolean;
  /** Pogo's drop zone. */
  zone: () => HTMLElement | null;
  /** The band changed (null = nothing is carried any more). Called only on change. */
  onBand: (band: Band | null) => void;
  /** Released on Pogo: the ghost now belongs to the caller (it must remove it). */
  onDrop: (id: string, ghost: Ghost) => void;
}

interface Press {
  id: string;
  moved: boolean;
  until: number;
}

export function useGiveDrag(options: GiveDragOptions) {
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });
  const abort = useRef<(() => void) | null>(null);
  const press = useRef<Press | null>(null);
  useEffect(() => () => abort.current?.(), []);

  /** onPointerDown of a picture button; `art` is the part that is carried. */
  const start = useCallback((event: React.PointerEvent<HTMLElement>, id: string, art: HTMLElement | null) => {
    if (!opts.current.enabled || abort.current || !art) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const holder = event.currentTarget;
    const pointer = event.pointerId;
    const x0 = event.clientX;
    const y0 = event.clientY;
    const record: Press = { id, moved: false, until: Infinity };
    press.current = record;
    let ghost: Ghost | null = null;
    let zone: DOMRect | null = null;
    let band: Band | null = null;
    try {
      holder.setPointerCapture(pointer); // keep the pointer wherever the finger goes
    } catch {
      // synthetic events without an active pointer: the window listeners still work
    }

    const setBand = (next: Band | null) => {
      if (next === band) return;
      band = next;
      opts.current.onBand(next);
    };
    const bandAt = (x: number, y: number): Band => {
      if (!zone) return "far";
      if (inside(x, y, zone, REACH)) return "over";
      const cx = zone.left + zone.width / 2;
      const cy = zone.top + zone.height / 2;
      return Math.hypot(x - cx, y - cy) < zone.width * 1.25 ? "near" : "far";
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!ghost) {
        if (Math.hypot(e.clientX - x0, e.clientY - y0) < SLOP) return;
        record.moved = true;
        ghost = liftGhost(art);
        ghost.el.classList.add("is-carried");
        holder.setAttribute("data-lifted", "");
        zone = opts.current.zone()?.getBoundingClientRect() ?? null;
      }
      e.preventDefault();
      ghost.el.style.transform = `translate3d(${e.clientX - x0}px, ${e.clientY - y0}px, 0)`;
      setBand(bandAt(e.clientX, e.clientY));
    };

    const goHome = (carried: Ghost) => {
      const done = () => {
        carried.remove();
        holder.removeAttribute("data-lifted");
      };
      if (reducedMotion()) { done(); return; }
      const ease = `${HOME_MS}ms cubic-bezier(0.2, 1.25, 0.4, 1)`;
      carried.el.style.transition = `transform ${ease}, scale ${ease}, rotate ${ease}`;
      carried.el.classList.remove("is-carried");
      carried.el.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(done, HOME_MS + 20);
    };

    const stop = () => {
      abort.current = null;
      record.until = performance.now() + CLICK_WINDOW_MS;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (holder.hasPointerCapture?.(pointer)) holder.releasePointerCapture(pointer);
      setBand(null);
    };

    function end(e: PointerEvent) {
      if (e.pointerId !== pointer) return;
      const carried = ghost;
      // Look under the finger BEFORE letting go.
      const onPogo = carried && e.type === "pointerup" && bandAt(e.clientX, e.clientY) === "over" && opts.current.enabled;
      stop();
      if (!carried) return;
      if (onPogo) {
        holder.removeAttribute("data-lifted");
        opts.current.onDrop(id, carried);
      } else {
        goHome(carried);
      }
    }

    abort.current = () => {
      stop();
      ghost?.remove();
      holder.removeAttribute("data-lifted");
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }, []);

  /** First thing in a picture's onClick: true when that click ended a drag (swallow it). */
  const wasDrag = useCallback((id: string) => {
    const last = press.current;
    if (!last || last.id !== id || performance.now() > last.until) return false;
    press.current = null;
    return last.moved;
  }, []);

  return { start, wasDrag };
}
