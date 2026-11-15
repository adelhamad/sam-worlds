// Parent Section → Voices: strings for the parent (not the child). Plain and
// calm; no emoji; never the words "wrong" or "fail" (scripts/audit-voices.ts).
import type { LangCode } from "../engine/lang/types";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const VOICES = {
  /** The card in the main Parent Section. */
  entry: {
    title: "Voices",
    body: "Choose the device voice for Arabic and French, and record the phrases in your own voice.",
    open: "Open Voices",
  },

  title: "Voices",
  back: "Parent",

  /** Two calm lines at the top, per language. */
  why: {
    ar: [
      "The app speaks Arabic with its own built-in voice (a Syrian accent), on every device.",
      "Record a phrase in your own voice and Sam hears your family's Arabic instead.",
    ],
    fr: [
      "The app speaks French with its own built-in voice, on every device.",
      "If you record a phrase, Sam hears your voice instead.",
    ],
  } satisfies Record<LangCode, [string, string]>,
  onDevice: "Recordings stay on this device only. They are not backed up and not shared.",

  device: {
    heading: "The device voice (last resort)",
    lastResort: "Only used if a phrase has neither your recording nor a built-in voice file.",
    uses: "The app uses:",
    none: "No voice for this language on this device.",
    local: "on this device",
    network: "needs the internet",
    novelty: "novelty voice",
    enhanced: "Enhanced",
    premium: "Premium",
    test: "Test",
    choose: "Voice",
    auto: (name: string) => `Best available (${name})`,
    autoNone: "Best available",
    speed: "Speed",
    slower: "Slower",
    normal: "Normal",
    howTo: {
      title: "To add a voice (or a better one) on an iPad or iPhone:",
      steps: "Settings → Accessibility → Spoken Content → Voices → the language → download a voice. The \"Enhanced\" ones sound best. Then come back here.",
      without: "The app works without it: lessons show the words, and your recordings play.",
    },
    onlyNovelty: "Only novelty voices are installed for this language. They can sound odd.",
  },

  studio: {
    heading: "Your own voice",
    total: (count: number, size: string) => (count ? `${plural(count, "recording", "recordings")} · about ${size}` : "No recordings yet"),
    unitCount: (done: number, total: number) => `${done} of ${total} recorded`,
    letters: "Letters (their names)",
    open: "Show phrases",
    close: "Hide phrases",
    openLetters: "Show letters",
    closeLetters: "Hide letters",
    inARow: "Record them in a row",
    record: "Record",
    recordAgain: "Record again",
    stop: (seconds: string) => `Stop ${seconds}`,
    play: "Play",
    appVoice: "App voice",
    delete: "Delete",
    recorded: "Recorded",
    notYet: "Not recorded",
    cap: (seconds: number) => `Each recording stops by itself after ${seconds} seconds.`,
    deleteUnit: "Delete this group's recordings",
    deleteAll: (language: string) => `Delete all my ${language} recordings`,
    confirmAll: (count: number, language: string) => `Delete ${plural(count, "recording", "recordings")} for ${language}? This cannot be undone.`,
    confirmUnit: (count: number) => `Delete ${plural(count, "recording", "recordings")} in this group?`,
    yesDelete: "Yes, delete",
    cancel: "Cancel",
    saving: "Saving…",
  },

  row: {
    title: (unit: string) => `Record in a row: ${unit}`,
    progress: (at: number, total: number) => `${at} of ${total}`,
    tapRecord: "Tap Record, say it, then tap Stop.",
    listening: "Listen back…",
    keep: "Keep",
    again: "Again",
    skip: "Skip",
    done: "Done",
    finished: "That's the whole group. Thank you!",
    already: "Already recorded. Record again to replace it, or skip.",
  },

  /** Speaking practice: one switch for every language. */
  speak: {
    heading: "Speaking practice",
    lines: [
      "Sam taps a microphone on the new words, says them, and hears the model and then himself, one after the other. It is never scored.",
      "His voice is never saved or sent anywhere: each take is dropped as soon as the slide changes. The iPad will ask for the microphone once.",
    ],
    off: "Off",
    on: "On",
    check: "Try the microphone",
    checking: "Asking for the microphone…",
    ready: "The microphone works.",
    asked: "The device will ask for the microphone the first time Sam taps it.",
    hidden: "Until this is fixed, lessons look as they do without speaking practice.",
    inLesson: "In a lesson just now:",
  },

  /** When the microphone cannot be used: one plain sentence each. */
  mic: {
    unsupported: "This browser cannot record sound. Try Safari on the iPad, or Chrome.",
    denied: "The microphone is blocked. Allow it for this app in the browser's settings, then try again.",
    "no-mic": "No microphone was found on this device.",
    busy: "Another app is using the microphone. Close it and try again.",
    other: "The recording did not start. Please try again.",
    saveProblem: "The recording could not be saved on this device (storage may be full).",
  },
};

/** "48 KB", "3.1 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Elapsed time while recording: "2.4 s". */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}
