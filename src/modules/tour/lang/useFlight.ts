// A tile "flies" from where it was tapped to where it lands (FLIP: the real
// element is already in its new place; it is drawn starting from the old spot
// and glides home). Transforms only, Web Animations; skipped entirely under
// prefers-reduced-motion. Nothing waits for it: the element is usable at once.
import { useCallback, useLayoutEffect, useRef } from "react";
import { reducedMotion } from "../exercises/shared";

interface Pending {
  /** CSS selector of the element that just landed (inside the root). */
  target: string;
  from: DOMRect;
}

export function useFlight<T extends HTMLElement>(dep: unknown) {
  const root = useRef<T>(null);
  const pending = useRef<Pending | null>(null);

  useLayoutEffect(() => {
    const job = pending.current;
    pending.current = null;
    if (!job || !root.current || reducedMotion()) return;
    const el = root.current.querySelector<HTMLElement>(job.target);
    if (!el || typeof el.animate !== "function") return;
    const to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = job.from.left + job.from.width / 2 - (to.left + to.width / 2);
    const dy = job.from.top + job.from.height / 2 - (to.top + to.height / 2);
    const scale = Math.min(1.4, Math.max(0.7, job.from.height / to.height));
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 18}px) scale(${(scale + 1.12) / 2})`, offset: 0.55 },
        { transform: "none" },
      ],
      { duration: 340, easing: "cubic-bezier(0.3, 0.9, 0.4, 1)" },
    );
  }, [dep]);

  /** Call right before the state change that moves the element. */
  const launch = useCallback((from: Element, target: string) => {
    pending.current = { target, from: from.getBoundingClientRect() };
  }, []);

  return { root, launch };
}
