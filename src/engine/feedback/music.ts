// Background music: proven-viral, genuinely catchy Kevin MacLeod tracks
// (incompetech.com) — legal to bundle under CC BY 4.0 (credit on title screen).
//
// Tracks are AUTO-DISCOVERED at build time: drop any .mp3 into
// src/assets/audio/ and it joins the random rotation on the next build.
// Songs are NOT precached (keeps first load light); the service worker
// caches each one the first time it plays (CacheFirst, see vite.config.ts).

export const MUSIC_CREDIT = '♪ Music: Kevin MacLeod (incompetech.com) — CC BY 4.0';

const TRACKS = Object.values(
  import.meta.glob("../../assets/audio/*.mp3", {
    eager: true,
    query: "?url",
    import: "default",
  }),
) as string[];

let el: HTMLAudioElement | null = null;
let playing = false;
let ducked = false;
let lastIndex = -1;

/** Silence the music without losing state (ear-training stages). */
export function duckMusic(): void {
  ducked = true;
  el?.pause();
}

export function unduckMusic(): void {
  ducked = false;
  if (playing) el?.play().catch(() => undefined);
}

function nextTrack(): string {
  // random, but never the same track twice in a row
  let i: number;
  do {
    i = Math.floor(Math.random() * TRACKS.length);
  } while (i === lastIndex && TRACKS.length > 1);
  lastIndex = i;
  return TRACKS[i];
}

function playRandom(): void {
  if (!el || TRACKS.length === 0 || ducked) return;
  el.src = nextTrack();
  el.play().catch(() => {
    // Autoplay blocked — a later user gesture will retry via startMusic().
    playing = false;
  });
}

export function startMusic(): void {
  if (playing) return;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.volume = 0.35;
    el.addEventListener("ended", () => {
      if (playing) playRandom();
    });
  }
  playing = true;
  if (ducked) return; // resumes via unduckMusic()
  if (el.src && !el.ended) {
    el.play().catch(() => {
      playing = false;
    });
  } else {
    playRandom();
  }
}

export function stopMusic(): void {
  playing = false;
  el?.pause();
}

export function musicPlaying(): boolean {
  return playing;
}
