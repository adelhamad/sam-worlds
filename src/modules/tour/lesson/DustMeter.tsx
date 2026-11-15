// The Star Dust chip in the lesson's top bar and the "+N" dust tokens that fly into it.
import { useEffect, useRef, useState } from "react";
import { TOUR } from "../../../strings/tour";
import { Icon } from "../../../ui/icons/Icon";
import type { DustTokenSpec } from "./useDustMeter";

/** A slot's token waits for the feedback sheet to land before it takes off. */
const SLOT_DELAY_MS = 260;
/** Pop, a short hold, then the flight (matches `tl-token-*` in rewards.css). */
const FLIGHT_MS = 900;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Counts from the old number to `target`; jumps there for reduced motion. */
function useTicker(target: number, ms = 380): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return undefined;
    const still = reducedMotion();
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = still ? 1 : Math.min(1, Math.max(0, (now - start) / ms));
      const next = Math.round(from + (target - from) * t);
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

export function DustMeter({ value, bumps }: { value: number; bumps: number }) {
  const shown = useTicker(value);
  return (
    <div className="tl-dust" data-dust-chip="" role="img" aria-label={TOUR.lesson.dustMeter(value)}>
      {/* keyed: every landing replays the bump and the ring */}
      <span key={bumps} className={`tl-dust-body ${bumps > 0 ? "is-bump" : ""}`}>
        <Icon name="dust" size="1.15em" className="tl-dust-icon" />
        <span className="tl-dust-num">{shown}</span>
        {bumps > 0 && <span className="tl-dust-ring" aria-hidden="true" />}
      </span>
    </div>
  );
}

/** Places the token on its take-off spot and aims it at the chip. */
function launch(el: HTMLElement, origin: DustTokenSpec["origin"]): void {
  const root = el.closest(".tour-lesson");
  const chip = root?.querySelector("[data-dust-chip]");
  if (!root || !chip) return;
  const box = root.getBoundingClientRect();
  const to = chip.getBoundingClientRect();
  const from = root.querySelector(origin === "gift" ? ".tl-gift-box" : ".tl-sheet-head")?.getBoundingClientRect();
  // From the gift box, beside the sheet's title, or (no sheet) above the board.
  let x = box.width / 2;
  let y = box.height * 0.6;
  if (from) {
    x = from.left - box.left + from.width * (origin === "gift" ? 0.5 : 0.74);
    y = from.top - box.top + from.height * (origin === "gift" ? 0.3 : 0.5);
  }
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty("--tl-dx", `${to.left - box.left + to.width / 2 - x}px`);
  el.style.setProperty("--tl-dy", `${to.top - box.top + to.height / 2 - y}px`);
  el.classList.add("is-flying");
}

interface DustTokenProps {
  token: DustTokenSpec;
  /** Must be stable (useCallback): it is called once, when the token lands. */
  onLand: (token: DustTokenSpec) => void;
}

export function DustToken({ token, onLand }: DustTokenProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const delay = token.origin === "slot" ? SLOT_DELAY_MS : 0;
    const flight = reducedMotion() ? 0 : FLIGHT_MS;
    const start = setTimeout(() => { if (el) launch(el, token.origin); }, delay);
    const land = setTimeout(() => onLand(token), delay + flight);
    return () => {
      clearTimeout(start);
      clearTimeout(land);
      el?.classList.remove("is-flying");
    };
  }, [token, onLand]);

  return (
    <div ref={ref} className={`tl-token ${token.small ? "is-small" : ""}`} aria-hidden="true">
      <span className="tl-token-in">{TOUR.lesson.dustToken(token.amount)} <Icon name="dust" size="1em" /></span>
    </div>
  );
}
