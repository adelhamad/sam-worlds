import { useEffect, useState } from "react";
import type { CourseUnit } from "../../../content/courses";
import { sfx } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { TOUR } from "../../../strings/tour";
import { Confetti, Pogo } from "../../../ui/tour/Pogo";
import { Icon } from "../../../ui/icons/Icon";
import { ChestArt } from "./ChestNode";
import { prefersReducedMotion } from "./hooks";
import { hueStyle } from "./hue";
import { Keepsake } from "./Keepsake";

const SHAKE_MS = 1150;
const COUNT_MS = 900;

interface ChestOpeningProps {
  unit: CourseUnit;
  /** Star Dust already paid by `tourOpenChest` (the reward is fixed per unit). */
  paid: number;
  onClose: () => void;
}

/** The chest shakes, bursts open, counts up its Star Dust and shows the keepsake. */
export function ChestOpening({ unit, paid, onClose }: ChestOpeningProps) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(true);
      tourSfx.chest();
    }, prefersReducedMotion() ? 250 : SHAKE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    const startedAt = performance.now();
    const duration = prefersReducedMotion() ? 1 : COUNT_MS;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      setShown(Math.round(paid * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else sfx.earn();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, paid]);

  return (
    <div className="tp-scrim tp-scrim-centre" role="dialog" aria-modal="true" aria-label={TOUR.path.chestTitle}>
      <div className={`tp-opening ${open ? "is-open" : "is-shaking"}`} style={hueStyle(unit.hue)}>
        <h2 className="tp-opening-title">{open ? TOUR.path.chestFound(unit.souvenir.name) : TOUR.path.chestTitle}</h2>
        <div className="tp-opening-stage">
          <span className="tp-opening-rays" aria-hidden="true" />
          {open && (
            <span className="tp-opening-souvenir" role="img" aria-label={unit.souvenir.name}>
              <Keepsake unit={unit} size={78} />
            </span>
          )}
          <span className="tp-opening-chest"><ChestArt open={open} size={168} /></span>
          <Pogo mood={open ? "wow" : "think"} size={92} className="tp-opening-pogo" />
        </div>
        <p className="tp-opening-dust" aria-live="polite">
          {open ? <>+{shown} <Icon name="dust" size="1em" /></> : <span className="tp-opening-wait">…</span>}
        </p>
        <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={!open} onClick={onClose}>
          {TOUR.path.chestDone}
        </button>
      </div>
      {open && <Confetti burstKey={unit.id} />}
    </div>
  );
}
