// Tiny pictures for the collection chip in the top bar (picked per course
// family in courseFamilies.ts).
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { Icon } from "../../../ui/icons/Icon";

/** World Tour: the passport. */
export function PassportGlyph() {
  return <Icon name="passport" size="1.2em" />;
}

/** Chess Camp: the king, as a dark stamp on the cyan button. */
export function KingGlyph() {
  return <span className="tp-chip-piece" aria-hidden="true"><ChessPiece type="K" size={24} /></span>;
}

/** Every other course: a trophy for the keepsake shelf. */
export function TrophyGlyph() {
  return <Icon name="trophy" size="1.2em" />;
}
