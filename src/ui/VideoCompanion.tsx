import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../state/store";
import { embedUrl, youTubeId } from "../engine/video";

const W = 280; // player width at full size (matches CSS max)
const BUBBLE = 56; // minimized circle size

/**
 * Parent-curated YouTube companion: a small DRAGGABLE corner player that plays
 * a favorite video during gameplay to pull Sam toward the game. A transparent
 * shield over the iframe blocks taps from opening YouTube, and doubles as the
 * drag handle. Closing it leaves a draggable 📺 bubble that reopens it.
 * Visibility (opacity) is parent-configurable; default 80%.
 */
export function VideoCompanion() {
  const { pathname } = useLocation();
  const enabled = useGame((s) => s.videoEnabled);
  const urls = useGame((s) => s.videoUrls);
  const opacity = useGame((s) => s.videoOpacity);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const ids = useMemo(() => urls.map(youTubeId).filter((x): x is string => Boolean(x)), [urls]);
  const [pick] = useState(() => Math.floor(Math.random() * 1000));

  const hidden = pathname === "/" || pathname.startsWith("/parent");
  const active = enabled && ids.length > 0 && !hidden;
  if (!active) return null;

  const src = embedUrl(ids[pick % ids.length]);
  const size = minimized ? BUBBLE : W;
  // default to bottom-right until moved
  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", opacity: opacity / 100 }
    : { opacity: opacity / 100 };

  function onPointerDown(e: React.PointerEvent) {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    // ignore finger jitter so a tap stays a tap
    if (!drag.current.moved && Math.hypot(e.clientX - drag.current.sx, e.clientY - drag.current.sy) < 6) return;
    drag.current.moved = true;
    const h = minimized ? BUBBLE : size * (9 / 16);
    const x = Math.max(4, Math.min(window.innerWidth - size - 4, e.clientX - drag.current.dx));
    const y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - drag.current.dy));
    setPos({ x, y });
  }
  function onPointerUp() {
    justDragged.current = Boolean(drag.current?.moved);
    drag.current = null;
  }
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp };

  function toggle() {
    // a drag that ends on the button must not count as a tap
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setMinimized((m) => !m);
  }

  if (minimized) {
    return (
      <div className="video-corner video-min" style={style}>
        <button className="video-toggle video-bubble" aria-label="show video" {...dragHandlers} onClick={toggle}>
          📺
        </button>
      </div>
    );
  }

  return (
    <div className="video-corner" style={style}>
      <iframe src={src} title="companion video" allow="autoplay; encrypted-media" frameBorder="0" />
      {/* transparent shield: blocks taps reaching YouTube + acts as drag handle */}
      <div className="video-shield" {...dragHandlers} />
      <button className="video-toggle" aria-label="hide video" onClick={toggle}>
        —
      </button>
    </div>
  );
}
