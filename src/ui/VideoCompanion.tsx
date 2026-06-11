import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../state/store";
import { embedUrl, youTubeId } from "../engine/video";

const W = 280; // player width at full size (matches CSS max)

/**
 * Parent-curated YouTube companion: a small DRAGGABLE corner player that plays
 * a favorite video during gameplay to pull Sam toward the game. A transparent
 * shield over the iframe blocks taps from opening YouTube, and doubles as the
 * drag handle. Only shows on gameplay/hub screens.
 */
export function VideoCompanion() {
  const { pathname } = useLocation();
  const enabled = useGame((s) => s.videoEnabled);
  const urls = useGame((s) => s.videoUrls);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const ids = useMemo(() => urls.map(youTubeId).filter((x): x is string => Boolean(x)), [urls]);
  const [pick] = useState(() => Math.floor(Math.random() * 1000));

  const hidden = pathname === "/" || pathname.startsWith("/parent");
  const active = enabled && ids.length > 0 && !hidden;
  if (!active) return null;

  const src = embedUrl(ids[pick % ids.length]);
  const size = minimized ? 56 : W;
  // default to bottom-right until moved
  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : {};

  function onPointerDown(e: React.PointerEvent) {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    drag.current.moved = true;
    const h = minimized ? 56 : size * (9 / 16) + 0;
    const x = Math.max(4, Math.min(window.innerWidth - size - 4, e.clientX - drag.current.dx));
    const y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - drag.current.dy));
    setPos({ x, y });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className={`video-corner ${minimized ? "video-min" : ""}`} style={style}>
      {!minimized && (
        <>
          <iframe src={src} title="companion video" allow="autoplay; encrypted-media" frameBorder="0" />
          {/* transparent shield: blocks taps reaching YouTube + acts as drag handle */}
          <div
            className="video-shield"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </>
      )}
      <button
        className="video-toggle"
        aria-label={minimized ? "show video" : "hide video"}
        onClick={() => setMinimized((m) => !m)}
      >
        {minimized ? "📺" : "—"}
      </button>
    </div>
  );
}
