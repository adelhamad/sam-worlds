// One "Your turn — say it!" for one card: tap the mic → record (tap again to
// stop, or it stops itself after SPEAK_MAX_MS) → the model plays, then the
// child's take → Pogo is glad. Again records a new take; "Hear both" replays.
// Changing the card (the next slide) or unmounting drops everything: the take
// is never stored, its object URL is revoked, nothing keeps playing. The mic
// stream itself belongs to the lesson (released when the lesson screen closes).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { dropBlob, primeClips, stopClip } from "../../../engine/feedback/clips";
import { MicError, recordingSupported, startRecording, watchMicLevel, type RecordingHandle } from "../../../engine/feedback/recorder";
import {
  SPEAK_GAP_MS, SPEAK_MAX_MS, micTrouble, noteMicTrouble, onMicTrouble, pause, playModel, playTake,
} from "../../../engine/feedback/speakBack";
import { hushSpeech, primeSpeech } from "../../../engine/feedback/speech";
import { logEvent } from "../../../engine/save/db";
import type { LangCode } from "../../../engine/lang/types";
import { useGame } from "../../../state/store";
import type { SpeakPhase } from "./speakPogo";
import type { SayCard } from "./useVoice";


export interface SpeakTurn {
  phase: SpeakPhase;
  /** Takes finished on this card (for Pogo's varied cheers). */
  takes: number;
  /** Something is happening: no auto-speaking now. */
  busy: () => boolean;
  /** The mic button: start, or stop while recording. */
  tapMic: () => void;
  /** Hear the model and the take again. */
  replay: () => void;
  /** Where the live level goes (a CSS variable on this element). */
  levelRef: RefObject<HTMLButtonElement>;
}

/** Speaking practice is on, this browser can record, and the mic has not failed this visit. */
export function useSpeakReady(): boolean {
  const on = useGame((s) => s.speakPractice);
  const trouble = useSyncExternalStore(onMicTrouble, micTrouble);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!on) return;
    let live = true;
    void navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then((status) => { if (live) setDenied(status.state === "denied"); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [on]);
  return on && !trouble && !denied && recordingSupported();
}

/** Get ready to record from inside the tap: audio unlocked, nothing talking. */
function prepareTap(): void {
  unlockAudio();
  primeClips();
  primeSpeech();
  stopClip();
  hushSpeech();
}

export function useSpeakTurn(lang: LangCode, card: SayCard | null | undefined): SpeakTurn {
  // The state belongs to one card: a new card reads as a fresh "idle".
  const [state, setState] = useState<{ card: unknown; phase: SpeakPhase; takes: number }>({ card, phase: "idle", takes: 0 });
  const mine = state.card === card;
  const phase = mine ? state.phase : "idle";
  const takes = mine ? state.takes : 0;
  const phaseRef = useRef<SpeakPhase>("idle");
  const handle = useRef<RecordingHandle | null>(null);
  const take = useRef<Blob | null>(null);
  const run = useRef(0);
  const unwatch = useRef<() => void>(() => undefined);
  const levelRef = useRef<HTMLButtonElement>(null);

  const setPhase = useCallback((next: SpeakPhase, took = false) => {
    phaseRef.current = next;
    setState((prev) => {
      const count = prev.card === card ? prev.takes : 0;
      return { card, phase: next, takes: took ? count + 1 : count };
    });
  }, [card]);

  // A new card (the next slide) or leaving: drop the take, stop everything.
  useEffect(() => {
    phaseRef.current = "idle";
    return () => {
      run.current += 1;
      unwatch.current();
      void handle.current?.stop();
      handle.current = null;
      take.current = null;
      dropBlob();
      stopClip();
      hushSpeech();
      phaseRef.current = "idle";
    };
  }, [card]);

  const playBack = useCallback(async (id: number) => {
    const blob = take.current;
    if (!blob || !card || id !== run.current) return;
    setPhase("model");
    await playModel(lang, card);
    if (id !== run.current) return;
    await pause(SPEAK_GAP_MS);
    if (id !== run.current) return;
    setPhase("take");
    await playTake(blob);
    if (id !== run.current) return;
    setPhase("done");
  }, [card, lang, setPhase]);

  const record = useCallback(async () => {
    const id = ++run.current;
    prepareTap();
    dropBlob();
    take.current = null;
    setPhase("starting");
    let rec: RecordingHandle;
    try {
      rec = await startRecording(SPEAK_MAX_MS);
    } catch (error) {
      const problem = error instanceof MicError ? error.problem : "other";
      logEvent("lang.speak.mic", { problem });
      if (id === run.current) setPhase("idle");
      noteMicTrouble(problem); // the mic hides itself; nothing is said to the child
      return;
    }
    if (id !== run.current) {
      void rec.stop();
      return;
    }
    handle.current = rec;
    setPhase("recording");
    unwatch.current = watchMicLevel((level) => levelRef.current?.style.setProperty("--sp-level", level.toFixed(2)));
    const recording = await rec.done;
    unwatch.current();
    levelRef.current?.style.setProperty("--sp-level", "0");
    if (handle.current === rec) handle.current = null;
    if (id !== run.current) return;
    if (!recording.blob.size) {
      setPhase("idle"); // nothing came through: just ready again
      return;
    }
    take.current = recording.blob;
    setPhase("model", true);
    logEvent("lang.speak.take", { lang, card: card?.id, ms: Math.round(recording.ms) });
    await playBack(id);
  }, [card, lang, playBack, setPhase]);

  const tapMic = useCallback(() => {
    const now = phaseRef.current;
    if (now === "starting") return;
    if (now === "recording") {
      prepareTap(); // the stop tap also unlocks the playback that follows
      void handle.current?.stop();
      return;
    }
    void record();
  }, [record]);

  const replay = useCallback(() => {
    if (!take.current || phaseRef.current !== "done") return;
    prepareTap();
    void playBack(++run.current);
  }, [playBack]);

  const busy = useCallback(() => phaseRef.current !== "idle" && phaseRef.current !== "done", []);

  return { phase, takes, busy, tapMic, replay, levelRef };
}
