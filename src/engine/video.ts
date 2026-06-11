// YouTube companion helpers. The parent pastes normal YouTube links; we pull
// the video id and build an embed URL. Playing the kid's favorite videos in a
// corner (or behind the game) is bait to draw attention into playing.

/** Extract a YouTube video id from the common URL shapes. */
export function youTubeId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/embed\/([\w-]{11})/, // /embed/ID
    /\/shorts\/([\w-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  // bare id pasted directly
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

/** Embed URL that autoplays, loops the single video, and hides extras. */
export function embedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    playlist: id,
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
