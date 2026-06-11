import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../state/store";
import { embedUrl, youTubeId } from "../engine/video";

/**
 * The parent-curated YouTube companion. Plays a favorite video in a corner
 * (or behind the game) to pull Sam's attention toward playing. Only shows
 * during gameplay screens, never on the title/parent screens.
 */
export function VideoCompanion() {
  const { pathname } = useLocation();
  const enabled = useGame((s) => s.videoEnabled);
  const mode = useGame((s) => s.videoMode);
  const urls = useGame((s) => s.videoUrls);
  const [minimized, setMinimized] = useState(false);

  const ids = useMemo(() => urls.map(youTubeId).filter((x): x is string => Boolean(x)), [urls]);
  // pick one video per app load (stable across screen changes)
  const [pick] = useState(() => Math.floor(Math.random() * 1000));

  // Don't show on the title or parent screens — only while he's in the app's worlds/hub.
  const hidden = pathname === "/" || pathname.startsWith("/parent");
  const active = enabled && ids.length > 0 && !hidden;

  // Lock body scroll-through is not needed; background mode dims the app bg.
  useEffect(() => {
    document.body.classList.toggle("video-bg-active", active && mode === "background");
    return () => document.body.classList.remove("video-bg-active");
  }, [active, mode]);

  if (!active) return null;
  const id = ids[pick % ids.length];
  const src = embedUrl(id);

  if (mode === "background") {
    return (
      <div className="video-bg" aria-hidden>
        <iframe
          src={src}
          title="companion video"
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <div className={`video-corner ${minimized ? "video-min" : ""}`}>
      {!minimized && (
        <iframe
          src={src}
          title="companion video"
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
      )}
      <button
        className="video-toggle"
        aria-label={minimized ? "show video" : "hide video"}
        onClick={() => setMinimized((m) => !m)}
      >
        {minimized ? "📺" : "▁"}
      </button>
    </div>
  );
}
