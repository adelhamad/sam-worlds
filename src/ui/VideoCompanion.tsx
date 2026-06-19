import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGame } from "../state/store";
import { embedUrl, youTubeId, ytCommand } from "../engine/video";

/**
 * Parent-curated YouTube companion: a small DRAGGABLE, RESIZABLE corner player.
 * A transparent shield blocks taps from opening YouTube (and is the drag handle),
 * so the child can't press play — instead we autostart it through the IFrame API
 * (postMessage playVideo) on a short interval + on the first gesture. "Hide video"
 * keeps the iframe alive off-screen so the audio (music) keeps playing. It's
 * turned on/off from a 📺 button in the header, beside the music icon.
 */
export function VideoCompanion() {
  const { pathname } = useLocation();
  const enabled = useGame((s) => s.videoEnabled);
  const urls = useGame((s) => s.videoUrls);
  const opacity = useGame((s) => s.videoOpacity);
  const audioOnly = useGame((s) => s.videoAudioOnly);
  const size = useGame((s) => s.videoSize);
  const setAudioOnly = useGame((s) => s.setVideoAudioOnly);
  const setSize = useGame((s) => s.setVideoSize);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ sx: number; sw: number } | null>(null);

  const ids = useMemo(() => urls.map(youTubeId).filter((x): x is string => Boolean(x)), [urls]);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const hidden = pathname === "/" || pathname.startsWith("/parent");
  const active = enabled && ids.length > 0 && !hidden;

  // Taps are blocked by the shield, so keep nudging YouTube to play. (The
  // first real gesture lets it play with sound under autoplay policies.)
  useEffect(() => {
    if (!active) return;
    const play = () => {
      ytCommand(frameRef.current, "playVideo");
      ytCommand(frameRef.current, "unMute");
    };
    const t = setInterval(play, 2500);
    window.addEventListener("pointerdown", play);
    return () => {
      clearInterval(t);
      window.removeEventListener("pointerdown", play);
    };
  }, [active]);

  if (!active) return null;
  const src = embedUrl(ids[seed % ids.length]);
  const h = Math.round((size * 9) / 16);

  function onDragDown(e: React.PointerEvent) {
    const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const x = Math.max(4, Math.min(window.innerWidth - size - 4, e.clientX - drag.current.dx));
    const y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - drag.current.dy));
    setPos({ x, y });
  }
  function onDragUp() {
    drag.current = null;
  }

  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    resize.current = { sx: e.clientX, sw: size };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resize.current) return;
    setSize(resize.current.sw + (e.clientX - resize.current.sx));
  }
  function onResizeUp() {
    resize.current = null;
  }

  const style: React.CSSProperties = audioOnly
    ? { position: "fixed", left: -9999, top: 0, right: "auto", bottom: "auto", width: 240, height: 135, opacity: 0, pointerEvents: "none" }
    : {
        position: "fixed",
        width: size,
        height: h,
        opacity: opacity / 100,
        ...(pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
          : { right: 12, bottom: 12, left: "auto", top: "auto" }),
      };

  return (
    <>
      <div className="video-corner" style={style}>
        <iframe ref={frameRef} src={src} title="companion video" allow="autoplay; encrypted-media" frameBorder="0" />
        {!audioOnly && (
          <>
            <div className="video-shield" onPointerDown={onDragDown} onPointerMove={onDragMove} onPointerUp={onDragUp} />
            <button className="video-toggle" aria-label="hide video, keep music" onClick={() => setAudioOnly(true)}>🙈</button>
            <div className="video-resize" onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={onResizeUp} />
          </>
        )}
      </div>
      {audioOnly && (
        <button className="video-music-pill" onClick={() => setAudioOnly(false)}>
          🎵 Music playing — tap to show video
        </button>
      )}
    </>
  );
}
