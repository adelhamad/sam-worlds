import type { CSSProperties } from "react";
import { TOUR } from "../../../strings/tour";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { BANNER_H, type BannerItem } from "./layout";

/** The coloured card that opens each unit on the trail. */
export function UnitBanner({ item }: { item: BannerItem }) {
  const { unit, done } = item;
  const total = unit.lessons.length;
  const complete = done >= total;
  const style = { top: item.y, height: BANNER_H, "--hue": unit.hue } as CSSProperties;
  return (
    <section className={`tp-banner ${item.locked ? "is-locked" : ""} ${complete ? "is-complete" : ""}`} style={style}>
      <span className={`tp-banner-icon ${unit.piece ? "has-piece" : ""}`} aria-hidden="true">
        {unit.piece ? <ChessPiece type={unit.piece} size={46} /> : unit.icon}
      </span>
      <div className="tp-banner-text">
        <span className="tp-banner-kicker">{TOUR.path.unit(item.unitIndex + 1)}</span>
        <h2 className="tp-banner-name">{unit.name}</h2>
        <p className="tp-banner-blurb">{unit.blurb}</p>
      </div>
      <span className="tp-banner-count" aria-label={`${done} of ${total} lessons`}>
        {complete && <span aria-hidden="true">★ </span>}
        {done}/{total}
      </span>
    </section>
  );
}
