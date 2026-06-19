import { useGame } from "../state/store";

/** Header button (beside music) to turn the video companion on/off. Only shows
 * when the parent has added videos. */
export function VideoToggle() {
  const urls = useGame((s) => s.videoUrls);
  const enabled = useGame((s) => s.videoEnabled);
  const toggle = useGame((s) => s.toggleVideo);
  if (urls.length === 0) return null;
  return (
    <button className="btn btn-icon" aria-label="video companion" onClick={toggle}>
      <span style={enabled ? undefined : { opacity: 0.35 }}>📺</span>
    </button>
  );
}
