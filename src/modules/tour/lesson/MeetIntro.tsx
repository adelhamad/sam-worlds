// "New friends today!" — the lesson's focus countries shown as big cards before
// question 1. Teach by showing: tap a card to hear its name. Skippable at once.
import { useState } from "react";
import { useGame } from "../../../state/store";
import { Icon } from "../../../ui/icons/Icon";
import { COUNTRY_BY_CODE } from "../../../engine/generators/geography";
import { continentOf, countryName } from "../../../engine/tour/countries";
import { unlockAudio } from "../../../engine/feedback/audio";
import { speak } from "../../../engine/feedback/speech";
import { Flag } from "../../../ui/tour/Flag";
import { PogoSay } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { lessonSound } from "./lessonSound";
import { useCompact } from "./useCompact";

/** A tiny outline of the country — just enough to hint at its shape. */
function Outline({ code }: { code: string }) {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country?.path || country.viewBox.length !== 4) return null;
  const [x, y, w, h] = country.viewBox;
  const pad = Math.max(w, h) * 0.08;
  return (
    <svg
      className="tl-meet-outline" aria-hidden="true"
      viewBox={`${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`}
    >
      <path d={country.path} />
    </svg>
  );
}

interface MeetIntroProps {
  codes: string[];
  onStart: () => void;
}

export function MeetIntro({ codes, onStart }: MeetIntroProps) {
  const compact = useCompact();
  const soundOn = useGame((s) => s.soundOn);
  const [seen, setSeen] = useState<string[]>([]);
  const allSeen = codes.every((code) => seen.includes(code));

  function greet(code: string) {
    unlockAudio();
    lessonSound.meet();
    if (soundOn) speak(countryName(code));
    setSeen((prev) => (prev.includes(code) ? prev : [...prev, code]));
  }

  return (
    <>
      <div className="tl-ask">
        <PogoSay
          mood={allSeen ? "happy" : "wave"} size={compact ? 84 : 116}
          text={allSeen ? TOUR.lesson.meetAllSeen : TOUR.lesson.meetTitle}
        />
      </div>
      <main className="tl-meet">
        <p className="tl-meet-sub">{TOUR.lesson.meetSub}</p>
        <div className={`tl-meet-grid tl-meet-${Math.min(codes.length, 4)}`}>
          {codes.map((code, i) => {
            const met = seen.includes(code);
            return (
              <button
                key={code}
                className={`ttile tl-meet-card ${met ? "is-met" : ""}`}
                style={{ animationDelay: `${120 + i * 90}ms` }}
                onClick={() => greet(code)}
              >
                {met && <span className="tl-meet-tick" aria-hidden="true"><Icon name="check" size="0.8em" mono /></span>}
                <Flag code={code} size={compact ? 58 : 84} className={met ? "tl-meet-flag-pop" : ""} />
                <span className="tl-meet-name">{countryName(code)}</span>
                <span className="tl-meet-where">
                  <Outline code={code} />
                  {continentOf(code)}
                </span>
              </button>
            );
          })}
        </div>
      </main>
      <footer className="tl-footer">
        <button className="tbtn tbtn-go tbtn-wide" onClick={() => { unlockAudio(); lessonSound.next(); onStart(); }}>
          {TOUR.lesson.letsGo}
        </button>
      </footer>
    </>
  );
}
