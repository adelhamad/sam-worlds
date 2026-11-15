// lang-choose — something is heard, shown or happening above; tap the one
// right card below (tap another to change). Draft = its id; CHECK submits.
// A listening question speaks by itself and has a big speaker to hear it
// again (and slowly); on a device without a voice the words show instead.
import { useEffect, useState } from "react";
import type { ChoosePayload, LangCard } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { MeaningFace, PhraseFace, Speaker } from "./LangFaces";
import { useVoice, type Voice } from "./useVoice";

const S = LANG.ui;
/** After the question slides in. */
const AUTO_SPEAK_MS = 500;

function Hero({ payload, voice }: { payload: ChoosePayload; voice: Voice }) {
  const { hero, lang } = payload;
  if (hero.kind === "mean") return <div className="lx-hero is-mean"><MeaningFace card={hero.card} /></div>;
  if (hero.kind === "read") return <div className="lx-hero is-read"><PhraseFace card={hero.card} lang={lang} noRoman /></div>;
  if (hero.kind === "hear") {
    const { card } = hero;
    if (!voice.ready) {
      return (
        <div className="lx-hero is-read">
          <PhraseFace card={card} lang={lang} noRoman={card.letter} />
          <p className="lx-note">{S.noVoice}</p>
        </div>
      );
    }
    return (
      <div className="lx-hero is-hear">
        <Speaker size="big" label={S.listenAgain} onClick={() => voice.say(card.say)} testId="lang-hear" />
        <button type="button" className="lx-slow" onClick={() => voice.say(card.say, true)}>{S.slow}</button>
      </div>
    );
  }
  const { line, who, setup } = hero;
  return (
    <div className="lx-hero is-scene">
      <p className="lx-setup">{setup}</p>
      {line && (
        <div className="lx-line">
          <span className="lx-who">{who?.art && <Icon name={who.art} size="1.3em" />} {S.says(who?.name ?? "")}</span>
          <button type="button" className="lx-bubble" onClick={() => voice.say(line.say)} aria-label={S.listenAgain}>
            <PhraseFace card={line} lang={lang} />
            <Icon name="sound" size={22} mono />
          </button>
        </div>
      )}
    </div>
  );
}

/** What the question says out loud when it appears. */
function spokenOf(payload: ChoosePayload): LangCard | null {
  if (payload.hero.kind === "hear") return payload.hero.card;
  return payload.hero.kind === "scene" ? payload.hero.line ?? null : null;
}

export function LangChoose({ payload, disabled, onDraft }: WidgetProps<ChoosePayload>) {
  const voice = useVoice(payload.lang);
  const [picked, setPicked] = useState<string | null>(null);
  useDraft(onDraft, picked);
  const spoken = spokenOf(payload);
  const { ready, say } = voice;

  useEffect(() => {
    if (!spoken || !ready) return;
    const timer = window.setTimeout(() => say(spoken.say), AUTO_SPEAK_MS);
    return () => window.clearTimeout(timer);
  }, [spoken, ready, say]);

  // Hearing an option would give a listening question away; elsewhere it teaches.
  const optionsSpeak = payload.show === "phrase" && payload.hero.kind !== "hear";
  const choose = (card: LangCard) => {
    if (disabled) return;
    tourSound.pop();
    setPicked(card.id);
    if (optionsSpeak) say(card.say);
  };
  const letters = payload.options.every((card) => card.letter);
  const grid = payload.show === "meaning" || letters;

  return (
    <div className={`tx lx lx-choose is-${payload.hero.kind}`} data-testid="lang-choose" data-task={payload.task}>
      <Hero payload={payload} voice={voice} />
      <p className="lx-help">{optionsSpeak && ready ? S.tapToHear : S.pickHelp}</p>
      <div className={`lx-opts ${grid ? "is-grid" : "is-list"} ${letters ? "is-letters" : ""}`}>
        {payload.options.map((card, i) => (
          <button
            key={card.id} type="button"
            className={`ttile lx-opt ${picked === card.id ? "is-selected" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            aria-pressed={picked === card.id} disabled={disabled}
            data-testid={`lang-opt-${card.id}`} onClick={() => choose(card)}
          >
            {payload.show === "meaning" ? <MeaningFace card={card} /> : <PhraseFace card={card} lang={payload.lang} noRoman={payload.noRoman} />}
          </button>
        ))}
      </div>
    </div>
  );
}
