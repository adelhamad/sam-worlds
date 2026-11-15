import { useRef, useState } from "react";
import { useGame } from "../state/store";
import { sfx, unlockAudio } from "../engine/feedback/audio";
import { STR } from "../strings/en";
import { Glyph, Icon } from "./icons/Icon";

/** Keep the hub tile compact while giving every earned trophy room to be seen. */
export function TrophyShelf() {
  const badges = useGame((s) => s.badges);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  const newest = [...badges].sort((a, b) => b.earnedAt - a.earnedAt);

  return (
    <>
      <button
        ref={trigger}
        className="tile trophy-tile"
        onClick={() => {
          unlockAudio();
          sfx.tap();
          setOpen(true);
        }}
      >
        <span className="tile-icon" aria-hidden="true"><Icon name="trophy" size="1em" /></span>
        <span className="tile-name">{STR.trophyShelf}</span>
        {badges.length === 0 ? (
          <span className="tile-sub">{STR.trophyEmpty}</span>
        ) : (
          <>
            <span className="tile-trophies" aria-hidden="true">
              {newest.slice(0, 3).map((b) => <Glyph key={b.badgeId} value={b.icon} size="1em" />)}
            </span>
            <span className="tile-sub">{STR.trophyCount(badges.length)} · {STR.viewAll}</span>
          </>
        )}
      </button>

      {open && (
        <div className="overlay" onClick={close}>
          <div
            className="panel shop trophy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trophy-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "Tab") {
                e.preventDefault();
                e.currentTarget.querySelector("button")?.focus();
              }
            }}
          >
            <header className="shop-header">
              <h2 id="trophy-title"><span><Icon name="trophy" size="1.1em" /> {STR.trophyShelf}</span></h2>
              <button className="btn btn-icon" aria-label="close" autoFocus onClick={close}><Icon name="close" size={20} mono /></button>
            </header>
            <p className="dim">{badges.length ? STR.trophyCount(badges.length) : STR.trophyEmpty}</p>
            <div className="trophy-grid">
              {newest.map((b) => (
                <div key={b.badgeId} className="trophy-item">
                  <span className="trophy-icon" aria-hidden="true"><Glyph value={b.icon} size="1em" /></span>
                  <span className="trophy-name">{b.name}</span>
                  <span className="trophy-date">{new Date(b.earnedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
