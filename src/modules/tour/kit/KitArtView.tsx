// The picture on a kit card, slide or count row: a drawn icon by name, or an
// analog clock. Always decorative (aria-hidden) — the card around it carries
// the words (its label, or `cardName` for a picture-only card).
import type { KitArt } from "../../../engine/kit/types";
import { ClockFace } from "../../../ui/clock/ClockFace";
import { Icon } from "../../../ui/icons/Icon";
import { useCompact } from "../lesson/useCompact";
import { iconPx, type ArtSpot } from "./art";

export function KitArtView({ art, spot, className = "" }: { art: KitArt; spot: ArtSpot; className?: string }) {
  const compact = useCompact();
  if (art.kind === "clock") {
    return (
      <span className={`kx-art is-clock ${className}`} aria-hidden="true">
        <ClockFace time={{ hour: art.hour, minute: art.minute }} numbers="quarters" />
      </span>
    );
  }
  const px = iconPx(spot, compact);
  return (
    <span className={`kx-art is-icon ${className}`} style={{ width: px, height: px }} aria-hidden="true">
      <Icon name={art.name} size={px} />
    </span>
  );
}

/** Small drawn arrows for the teach cards (no text glyphs). */
export function KitArrow({ both = false, label }: { both?: boolean; label?: string }) {
  const path = both ? "M4 12h16 M8 7l-5 5 5 5 M16 7l5 5-5 5" : "M4 12h15 M14 6l6 6-6 6";
  return (
    <span className="kx-teach-arrow" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
