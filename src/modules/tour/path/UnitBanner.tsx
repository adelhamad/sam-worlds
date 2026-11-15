import { TOUR } from "../../../strings/tour";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { Glyph, Icon } from "../../../ui/icons/Icon";
import { hueStyle } from "./hue";
import { BANNER_H, type BannerItem } from "./layout";

/** The coloured card that opens each unit on the trail. */
export function UnitBanner({ item }: { item: BannerItem }) {
  const { unit, done } = item;
  const total = unit.lessons.length;
  const complete = done >= total;
  const style = hueStyle(unit.hue, { top: item.y, height: BANNER_H });
  return (
    <section className={`tp-banner ${item.locked ? "is-locked" : ""} ${complete ? "is-complete" : ""}`} style={style}>
      <span className={`tp-banner-icon ${unit.piece ? "has-piece" : ""}`} aria-hidden="true">
        {unit.piece ? <ChessPiece type={unit.piece} size={46} /> : <Glyph value={unit.icon} size="1.25em" />}
      </span>
      <div className="tp-banner-text">
        <span className="tp-banner-kicker">{TOUR.path.unit(item.unitIndex + 1)}</span>
        <h2 className="tp-banner-name">{unit.name}</h2>
        <p className="tp-banner-blurb">{unit.blurb}</p>
      </div>
      <span className="tp-banner-count" aria-label={`${done} of ${total} lessons`}>
        {complete && <Icon name="star" size="1.05em" />}
        {done}/{total}
      </span>
    </section>
  );
}
