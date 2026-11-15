// lang-spot — a sentence is on screen, one of its words is heard: tap it.
// Draft = spotAnswer(index); CHECK submits. Without a voice the word is shown.
import { useEffect, useState } from "react";
import { spotAnswer } from "../../../engine/lang/answers";
import type { SpotPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { Script, Speaker } from "./LangFaces";
import { useVoice } from "./useVoice";

const S = LANG.ui;

export function LangSpot({ payload, disabled, onDraft }: WidgetProps<SpotPayload>) {
  const { ready, say } = useVoice(payload.lang);
  const [picked, setPicked] = useState<number | null>(null);
  useDraft(onDraft, picked === null ? null : spotAnswer(picked));
  const heard = payload.words[payload.heard];

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => say(heard.say), 500);
    return () => window.clearTimeout(timer);
  }, [ready, say, heard.say]);

  const tap = (index: number) => {
    if (disabled) return;
    tourSound.pop();
    setPicked(index);
  };

  return (
    <div className="tx lx lx-spot" data-testid="lang-spot">
      <div className="lx-hero is-hear">
        {ready
          ? (
            <>
              <Speaker size="big" label={S.listenAgain} onClick={() => say(heard.say)} testId="lang-hear" />
              <button type="button" className="lx-slow" onClick={() => say(heard.say, true)}>{S.slow}</button>
            </>
          )
          : <Script text={heard.text} lang={payload.lang} />}
      </div>
      <div className="lx-tray lx-spot-line" dir={payload.rtl ? "rtl" : "ltr"}>
        {payload.words.map((word, index) => (
          <button
            key={`${index}-${word.text}`} type="button" className={`ttile lx-tile ${picked === index ? "is-selected" : ""}`}
            aria-pressed={picked === index} disabled={disabled} data-testid={`lang-word-${index}`} onClick={() => tap(index)}
          >
            <Script text={word.text} lang={payload.lang} />
            {word.roman && <span className="lx-roman">{word.roman}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
