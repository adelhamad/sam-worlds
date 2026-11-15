// The teach-first slides of a language lesson: each new phrase (or letter) on
// one big card — its writing, how it sounds, what it means — spoken by the
// device when the slide appears. Pogo asks the child to say it out loud. NEXT
// walks on, the last slide says "Let's go!", and a quiet Skip starts at once.
// With speaking practice on (Parent Section → Voices), a microphone appears
// once the phrase has been heard: he says it, then hears the model and himself
// (SpeakTurn). It is optional, never judged, and Next always works.
import { useEffect, useState } from "react";
import { letterCard, phraseCard } from "../../../engine/lang/cards";
import type { LangCard, LangParams } from "../../../engine/lang/types";
import { primeClips } from "../../../engine/feedback/clips";
import { primeSpeech } from "../../../engine/feedback/speech";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { LANG } from "../../../strings/lang";
import { PogoSay } from "../../../ui/tour/Pogo";
import { useCompact } from "../lesson/useCompact";
import { MeaningFace, PhraseFace, Speaker } from "./LangFaces";
import { SpeakPanel } from "./SpeakTurn";
import { speakBusy, speakPogo } from "./speakPogo";
import { useSpeakReady, useSpeakTurn } from "./useSpeakTurn";
import { useVoice } from "./useVoice";
import "../../../ui/tour/tour-base.css";
import "./lang.css";

const S = LANG.meet;
/** The microphone shows up once the slide's phrase has (most likely) been heard. */
const MIC_AFTER_MS = 1600;

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
  const { canSay, say } = useVoice(params.lang);
  const [slides] = useState(() => meetSlides(params));
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const slide = slides[Math.min(index, total - 1)];
  const last = index >= total - 1;
  const card = slide?.card;
  const audible = canSay(card);
  const speakOn = useSpeakReady() && audible;
  const turn = useSpeakTurn(params.lang, speakOn ? card : null);
  const { busy } = turn;
  const [micFor, setMicFor] = useState(-1);
  const live = speakOn ? speakPogo(turn.phase, turn.takes) : null;
  const quiet = speakOn && speakBusy(turn.phase);

  useEffect(() => {
    if (!audible || !card) return;
    const timer = window.setTimeout(() => { if (!busy()) say(card); }, 450);
    return () => window.clearTimeout(timer);
  }, [audible, card, say, index, busy]);

  useEffect(() => {
    if (!speakOn) return;
    const timer = window.setTimeout(() => setMicFor(index), MIC_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [speakOn, index]);

  const prime = () => {
    primeSpeech();
    primeClips();
  };
  const next = () => {
    prime();
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
      <button type="button" className="lx-meet-skip" onClick={() => { prime(); onStart(); }} data-testid="lang-meet-skip">{S.skip}</button>
      <PogoSay mood={live?.mood ?? (index === 0 ? "wave" : undefined)} size={compact ? 84 : 116} text={live?.text ?? slide.title} />
      <div key={index} className="lx-meet-card">
        <PhraseFace card={slide.card} lang={params.lang} />
        <div className="lx-meet-means">
          {slide.card.letter ? <span className="lx-en">{S.soundsLike(slide.card.en)}</span> : <MeaningFace card={slide.card} />}
        </div>
        {slide.tip && <p className="lx-meet-tip">{slide.tip}</p>}
        {audible
          ? (
            <div className={`lx-meet-hear${quiet ? " is-quiet" : ""}`}>
              <Speaker label={LANG.ui.listenAgain} onClick={() => { setMicFor(index); say(slide.card); }} disabled={quiet} testId="lang-meet-hear">{LANG.ui.listenAgain}</Speaker>
              <button type="button" className="lx-slow" onClick={() => say(slide.card, true)} disabled={quiet}>{LANG.ui.slow}</button>
            </div>
          )
          : <p className="lx-note">{LANG.ui.noVoice}</p>}
        {speakOn && <SpeakPanel phase={turn.phase} takes={turn.takes} tapMic={turn.tapMic} replay={turn.replay} levelRef={turn.levelRef} waiting={micFor !== index} compact={compact} />}
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
