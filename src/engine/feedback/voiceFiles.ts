// The voice files the app ships with (public/voice/**): one mp3 for every
// phrase, word tile and letter name of the language courses, so lessons speak
// on any device — with or without a system voice for the language. The index
// (voiceFiles.gen.json) and the files are built by scripts/build-voice-files.py
// from scripts/voice-manifest.ts; scripts/audit-voice-files.ts fails the check
// when something sayable has no file. Keys are clip keys (clipKeys.ts).
import index from "../../content/voiceFiles.gen.json";

const FILES = index as Record<string, string>;

export function hasVoiceFile(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(FILES, key);
}

/** Where the file is served from (same origin, precached for offline use), or null. */
export function voiceFileUrl(key: string): string | null {
  if (!hasVoiceFile(key)) return null;
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/";
  return `${base}voice/${FILES[key]}.mp3`;
}

/** Every key that has a file (for the audit). */
export function voiceFileKeys(): string[] {
  return Object.keys(FILES);
}
