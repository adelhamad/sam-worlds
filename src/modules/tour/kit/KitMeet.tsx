// The teach-first slides of a kit lesson ("Meet the idea"), shown before the
// first question. Pogo presents one slide at a time: the title in his bubble,
// the slide's picture (an icon or a clock) in a glowing badge (tap it — it
// bounces), a line or two. A slide without a picture shows Pogo alone, a
// little bigger. NEXT walks on, the last slide says "Let's go!", and a quiet
// Skip starts at once.
import { useState, type CSSProperties } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import type { KitSlide } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { PogoSay } from "../../../ui/tour/Pogo";
import { useCompact } from "../lesson/useCompact";
import { KitArtView } from "./KitArtView";
import "../../../ui/tour/tour-base.css";
import "./kitMeet.css";

const S = TOUR.kit;

export interface KitMeetProps {
  slides: KitSlide[];
  /** Called when the child taps the start button. */
  onStart: () => void;
}

/** Pogo is the picture when a slide has none: a size up. */
function pogoSize(compact: boolean, hasArt: boolean): number {
  if (hasArt) return compact ? 76 : 108;
  return compact ? 104 : 148;
}

export function KitMeet({ slides, onStart }: KitMeetProps) {
  const compact = useCompact();
  const [index, setIndex] = useState(0);
  const [boing, setBoing] = useState(0);
  const total = slides.length;
  const slide = slides[Math.min(index, total - 1)];
  const last = index >= total - 1;

  const next = () => {
    unlockAudio();
    if (last) {
      onStart();
      return;
    }
    tourSfx.pop();
    setIndex(index + 1);
    setBoing(0);
  };
  const poke = () => {
    unlockAudio();
    tourSfx.hop();
    setBoing((n) => n + 1);
  };

  return (
    <div className="tl-meet kx-meet" data-testid="kit-meet" data-slide={index}>
      <button type="button" className="kx-meet-skip" onClick={() => { unlockAudio(); onStart(); }} data-testid="kit-meet-skip">
        {S.skip}
      </button>
      {slide && (
        <>
          <PogoSay mood={index === 0 ? "wave" : undefined} size={pogoSize(compact, Boolean(slide.art))} text={slide.title} />
          <div key={index} className={`kx-meet-slide ${slide.art ? "" : "is-plain"}`}>
            {slide.art && (
              <button
                type="button"
                className="kx-meet-badge"
                onClick={poke}
                aria-label={slide.title}
                data-testid="kit-meet-emoji"
              >
                <span className="kx-meet-glow" aria-hidden="true" />
                <span key={boing} className={`kx-meet-art ${slide.art.kind === "clock" ? "is-clock" : ""} ${boing > 0 ? "is-boing" : ""}`}>
                  <KitArtView art={slide.art} spot="badge" />
                </span>
              </button>
            )}
            <ul className="kx-meet-lines">
              {slide.lines.map((line, i) => (
                <li key={`${i}-${line}`} style={{ "--i": i } as CSSProperties}>{line}</li>
              ))}
            </ul>
          </div>
        </>
      )}
      <div className="kx-meet-foot">
        {total > 1 && (
          <div className="kx-meet-dots" role="img" aria-label={S.slideOf(index + 1, total)}>
            {slides.map((_, i) => <i key={i} className={`${i === index ? "is-on" : ""} ${i < index ? "is-seen" : ""}`} />)}
          </div>
        )}
        <button type="button" className="tbtn tbtn-go tbtn-wide kx-meet-next" onClick={next} data-testid="kit-meet-next">
          {last ? S.letsGo : S.next}
        </button>
      </div>
    </div>
  );
}
