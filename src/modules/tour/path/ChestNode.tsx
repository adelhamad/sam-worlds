import { useState, type CSSProperties } from "react";
import { TOUR } from "../../../strings/tour";
import { Keepsake } from "./Keepsake";
import type { ChestItem } from "./layout";

/** The treasure chest drawing — shut, or open with the gold showing. */
export function ChestArt({ open = false, size = 76 }: { open?: boolean; size?: number }) {
  return (
    <svg className={`tp-chest-art ${open ? "is-open" : ""}`} viewBox="0 0 80 72" width={size} height={size * 0.9} aria-hidden="true">
      {open && (
        <g>
          <path d="M12 30V16a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v14z" fill="#6b3a16" />
          <path d="M18 30V17a7 7 0 0 1 7-7h30a7 7 0 0 1 7 7v13z" fill="#3d1f0a" />
          <ellipse cx="40" cy="33" rx="27" ry="9" fill="#ffe9a8" />
          <circle cx="28" cy="29" r="6" fill="#ffd166" stroke="#c9962b" strokeWidth="2" />
          <circle cx="41" cy="26" r="7" fill="#ffd166" stroke="#c9962b" strokeWidth="2" />
          <circle cx="53" cy="30" r="6" fill="#ffd166" stroke="#c9962b" strokeWidth="2" />
        </g>
      )}
      {!open && (
        <g>
          <path d="M8 36V26A16 16 0 0 1 24 10h32a16 16 0 0 1 16 16v10z" fill="#d98a45" />
          <path d="M8 36V26A16 16 0 0 1 24 10h6v26z" fill="#e9a25e" opacity="0.55" />
          <rect x="18" y="10" width="8" height="26" fill="#ffd166" />
          <rect x="54" y="10" width="8" height="26" fill="#ffd166" />
        </g>
      )}
      <rect x="8" y="34" width="64" height="32" rx="6" fill="#c0703a" />
      <rect x="8" y="58" width="64" height="8" rx="4" fill="#8f4f1f" />
      <rect x="18" y="34" width="8" height="32" fill="#ffd166" />
      <rect x="54" y="34" width="8" height="32" fill="#ffd166" />
      <rect x="8" y="33" width="64" height="5" rx="2.5" fill="#ffd166" />
      <rect x="33" y="32" width="14" height="17" rx="4" fill="#ffd166" stroke="#c9962b" strokeWidth="2" />
      <circle cx="40" cy="39" r="2.6" fill="#6b3a16" />
      <rect x="38.8" y="39" width="2.4" height="6" rx="1.2" fill="#6b3a16" />
    </svg>
  );
}

interface ChestNodeProps {
  item: ChestItem;
  amp: number;
  focus: boolean;
  onOpen: (item: ChestItem) => void;
  onNudge: (text: string) => void;
}

/** The chest after a unit's last lesson: resting, ready to open, or its keepsake. */
export function ChestNode({ item, amp, focus, onOpen, onNudge }: ChestNodeProps) {
  const [nudge, setNudge] = useState(0);
  const { unit, state } = item;
  const style = {
    left: `calc(50% + ${(item.x * amp).toFixed(1)}px)`,
    top: item.y,
    "--hue": unit.hue,
  } as CSSProperties;

  function tap() {
    if (state === "ready") {
      onOpen(item);
      return;
    }
    setNudge((value) => value + 1);
    onNudge(state === "opened" ? TOUR.path.souvenirOwned(unit.souvenir.name) : TOUR.path.chestLocked(unit.lessons.length));
  }

  return (
    <div className={`tp-anchor tp-chest is-${state}`} style={style} data-focus={focus || undefined}>
      {state === "ready" && (
        <>
          <span className="tp-chest-glow" aria-hidden="true" />
          <span className="tp-tag tp-tag-gold" aria-hidden="true">{TOUR.path.openTag}</span>
        </>
      )}
      <button
        key={nudge}
        type="button"
        className={`tp-chest-btn ${nudge > 0 ? "is-nudged" : ""}`}
        aria-label={state === "opened" ? unit.souvenir.name : TOUR.path.chestTitle}
        aria-disabled={state === "locked" || undefined}
        onClick={tap}
      >
        {state === "opened" ? (
          <span className="tp-souvenir"><Keepsake unit={unit} size={46} /></span>
        ) : (
          <ChestArt />
        )}
      </button>
      {state === "opened" && <span className="tp-souvenir-name">{unit.souvenir.name}</span>}
    </div>
  );
}
