// The recording studio's one microphone: which clip is being recorded, for how
// long, and what went wrong in plain words. One recording at a time; the
// recording ends on Stop or by itself at the cap, and `onDone` gets it once.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clipsVersion, onClipsChanged, saveClip, stopClip } from "../../engine/feedback/clips";
import { VOICES } from "../../strings/voices";
import { MicError, releaseMic, startRecording, type MicProblem, type Recording, type RecordingHandle } from "../../engine/feedback/recorder";

export type StudioProblem = MicProblem | "save";

/** One plain sentence for what went wrong. */
export function problemText(problem: StudioProblem): string {
  return problem === "save" ? VOICES.mic.saveProblem : VOICES.mic[problem];
}

export interface Studio {
  /** Key being recorded (or starting), else null. */
  active: string | null;
  /** Ms since the recording started. */
  elapsed: number;
  problem: StudioProblem | null;
  start: (key: string, onDone: (recording: Recording) => void) => Promise<void>;
  stop: () => void;
  setProblem: (problem: StudioProblem | null) => void;
}

/** Re-render when a recording is saved or deleted (or the index loads). */
export function useClipsVersion(): number {
  return useSyncExternalStore(onClipsChanged, clipsVersion);
}

export function useStudio(): Studio {
  const [active, setActive] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState<StudioProblem | null>(null);
  const handle = useRef<RecordingHandle | null>(null);
  const alive = useRef(true);

  // Leaving the page: stop recording and give the microphone back.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void handle.current?.stop();
      handle.current = null;
      stopClip();
      releaseMic();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      const started = handle.current?.startedAt;
      if (started !== undefined) setElapsed(performance.now() - started);
    }, 100);
    return () => window.clearInterval(timer);
  }, [active]);

  const start = useCallback(async (key: string, onDone: (recording: Recording) => void) => {
    if (handle.current) return;
    stopClip();
    setProblem(null);
    setElapsed(0);
    setActive(key);
    try {
      const rec = await startRecording();
      if (!alive.current) {
        void rec.stop();
        return;
      }
      handle.current = rec;
      void rec.done.then((recording) => {
        handle.current = null;
        if (!alive.current) return;
        setActive(null);
        onDone(recording);
      });
    } catch (error) {
      setActive(null);
      setProblem(error instanceof MicError ? error.problem : "other");
    }
  }, []);

  const stop = useCallback(() => {
    void handle.current?.stop();
  }, []);

  return { active, elapsed, problem, start, stop, setProblem };
}

/** Save a finished recording under `key` (an empty one is reported, not saved). */
export function keepRecording(studio: Studio, key: string, lang: string, recording: Recording): Promise<boolean> {
  if (!recording.blob.size) {
    studio.setProblem("other");
    return Promise.resolve(false);
  }
  return saveClip(key, lang, recording.blob, recording.mime, recording.ms).then(
    () => true,
    () => {
      studio.setProblem("save");
      return false;
    },
  );
}
