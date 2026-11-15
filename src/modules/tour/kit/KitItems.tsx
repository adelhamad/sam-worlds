// The things to count / read above a number pad (and in its teach card).
// Picture items (an icon or a clock) wrap into tidy rows; an item without a
// picture is shown as a word chip. The size steps down as the count grows.
import type { CSSProperties } from "react";
import { cardName } from "../../../engine/kit/cards";
import type { KitItem } from "../../../engine/kit/types";
import type { ArtSpot } from "./art";
import { KitArtView } from "./KitArtView";

type Step = "few" | "some" | "many" | "lots";

/** Size step + the most items one row may hold at that size. */
function sizeStep(count: number): [Step, number] {
  if (count <= 3) return ["few", 3];
  if (count <= 6) return ["some", 4];
  if (count <= 10) return ["many", 5];
  return ["lots", 6];
}

/** Items per row so the rows come out even (9 → 5 + 4, not 6 + 3). */
function perRow(count: number, cap: number): number {
  return Math.ceil(count / Math.ceil(count / cap)) || 1;
}

export function KitItems({ items, caption, small = false }: { items: KitItem[]; caption?: string; small?: boolean }) {
  const label = items.map(cardName).filter(Boolean).join(", ");
  const [step, cap] = sizeStep(items.length);
  const spot: ArtSpot = small ? "thing-small" : `thing-${step}`;
  return (
    <figure className={`kx-items is-${step} ${small ? "is-small" : ""}`} aria-label={label || undefined}>
      <div className="kx-items-row" style={{ "--per-row": perRow(items.length, small ? Math.min(cap, 4) : cap) } as CSSProperties} aria-hidden="true">
        {items.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className={item.art ? `kx-thing has-${item.art.kind}` : "kx-thing is-word"}
            style={{ "--i": i } as CSSProperties}
          >
            {item.art ? <KitArtView art={item.art} spot={spot} /> : item.label}
          </span>
        ))}
      </div>
      {caption && <figcaption className="kx-caption">{caption}</figcaption>}
    </figure>
  );
}
