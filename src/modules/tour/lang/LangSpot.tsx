// lang-spot — catch the word: a sentence floats on screen as word bubbles,
// one of its words is heard — tap that bubble to catch it (a different one can
// be caught instead until CHECK). Draft = spotAnswer(index); CHECK submits.
// Tapping never speaks the word (that would turn it into sound-matching) and
// every catch sounds the same. Without a voice the word is shown instead.
import { useEffect, useState, type CSSProperties } from "react";
import { spotAnswer } from "../../../engine/lang/answers";
import type { SpotPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { Script, Speaker } from "./LangFaces";
import { useVoice } from "./useVoice";
import "./spot.css";

const S = LANG.ui;

export function LangSpot({ payload, disabled, onDraft }: WidgetProps<SpotPayload>) {
  const { canSayText, say } = useVoice(payload.lang);
  const heard = payload.words[payload.heard];
  // A voice file, or failing that the device voice; with neither, the word is shown instead.
  const ready = canSayText(heard.say);
  const [picked, setPicked] = useState<number | null>(null);
  /** Bumps on every catch so the burst replays. */
  const [catches, setCatches] = useState(0);
  useDraft(onDraft, picked === null ? null : spotAnswer(picked));


  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => say(heard.say), 500);
    return () => window.clearTimeout(timer);
  }, [ready, say, heard.say]);

  const tap = (index: number) => {
    if (disabled) return;
    tourSound.place();
    setPicked(index);
    setCatches((count) => count + 1);
  };

  return (
    <div className={`tx lx lx-spot ${picked === null ? "" : "has-catch"}`} data-testid="lang-spot">
      {ready
        ? (
          <div className="lx-hero is-hear lxs-ear">
            <Speaker size="big" label={S.listenAgain} onClick={() => say(heard.say)} testId="lang-hear" />
            <button type="button" className="lx-slow" onClick={() => say(heard.say, true)}>{S.slow}</button>
          </div>
        )
        : (
          <div className="lx-hero lxs-shown" aria-label={S.heardWord}>
            <Script text={heard.text} lang={payload.lang} />
            {heard.roman && <span className="lx-roman">{heard.roman}</span>}
          </div>
        )}
      <div className="lxs-line" dir={payload.rtl ? "rtl" : "ltr"}>
        {payload.words.map((word, index) => (
          <span key={`${index}-${word.text}`} className="lxs-bob" style={{ "--i": index } as CSSProperties}>
            <button
              type="button" className={`lxs-word ${picked === index ? "is-caught" : ""}`}
              aria-pressed={picked === index} disabled={disabled} data-testid={`lang-word-${index}`} onClick={() => tap(index)}
            >
              <Script text={word.text} lang={payload.lang} />
              {word.roman && <span className="lx-roman">{word.roman}</span>}
              {picked === index && <span key={catches} className="lxs-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
