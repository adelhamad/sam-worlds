// Keys of the parent's recorded voice clips — PURE, so the audit can check the
// scheme against every course. A phrase clip is `<lang>:<phraseId>` ("ar:marhaba"),
// a letter clip is `<lang>:letter:<letterId>` ("ar:letter:baa"). Phrase and letter
// ids are kebab-case Latin and never contain ":", so the two never collide.
// Saved in IndexedDB (table voiceClips): never change the scheme.
import type { LangCode } from "../lang/types";

export type ClipKind = "phrase" | "letter";

export interface ClipRef {
  lang: LangCode;
  kind: ClipKind;
  id: string;
}

const LETTER = "letter";

export function clipKey(lang: LangCode, kind: ClipKind, id: string): string {
  return kind === "letter" ? `${lang}:${LETTER}:${id}` : `${lang}:${id}`;
}

/** The clip a lesson card would play: letter cards carry `letter: true`. */
export function cardClipKey(lang: LangCode, card: { id: string; letter?: boolean }): string {
  return clipKey(lang, card.letter ? "letter" : "phrase", card.id);
}

export function parseClipKey(key: string): ClipRef | null {
  const parts = key.split(":");
  const lang = parts[0];
  if (lang !== "ar" && lang !== "fr") return null;
  if (parts.length === 2 && parts[1]) return { lang, kind: "phrase", id: parts[1] };
  if (parts.length === 3 && parts[1] === LETTER && parts[2]) return { lang, kind: "letter", id: parts[2] };
  return null;
}
