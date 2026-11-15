// Microphone recording for Parent Section → Voices and the lessons' speaking
// practice (MediaRecorder). No React. The microphone is asked for only on a
// tap (the parent's record, the child's mic button); the ONE stream is kept
// while the Voices page / the lesson is open (so it asks once, not per take)
// and released with `releaseMic()` when that screen closes.
// Every clip is capped at MAX_CLIP_MS and stored as the browser recorded it
// (audio/mp4 on iOS Safari, audio/webm;codecs=opus in Chrome and Firefox).
import { audioCtx } from "./audio";

/** Hard cap of one recording. */
export const MAX_CLIP_MS = 8000;

/** Preferred formats, best first; the first one the browser supports is used. Apple's
 * WebKit (Safari, every browser on iPad / iPhone) records and plays AAC in MP4 best. */
const APPLE_PREFS = ["audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"];
const OTHER_PREFS = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

export type MicProblem = "unsupported" | "denied" | "no-mic" | "busy" | "other";

export class MicError extends Error {
  constructor(readonly problem: MicProblem) {
    super(problem);
  }
}

export interface Recording {
  blob: Blob;
  mime: string;
  ms: number;
}

export interface RecordingHandle {
  startedAt: number;
  /** Stop now; resolves with the recording (also resolves when the cap stopped it). */
  stop: () => Promise<Recording>;
  /** Resolves when the recording ends, by stop() or by the cap. */
  done: Promise<Recording>;
}

let stream: MediaStream | null = null;

export function recordingSupported(): boolean {
  return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** The best format this browser can record, or "" to let it choose. */
export function bestRecordingMime(): string {
  if (!recordingSupported() || typeof MediaRecorder.isTypeSupported !== "function") return "";
  const apple = /apple/i.test(navigator.vendor ?? "");
  return (apple ? APPLE_PREFS : OTHER_PREFS).find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

function problemOf(error: unknown): MicProblem {
  const name = (error as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "no-mic";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "other";
}

async function openMic(): Promise<MediaStream> {
  if (stream?.getAudioTracks().some((track) => track.readyState === "live")) return stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    return stream;
  } catch (error) {
    throw new MicError(problemOf(error));
  }
}

/** Ask for the microphone now (from a tap) without recording: null when it works. */
export async function checkMic(): Promise<MicProblem | null> {
  if (!recordingSupported()) return "unsupported";
  try {
    await openMic();
    return null;
  } catch (error) {
    return error instanceof MicError ? error.problem : "other";
  }
}

/** What the browser says about the microphone permission, without asking ("unknown" where it cannot tell). */
export async function micPermission(): Promise<PermissionState | "unknown"> {
  try {
    const status = await navigator.permissions?.query({ name: "microphone" as PermissionName });
    return status?.state ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Watch how loud the open microphone is (0..1, about 15 times a second) — the
 * child's "it hears me" pulse. Uses the shared AudioContext; the analyser is
 * never connected to the speakers. Returns the stop function.
 */
export function watchMicLevel(onLevel: (level: number) => void): () => void {
  const ctx = audioCtx();
  if (!ctx || !stream) return () => undefined;
  let source: MediaStreamAudioSourceNode;
  try {
    source = ctx.createMediaStreamSource(stream);
  } catch {
    return () => undefined;
  }
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const timer = window.setInterval(() => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const value of data) sum += ((value - 128) / 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
  }, 66);
  return () => {
    window.clearInterval(timer);
    source.disconnect();
    analyser.disconnect();
  };
}

/** Stop the microphone (the browser's "recording" indicator goes away). */
export function releaseMic(): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
  stream = null;
}

/** Start recording (asks for the microphone the first time). Throws MicError. */
export async function startRecording(maxMs = MAX_CLIP_MS): Promise<RecordingHandle> {
  if (!recordingSupported()) throw new MicError("unsupported");
  const mic = await openMic();
  const wanted = bestRecordingMime();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(mic, wanted ? { mimeType: wanted, audioBitsPerSecond: 64000 } : undefined);
  } catch {
    throw new MicError("unsupported");
  }
  const chunks: Blob[] = [];
  const startedAt = performance.now();
  const done = new Promise<Recording>((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      // Store the type the browser really used (Chrome's webm reports no duration: measure it ourselves).
      const mime = recorder.mimeType || wanted || chunks[0]?.type || "audio/webm";
      resolve({ blob: new Blob(chunks, { type: mime }), mime, ms: Math.min(maxMs, performance.now() - startedAt) });
    };
  });
  const stop = () => {
    window.clearTimeout(cap);
    if (recorder.state !== "inactive") recorder.stop();
    return done;
  };
  const cap = window.setTimeout(() => void stop(), maxMs);
  try {
    recorder.start();
  } catch {
    window.clearTimeout(cap);
    throw new MicError("other");
  }
  return { startedAt, stop, done };
}
