// The parent's own recordings of phrases and letter names (Parent Section →
// Voices), played instead of the device voice when one exists. No React.
//  - A small in-memory index of the saved keys is loaded once at start, so a
//    lesson decides "recording or device voice" without waiting on IndexedDB.
//  - One shared <audio> element plays every clip (more reliable on iOS than a
//    new element per clip). It is primed with a silent sound inside the first
//    tap, so clips can later start from a timer (a question that speaks itself).
//  - Object URLs are made once per clip and revoked when the clip changes.
// Clips live ONLY in IndexedDB on this device (table voiceClips): they are not
// in the localStorage mirror and a progress reset never clears them.
import { db, logEvent, type VoiceClipRow } from "../save/db";
import { unlockAudio } from "./audio";

export interface ClipMeta {
  lang: string;
  mime: string;
  ms: number;
  bytes: number;
  at: number;
}

/** "Slowly" for a recording: slower, same pitch. */
export const SLOW_CLIP_RATE = 0.75;

const index = new Map<string, ClipMeta>();
const urls = new Map<string, string>();
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;
let version = 0;
let player: HTMLAudioElement | null = null;
let blobUrl: string | null = null;
/** Bumped by every play / stop, so a slow lookup never starts a stale clip. */
let playToken = 0;
let primed = false;

function changed(): void {
  version += 1;
  for (const listener of listeners) listener();
}

/** Re-render hook for React (useSyncExternalStore): the index loaded or changed. */
export function onClipsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clipsVersion(): number {
  return version;
}

function metaOf(row: VoiceClipRow): ClipMeta {
  return { lang: row.lang, mime: row.mime, ms: row.ms, bytes: row.blob?.size ?? 0, at: row.at };
}

/** Load the key index once (call at start; later calls return the same promise). */
export function loadClipIndex(): Promise<void> {
  loading ??= db.voiceClips
    .each((row) => {
      index.set(row.key, metaOf(row));
    })
    .catch(() => undefined)
    .then(changed);
  return loading;
}

export function hasClip(key: string): boolean {
  return index.has(key);
}

export function clipMeta(key: string): ClipMeta | undefined {
  return index.get(key);
}

/** Every saved clip key of one language. */
export function clipKeysOf(lang: string): string[] {
  return [...index.entries()].filter(([, meta]) => meta.lang === lang).map(([key]) => key);
}

/** Totals for one language (or all): how many clips, bytes and ms. */
export function clipStats(lang?: string): { count: number; bytes: number; ms: number } {
  let count = 0;
  let bytes = 0;
  let ms = 0;
  for (const meta of index.values()) {
    if (lang && meta.lang !== lang) continue;
    count += 1;
    bytes += meta.bytes;
    ms += meta.ms;
  }
  return { count, bytes, ms };
}

function forget(key: string): void {
  const url = urls.get(key);
  if (url) URL.revokeObjectURL(url);
  urls.delete(key);
}

export async function saveClip(key: string, lang: string, blob: Blob, mime: string, ms: number): Promise<void> {
  const row: VoiceClipRow = { key, lang, blob, mime: mime || blob.type, ms: Math.round(ms), at: Date.now() };
  await db.voiceClips.put(row);
  forget(key);
  index.set(key, metaOf(row));
  changed();
  logEvent("voices.record", { key, ms: row.ms, bytes: blob.size });
}

export async function deleteClips(keys: string[]): Promise<void> {
  const present = keys.filter((key) => index.has(key));
  if (!present.length) return;
  stopClip();
  await db.voiceClips.bulkDelete(present);
  for (const key of present) {
    forget(key);
    index.delete(key);
  }
  changed();
  logEvent("voices.delete", { count: present.length, first: present[0] });
}

function audio(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  if (!player) {
    player = new Audio();
    player.preload = "auto";
  }
  return player;
}

/** Stop the clip that is playing, if any. */
export function stopClip(): void {
  playToken += 1;
  player?.pause();
}

async function urlFor(key: string): Promise<string | null> {
  const cached = urls.get(key);
  if (cached) return cached;
  const row = await db.voiceClips.get(key).catch(() => undefined);
  if (!row?.blob) return null;
  const url = URL.createObjectURL(row.blob);
  urls.set(key, url);
  return url;
}

async function playUrl(el: HTMLAudioElement, url: string, slow: boolean): Promise<boolean> {
  el.pause();
  el.src = url;
  const rate = slow ? SLOW_CLIP_RATE : 1;
  const pitch = el as HTMLAudioElement & { webkitPreservesPitch?: boolean; mozPreservesPitch?: boolean };
  pitch.preservesPitch = true;
  pitch.webkitPreservesPitch = true;
  pitch.mozPreservesPitch = true;
  el.defaultPlaybackRate = rate;
  el.playbackRate = rate;
  try {
    await el.play();
    return true;
  } catch {
    return false;
  }
}

/** Stop whatever the device voice is saying (no import of speech.ts: it would be circular). */
function hushSpeech(): void {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

/**
 * Play the recording saved under `key`. Resolves false when there is none or
 * it cannot play (the caller then uses the device voice). Stops any speech.
 */
export async function playClip(key: string, slow = false): Promise<boolean> {
  const el = audio();
  if (!el || !index.has(key)) return false;
  unlockAudio();
  hushSpeech();
  const token = ++playToken;
  el.pause();
  const url = await urlFor(key);
  if (token !== playToken) return true; // something newer started: this one is no longer wanted
  return url ? playUrl(el, url, slow) : false;
}

/** Play an unsaved recording (the studio's "listen before keeping"). */
export async function playBlob(blob: Blob, slow = false): Promise<boolean> {
  const el = audio();
  if (!el) return false;
  unlockAudio();
  hushSpeech();
  playToken += 1;
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = URL.createObjectURL(blob);
  return playUrl(el, blobUrl, slow);
}

/** A 50 ms silent WAV (8 kHz, 8-bit mono), for priming the element inside a tap. */
function silentWav(): string {
  const samples = 400;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at: number, value: string) => [...value].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * iOS lets an <audio> element play on its own only after it has played inside
 * a tap. Call from a tap handler: it plays a short silence once.
 */
export function primeClips(): void {
  const el = audio();
  if (primed || !el || !el.paused) return;
  primed = true;
  el.src = silentWav();
  void el.play().catch(() => {
    primed = false;
  });
}
