// The one card every kit widget is made of: a picture (when present: a drawn
// icon or a clock, see KitArtView) and the author's label, in four shapes —
//   tile  square-ish: big picture over a 1–2 line label (pick grid)
//   row   picture left, label right, full width (sentences)
//   chip  compact (pairs, order, sort, placed cards, teach cards)
//   hero  the big "thing being asked about" above a question (never a button)
// Long labels shrink to fit (fit.ts). Text-only cards (the most common kind)
// and picture-only cards get their own, bigger proportions so neither looks
// like something is missing. A picture-only card is named by its picture.
import { useRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cardName } from "../../../engine/kit/cards";
import type { KitItem } from "../../../engine/kit/types";
import type { ArtSpot } from "./art";
import { KitArtView } from "./KitArtView";
import { labelFit, useFitText, type FitStep } from "./fit";

export type KitShape = "tile" | "row" | "chip" | "hero";

/** Line budget and smallest font (px) per shape. */
const BUDGET: Record<KitShape, { lines: number; textLines: number; min: number }> = {
  tile: { lines: 2, textLines: 3, min: 12 },
  row: { lines: 3, textLines: 3, min: 13 },
  chip: { lines: 3, textLines: 3, min: 11 },
  hero: { lines: 2, textLines: 3, min: 14 },
};

export interface KitCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  item: KitItem;
  shape: KitShape;
  /** Render a plain block (teach cards, hero) instead of a button. */
  still?: boolean;
  /** Override the shape's line budget (e.g. 2 for a tight tray). */
  lines?: number;
  /** The hero's small form (above a build line). */
  small?: boolean;
  /** First-paint size step shared by a group of cards (default: from this label). */
  fit?: FitStep;
}

function spotOf(shape: KitShape, solo: boolean, small: boolean): ArtSpot {
  if (shape === "hero") return small ? "hero-small" : "hero";
  if (shape === "tile") return solo ? "tile-solo" : "tile";
  if (shape === "chip") return solo ? "chip-solo" : "chip";
  return solo ? "row-solo" : "row";
}

export function KitCard({ item, shape, still = false, lines, small = false, fit, className = "", ...rest }: KitCardProps) {
  const label = item.label.trim();
  const art = item.art;
  const ref = useRef<HTMLSpanElement>(null);
  let look = "is-both";
  if (!label) look = "is-art";
  else if (!art) look = "is-text";
  const budget = BUDGET[shape];
  useFitText(ref, label, lines ?? (art ? budget.lines : budget.textLines), budget.min);

  const kind = art ? `has-${art.kind}` : "";
  const cls = `ttile kx-card kx-${shape} ${look} ${kind} kx-fit-${fit ?? labelFit(label)} ${small ? "is-small" : ""} ${still ? "is-still" : ""} ${className}`;
  const name = label ? undefined : cardName(item);
  const face = (
    <>
      {art && <KitArtView art={art} spot={spotOf(shape, !label, small)} />}
      {label && <span ref={ref} className="kx-label">{label}</span>}
    </>
  );
  if (still || shape === "hero") {
    return (
      <div className={cls} role={name ? "img" : undefined} aria-label={name} {...(rest as HTMLAttributes<HTMLDivElement>)}>
        {face}
      </div>
    );
  }
  return <button type="button" className={cls} aria-label={name} {...rest}>{face}</button>;
}
