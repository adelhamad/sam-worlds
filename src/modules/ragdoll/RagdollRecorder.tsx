import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { STR } from '../../strings/en';
import { unlockAudio } from '../../engine/feedback/audio';
import type { RagdollScene } from './RagdollScene';
import './RagdollRecorder.css';

const copy = STR.ragdoll;
const MAX_SECONDS = 60;
interface Clip { url: string; name: string }

function preferredFormat() {
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find(type => MediaRecorder.isTypeSupported(type));
}

export function RagdollRecorder({ sceneRef }: { sceneRef: RefObject<RagdollScene | null> }) {
  const [supported] = useState(() => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const clearClip = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setClip(null);
  }, []);

  useEffect(() => {
    if (!clip) return;
    const dialog = dialogRef.current;
    const recordButton = buttonRef.current;
    dialog?.querySelector<HTMLAnchorElement>('a[download]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { clearClip(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('a[download], button'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); recordButton?.focus(); };
  }, [clip, clearClip]);

  function stop() {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
  }

  function start() {
    unlockAudio();
    clearClip();
    setError('');
    const scene = sceneRef.current;
    if (!scene || !supported) { setError(copy.recordUnavailable); return; }
    try {
      const stream = scene.captureStream();
      streamRef.current = stream;
      const format = preferredFormat();
      const recorder = new MediaRecorder(stream, format ? { mimeType: format } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onerror = () => { setError(copy.recordError); if (recorder.state === 'recording') recorder.stop(); };
      recorder.onstop = () => {
        window.clearInterval(timerRef.current);
        stream.getTracks().forEach(track => track.stop());
        scene.stopCapture();
        recorderRef.current = null;
        streamRef.current = null;
        setRecording(false);
        const type = recorder.mimeType || format || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (!blob.size) { setError(copy.recordError); return; }
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const extension = type.includes('mp4') ? 'mp4' : 'webm';
        setClip({ url, name: `sams-stunt-${Date.now()}.${extension}` });
      };
      recorder.start();
      setSeconds(0);
      setRecording(true);
      const started = performance.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((performance.now() - started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && recorder.state === 'recording') recorder.stop();
      }, 250);
    } catch {
      streamRef.current?.getTracks().forEach(track => track.stop());
      scene.stopCapture();
      streamRef.current = null;
      recorderRef.current = null;
      setError(copy.recordError);
    }
  }

  return (
    <>
      <div className="ragdoll-record-control">
        <button ref={buttonRef} type="button" className={`ragdoll-record-button ${recording ? 'is-recording' : ''}`} onClick={recording ? stop : start} disabled={!supported} title={supported ? copy.recordHint : copy.recordUnavailable} aria-label={recording ? copy.stopRecording : copy.record}>
          <span className="ragdoll-record-dot" aria-hidden="true" />
          {recording ? `${copy.stopRecording} ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : copy.record}
        </button>
        {error && <span className="ragdoll-record-error" role="status">{error}</span>}
      </div>
      {clip && <div className="ragdoll-record-backdrop" role="presentation">
        <section ref={dialogRef} className="ragdoll-record-dialog" role="dialog" aria-modal="true" aria-labelledby="ragdoll-record-title">
          <h2 id="ragdoll-record-title">{copy.clipReady}</h2>
          <video src={clip.url} controls playsInline aria-label={copy.clipPreview} />
          <div className="ragdoll-record-actions">
            <a href={clip.url} download={clip.name}>{copy.saveClip}</a>
            <button type="button" onClick={start}>{copy.recordAgain}</button>
            <button type="button" onClick={clearClip}>{copy.discardClip}</button>
          </div>
        </section>
      </div>}
    </>
  );
}
