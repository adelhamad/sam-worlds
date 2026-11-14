import type { CSSProperties } from "react";
import { TOUR } from "../../../strings/tour";
import { BANNER_H, LESSONS_PER_UNIT, type BannerItem } from "./layout";

/** The coloured card that opens each unit on the trail. */
export function UnitBanner({ item }: { item: BannerItem }) {
  const { unit, done } = item;
  const complete = done >= LESSONS_PER_UNIT;
  const style = { top: item.y, height: BANNER_H, "--hue": unit.hue } as CSSProperties;
  return (
    <section className={`tp-banner ${item.locked ? "is-locked" : ""} ${complete ? "is-complete" : ""}`} style={style}>
      <span className="tp-banner-icon" aria-hidden="true">{unit.icon}</span>
      <div className="tp-banner-text">
        <span className="tp-banner-kicker">{TOUR.path.unit(item.unitIndex + 1)}</span>
        <h2 className="tp-banner-name">{unit.name}</h2>
        <p className="tp-banner-blurb">{unit.blurb}</p>
      </div>
      <span className="tp-banner-count" aria-label={`${done} of ${LESSONS_PER_UNIT} lessons`}>
        {complete && <span aria-hidden="true">★ </span>}
        {done}/{LESSONS_PER_UNIT}
      </span>
    </section>
  );
}
