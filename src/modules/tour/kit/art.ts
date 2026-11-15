// Picture sizes for kit cards. Icons take a pixel size (the Icon renderer
// draws at exactly that size); clocks fill a CSS-sized square instead
// (kit.css `--clock`), so they can follow the layout. [phone, tablet] px.
import type { KitItem } from "../../../engine/kit/types";

/** Order cards that need a strip (spots side by side): clocks, or pictures without words. */
export function stripOf(cards: KitItem[]): boolean {
  return cards.some((card) => card.art?.kind === "clock") || cards.every((card) => !card.label.trim());
}

/** Where a picture is drawn. */
export type ArtSpot =
  | "tile" | "tile-solo" | "row" | "row-solo" | "chip" | "chip-solo" | "hero" | "hero-small" | "badge"
  | "thing-few" | "thing-some" | "thing-many" | "thing-lots" | "thing-small";

const ICON_PX: Record<ArtSpot, [number, number]> = {
  tile: [50, 64],
  "tile-solo": [68, 88],
  row: [30, 34],
  "row-solo": [52, 60],
  chip: [28, 32],
  "chip-solo": [36, 42],
  hero: [60, 76],
  "hero-small": [40, 44],
  badge: [96, 150],
  "thing-few": [56, 72],
  "thing-some": [48, 62],
  "thing-many": [40, 52],
  "thing-lots": [34, 46],
  "thing-small": [26, 30],
};

/** Icon size in px for `spot` (phone-sized screens get the first value). */
export function iconPx(spot: ArtSpot, compact: boolean): number {
  return ICON_PX[spot][compact ? 0 : 1];
}
