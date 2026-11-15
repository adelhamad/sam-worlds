// One phrase (or letter) in the studio list: its writing, Latin spelling and
// meaning, a "recorded" mark, and Record / Stop, Play, Delete.
import { clipMeta, deleteClips, playClip } from "../../engine/feedback/clips";
import { formatSeconds, VOICES } from "../../strings/voices";
import { Icon } from "../icons/Icon";
import type { StudioItem } from "./studioData";
import { keepRecording, type Studio } from "./useStudio";

const S = VOICES.studio;

function recordLabel(recording: boolean, recorded: boolean, elapsed: number): string {
  if (recording) return S.stop(formatSeconds(elapsed));
  return recorded ? S.recordAgain : S.record;
}

export function ItemText({ item, lang, big = false }: { item: StudioItem; lang: string; big?: boolean }) {
  return (
    <span className={`vx-item ${big ? "is-big" : ""}`}>
      <span className={`vx-text ${item.letter ? "is-letter" : ""}`} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>{item.text}</span>
      {item.roman && <span className="vx-roman">{item.roman}</span>}
      <span className="vx-en">{item.en}</span>
    </span>
  );
}

export function ClipRow({ item, lang, studio }: { item: StudioItem; lang: string; studio: Studio }) {
  const meta = clipMeta(item.key);
  const recording = studio.active === item.key;
  const busy = studio.active !== null && !recording;

  const toggle = () => {
    if (recording) {
      studio.stop();
      return;
    }
    void studio.start(item.key, (rec) => void keepRecording(studio, item.key, lang, rec));
  };

  return (
    <div className={`vx-row ${meta ? "is-recorded" : ""}`} data-testid={`vx-row-${item.key}`} data-recorded={meta ? "1" : "0"}>
      <span className={`vx-mark ${meta ? "is-on" : ""}`} title={meta ? S.recorded : S.notYet}>
        {meta ? <Icon name="check" size={22} mono /> : null}
        <span className="vx-sr">{meta ? S.recorded : S.notYet}</span>
      </span>
      <ItemText item={item} lang={lang} />
      <div className="vx-ctrls">
        <button
          type="button" className={`btn btn-compact ${recording ? "btn-danger vx-rec-on" : "btn-secondary"}`}
          disabled={busy} onClick={toggle} data-testid={`vx-rec-${item.key}`}
        >
          {recordLabel(recording, Boolean(meta), studio.elapsed)}
        </button>
        {meta && !recording && (
          <>
            <button type="button" className="btn btn-compact btn-secondary" disabled={busy} onClick={() => void playClip(item.key)} data-testid={`vx-play-${item.key}`}>
              <Icon name="play" size={18} mono /> {S.play}
            </button>
            <button type="button" className="btn btn-compact btn-secondary vx-del" disabled={busy} onClick={() => void deleteClips([item.key])} data-testid={`vx-del-${item.key}`}>
              {S.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
