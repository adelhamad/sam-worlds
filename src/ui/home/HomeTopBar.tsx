// Compact top bar: wordmark, Star Dust, "Day N", and the settings buttons
// (inline on wide screens, behind one "more" button on phones).
import { useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { useGame } from "../../state/store";
import { HOME } from "../../strings/home";
import { Pogo } from "../tour/Pogo";
import { VideoToggle } from "../VideoToggle";
import { Icon } from "../icons/Icon";

const T = HOME.home;

function Tools({ withLabels }: { withLabels: boolean }) {
  const navigate = useNavigate();
  const soundOn = useGame((s) => s.soundOn);
  const musicOn = useGame((s) => s.musicOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const label = (text: string) => (withLabels ? <span className="home-tool-label">{text}</span> : null);
  return (
    <>
      <VideoToggle />
      <button type="button" className={`home-tool ${musicOn ? "" : "is-off"}`} aria-label={T.music} aria-pressed={musicOn}
        onClick={() => { unlockAudio(); toggleMusic(); }}>
        <Icon name="music" size={22} mono />{label(T.music)}
      </button>
      <button type="button" className={`home-tool ${soundOn ? "" : "is-off"}`} aria-label={T.sound} aria-pressed={soundOn}
        onClick={() => { unlockAudio(); toggleSound(); }}>
        <Icon name={soundOn ? "sound" : "sound-off"} size={22} mono />{label(T.sound)}
      </button>
      <button type="button" className="home-tool" aria-label={T.parent}
        onClick={() => { unlockAudio(); sfx.tap(); navigate("/parent"); }}>
        <Icon name="gear" size={22} mono />{label(T.parent)}
      </button>
    </>
  );
}

export interface HomeTopBarProps {
  dustRef: RefObject<HTMLSpanElement>;
  /** Changes when Star Dust lands, to pop the chip. */
  dustPop: number;
  /** Star Dust still flying to the chip — counted once it lands. */
  inFlight: number;
}

export function HomeTopBar({ dustRef, dustPop, inFlight }: HomeTopBarProps) {
  const starDust = useGame((s) => s.starDust) - inFlight;
  const tourDays = useGame((s) => s.tourDays);
  const [menu, setMenu] = useState(false);

  return (
    <header className="home-bar">
      <div className="home-mark">
        <span className="home-mark-pogo" aria-hidden="true"><Pogo mood="idle" size={40} still /></span>
        <span className="home-mark-text" aria-label={T.wordmark}>
          <span>{T.wordmarkTop}</span> <span>{T.wordmarkBottom}</span>
        </span>
      </div>
      <div className="home-chips">
        <span ref={dustRef} key={dustPop} className={`home-chip home-chip-dust ${dustPop ? "is-pop" : ""}`} aria-label={T.dust(starDust)}>
          <Icon name="dust" size="1.2em" /> {starDust}
        </span>
        {tourDays > 0 && (
          <span className="home-chip home-chip-day" aria-label={T.dayLabel(tourDays)}>
            <Icon name="flame" size="1.2em" /> {T.day(tourDays)}
          </span>
        )}
        <div className="home-tools"><Tools withLabels={false} /></div>
        <button type="button" className={`home-tool home-more ${menu ? "is-open" : ""}`} aria-label={T.more} aria-expanded={menu}
          onClick={() => { unlockAudio(); sfx.tap(); setMenu((open) => !open); }}>
          <Icon name={menu ? "close" : "more"} size={22} mono />
        </button>
      </div>
      {menu && (
        <>
          <button type="button" className="home-menu-scrim" aria-label={T.close} onClick={() => setMenu(false)} />
          <div className="home-menu" role="menu"><Tools withLabels /></div>
        </>
      )}
    </header>
  );
}
