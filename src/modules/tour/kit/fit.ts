// Text fitting for author-written card labels. Labels are unpredictable, so a
// card picks a first-paint size step from the label alone (CSS `kx-fit-*`) and
// then measures: the font shrinks a pixel at a time until the label fits its
// line budget and no single word sticks out. Never clips, never overflows.
import { useLayoutEffect, type RefObject } from "react";

export type FitStep = "s" | "m" | "l" | "xl";

/** First-paint size step from the label's length and its longest word. */
export function labelFit(label: string): FitStep {
  const chars = [...label].length;
  const longest = label.split(/\s+/).reduce((max, word) => Math.max(max, [...word].length), 0);
  if (chars > 24 || longest > 11) return "xl";
  if (chars > 16 || longest > 9) return "l";
  if (chars > 9) return "m";
  return "s";
}

const STEPS: FitStep[] = ["s", "m", "l", "xl"];

/** One size step for a group of cards (the longest label decides), so a grid reads evenly. */
export function groupFit(labels: string[]): FitStep {
  return labels.reduce<FitStep>((most, label) => {
    const step = labelFit(label);
    return STEPS.indexOf(step) > STEPS.indexOf(most) ? step : most;
  }, "s");
}

const MAX_STEPS = 16;

function fitOnce(el: HTMLElement, lines: number, minPx: number): void {
  el.style.fontSize = "";
  // Measure without mid-word breaks so a too-long word shows up as overflow.
  el.style.overflowWrap = "normal";
  const style = getComputedStyle(el);
  const base = parseFloat(style.fontSize);
  const ratio = parseFloat(style.lineHeight) / base || 1.15;
  let size = base;
  for (let i = 0; i < MAX_STEPS && size > minPx; i++) {
    const tooTall = el.scrollHeight > size * ratio * lines + 2;
    const tooWide = el.scrollWidth > el.clientWidth + 1;
    if (!tooTall && !tooWide) break;
    size = Math.max(minPx, size - 1);
    el.style.fontSize = `${size}px`;
  }
  // At the floor, CSS (`overflow-wrap: anywhere`) breaks what still does not fit.
  el.style.overflowWrap = "";
}

/**
 * Shrink `ref`'s font until the text fits in `lines` lines. Re-fits when the
 * label, the budget or the element's WIDTH changes, and once the web font has
 * loaded. Measures layout boxes only, so pop/land animations do not skew it.
 */
export function useFitText(ref: RefObject<HTMLElement>, label: string, lines: number, minPx: number): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let width = el.clientWidth;
    let alive = true;
    fitOnce(el, lines, minPx);
    void document.fonts?.ready.then(() => {
      if (alive) fitOnce(el, lines, minPx);
    });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      if (el.clientWidth === width) return; // a height change is our own doing
      width = el.clientWidth;
      fitOnce(el, lines, minPx);
    });
    observer?.observe(el);
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [ref, label, lines, minPx]);
}
