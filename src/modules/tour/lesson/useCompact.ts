import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 520px), (max-height: 760px)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True on phone-sized screens — Pogo and the big cards shrink a step. */
export function useCompact(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
