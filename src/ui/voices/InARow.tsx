// "Record them in a row": one phrase big, Record → Stop → it plays back once →
// Keep / Again → the next one. A parent can do a whole unit in two minutes.
// Nothing is saved until Keep.
import { useEffect, useRef, useState } from "react";
import { clipMeta, playBlob } from "../../engine/feedback/clips";
import type { Recording } from "../../engine/feedback/recorder";
import { formatSeconds, VOICES } from "../../strings/voices";
import { Icon } from "../icons/Icon";
import { ItemText } from "./ClipRow";
import type { StudioGroup } from "./studioData";
import { keepRecording, type Studio } from "./useStudio";

const S = VOICES.row;

export function InARow({ group, lang, studio, onClose }: { group: StudioGroup; lang: string; studio: Studio; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<Recording | null>(null);
  const [saving, setSaving] = useState(false);
  const item = group.items[index];
  const total = group.items.length;
  const recording = item ? studio.active === item.key : false;
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    box.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }, []);

  const record = () => {
    if (!item) return;
    setPending(null);
    void studio.start(item.key, (rec) => {
      setPending(rec);
      void playBlob(rec.blob);
    });
  };
  const next = () => {
    setPending(null);
    setIndex(index + 1);
  };
  const keep = () => {
    if (!item || !pending || saving) return;
    setSaving(true);
    void keepRecording(studio, item.key, lang, pending).then((saved) => {
      setSaving(false);
      if (saved) next();
    });
  };

  let body;
  if (!item) {
    body = <p className="vx-row-finished">{S.finished}</p>;
  } else if (recording) {
    body = (
      <button type="button" className="btn btn-danger btn-big vx-big-btn vx-rec-on" onClick={studio.stop} data-testid="vx-row-stop">
        {VOICES.studio.stop(formatSeconds(studio.elapsed))}
      </button>
    );
  } else if (pending) {
    body = (
      <>
        <p className="dim">{S.listening}</p>
        <div className="parent-row vx-row-choices">
          <button type="button" className="btn btn-secondary vx-big-btn" onClick={() => void playBlob(pending.blob)} data-testid="vx-row-play">
            <Icon name="play" size={20} mono /> {VOICES.studio.play}
          </button>
          <button type="button" className="btn btn-secondary vx-big-btn" onClick={record} data-testid="vx-row-again">{S.again}</button>
          <button type="button" className="btn btn-primary vx-big-btn" disabled={saving} onClick={keep} data-testid="vx-row-keep">
            {saving ? VOICES.studio.saving : S.keep}
          </button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <p className="dim">{clipMeta(item.key) ? S.already : S.tapRecord}</p>
        <div className="parent-row vx-row-choices">
          <button type="button" className="btn btn-primary btn-big vx-big-btn" disabled={studio.active !== null} onClick={record} data-testid="vx-row-record">
            {VOICES.studio.record}
          </button>
          <button type="button" className="btn btn-secondary vx-big-btn" onClick={next} data-testid="vx-row-skip">{S.skip}</button>
        </div>
      </>
    );
  }

  return (
    <section ref={box} className="panel parent-block vx-inarow" data-testid="vx-inarow" aria-live="polite">
      <div className="vx-inarow-head">
        <h2>{S.title(group.name)}</h2>
        <button type="button" className="btn btn-compact btn-secondary" onClick={() => { studio.stop(); onClose(); }} data-testid="vx-row-done">{S.done}</button>
      </div>
      {item && <p className="vx-inarow-count">{S.progress(index + 1, total)}</p>}
      {item && (
        <div className={`vx-inarow-card ${clipMeta(item.key) ? "is-recorded" : ""}`}>
          <ItemText item={item} lang={lang} big />
        </div>
      )}
      {body}
    </section>
  );
}
