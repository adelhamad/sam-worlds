// The teach-first slides of a language lesson: each new phrase (or letter) on
// one big card — its writing, how it sounds, what it means — spoken by the
// device when the slide appears. Pogo asks the child to say it out loud. NEXT
// walks on, the last slide says "Let's go!", and a quiet Skip starts at once.
import { useEffect, useState } from "react";
import { letterCard, phraseCard } from "../../../engine/lang/cards";
import type { LangCard, LangParams } from "../../../engine/lang/types";
import { primeSpeech } from "../../../engine/feedback/speech";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { LANG } from "../../../strings/lang";
import { PogoSay } from "../../../ui/tour/Pogo";
import { useCompact } from "../lesson/useCompact";
import { MeaningFace, PhraseFace, Speaker } from "./LangFaces";
import { useVoice } from "./useVoice";
import "../../../ui/tour/tour-base.css";
import "./lang.css";

const S = LANG.meet;

interface Slide {
  card: LangCard;
  tip?: string;
  title: string;
}

/** The lesson's slides: its letters, then its new phrases. */
function meetSlides(params: LangParams): Slide[] {
  return [
    ...params.letters.map((letter): Slide => ({ card: letterCard(letter), title: S.newLetters })),
    ...params.teach.map((phrase): Slide => ({ card: phraseCard(phrase), tip: phrase.tip, title: S.sayIt })),
  ];
}

export interface LangMeetProps {
  params: LangParams;
  /** Called when the child taps the start button. */
  onStart: () => void;
}

export function LangMeet({ params, onStart }: LangMeetProps) {
  const compact = useCompact();
  const { ready, say } = useVoice(params.lang);
  const [slides] = useState(() => meetSlides(params));
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const slide = slides[Math.min(index, total - 1)];
  const last = index >= total - 1;
  const spoken = slide?.card.say ?? "";

  useEffect(() => {
    if (!ready || !spoken) return;
    const timer = window.setTimeout(() => say(spoken), 450);
    return () => window.clearTimeout(timer);
  }, [ready, spoken, say, index]);

  const next = () => {
    primeSpeech();
    if (last) {
      onStart();
      return;
    }
    tourSfx.pop();
    setIndex(index + 1);
  };
  if (!slide) return null;

  return (
    <div className="tl-meet lx lx-meet" data-testid="lang-meet" data-slide={index}>
      <button type="button" className="lx-meet-skip" onClick={() => { primeSpeech(); onStart(); }} data-testid="lang-meet-skip">{S.skip}</button>
      <PogoSay mood={index === 0 ? "wave" : undefined} size={compact ? 84 : 116} text={slide.title} />
      <div key={index} className="lx-meet-card">
        <PhraseFace card={slide.card} lang={params.lang} />
        <div className="lx-meet-means">
          {slide.card.letter ? <span className="lx-en">{S.soundsLike(slide.card.en)}</span> : <MeaningFace card={slide.card} />}
        </div>
        {slide.tip && <p className="lx-meet-tip">{slide.tip}</p>}
        {ready
          ? (
            <div className="lx-meet-hear">
              <Speaker label={LANG.ui.listenAgain} onClick={() => say(spoken)} testId="lang-meet-hear">{LANG.ui.listenAgain}</Speaker>
              <button type="button" className="lx-slow" onClick={() => say(spoken, true)}>{LANG.ui.slow}</button>
            </div>
          )
          : <p className="lx-note">{LANG.ui.noVoice}</p>}
      </div>
      <div className="lx-meet-foot">
        {total > 1 && (
          <div className="lx-meet-dots" aria-hidden="true">
            {slides.map((item, i) => <i key={item.card.id} className={i <= index ? "is-on" : ""} />)}
          </div>
        )}
        <button type="button" className="tbtn tbtn-go tbtn-wide" onClick={next} data-testid="lang-meet-next">
          {last ? S.start : S.next}
        </button>
      </div>
    </div>
  );
}
