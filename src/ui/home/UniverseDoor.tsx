// The classic worlds live on the home page itself, below the courses (the
// owner asked for this: a separate screen would never get opened).
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { COURSE_WORLD_IDS } from "../../content/courses";
import { WORLDS } from "../../content/worlds";
import { useGame } from "../../state/store";
import { HOME } from "../../strings/home";
import { WorldGrid } from "../HubWorlds";

const T = HOME.home;

function PlanetCluster() {
  return (
    <svg viewBox="0 0 120 90" className="udoor-svg" aria-hidden="true" focusable="false">
      <circle cx="18" cy="16" r="1.6" fill="#fff" opacity="0.8" />
      <circle cx="104" cy="12" r="1.2" fill="#fff" opacity="0.7" />
      <circle cx="110" cy="70" r="1.6" fill="#ffe7a3" opacity="0.8" />
      <circle cx="8" cy="62" r="1.1" fill="#fff" opacity="0.6" />
      <circle cx="90" cy="30" r="13" fill="#ff9b6b" stroke="#16123a" strokeWidth="3.5" />
      <path d="M 82 26 Q 86 21 92 21" stroke="rgba(255,255,255,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="50" r="25" fill="#6fd3a4" stroke="#16123a" strokeWidth="4" />
      <path d="M 40 44 Q 48 38 56 42 Q 62 46 58 52 Q 52 56 44 54 Z" fill="#3fae7d" />
      <ellipse cx="54" cy="52" rx="40" ry="9" fill="none" stroke="#ffd166" strokeWidth="4" transform="rotate(-14 54 52)" />
      <path d="M 36 38 Q 42 30 52 29" stroke="rgba(255,255,255,0.7)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="74" r="9" fill="#a98bff" stroke="#16123a" strokeWidth="3" />
      <circle cx="104" cy="52" r="5" fill="#7fb8ff" stroke="#16123a" strokeWidth="2.5" />
    </svg>
  );
}

/** The classic worlds, right on the home page: a calm header, then the planet grid. */
export function UniverseDoor() {
  const hiddenWorlds = useGame((s) => s.hiddenWorlds);
  const location = useLocation();
  const ref = useRef<HTMLElement>(null);
  const count = WORLDS.filter((world) => !COURSE_WORLD_IDS.has(world.id) && !hiddenWorlds[world.id]).length;
  // Coming back from a classic world (or the "explore" button): land on the grid.
  const arriving = Boolean((location.state as { worlds?: boolean } | null)?.worlds);
  useEffect(() => {
    if (arriving) ref.current?.scrollIntoView({ block: "start" });
  }, [arriving]);
  if (count === 0) return null;
  return (
    <section ref={ref} id="universe" className="uni-section home-rise" style={{ "--i": 10 } as React.CSSProperties} data-testid="universe">
      <header className="udoor udoor-head">
        <span className="udoor-art"><PlanetCluster /></span>
        <span className="udoor-text">
          <span className="udoor-title">{T.universeDoor}</span>
          <span className="udoor-sub">{T.universeCount(count)}</span>
        </span>
      </header>
      <div className="uni-grid"><WorldGrid /></div>
    </section>
  );
}
