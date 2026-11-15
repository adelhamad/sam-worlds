// The speaking break: once in a language lesson (only with speaking practice
// on), between two questions, Pogo asks the child to say one of the lesson's
// phrases to him — record → hear the model and himself → Pogo is glad. Not a
// question: nothing is judged or paid, it never waits on its own, and "Not
// now" / "Continue" always moves on. The take is dropped when it closes.
import { useEffect } from "react";
import type { LangCard, LangCode } from "../../../engine/lang/types";
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

const S = LANG.meet.speak;

interface SpeakBreakProps {
  id: number;
  lang: LangCode;
  card: LangCard;
  onDone: (id: number) => void;
}

export function SpeakBreak({ id, lang, card, onDone }: SpeakBreakProps) {
  const compact = useCompact();
  const turn = useSpeakTurn(lang, card);
  const live = speakPogo(turn.phase, turn.takes);
  const { say } = useVoice(lang);
  const { busy } = turn;
  const ready = useSpeakReady();

  // The microphone turned out unusable (refused, missing): the break simply ends.
  useEffect(() => {
    if (!ready) onDone(id);
  }, [ready, id, onDone]);

  // A reminder of how it sounds, once, as the break appears.
  useEffect(() => {
    const timer = window.setTimeout(() => { if (!busy()) say(card); }, 500);
    return () => window.clearTimeout(timer);
  }, [busy, card, say]);

  return (
    <>
      <main className="sp-break lx" data-testid="speak-break">
        <PogoSay mood={live?.mood ?? "wave"} size={compact ? 96 : 140} text={live?.text ?? S.breakTitle} />
        <div className="sp-break-card">
          <PhraseFace card={card} lang={lang} />
          <div className="sp-break-means"><MeaningFace card={card} /></div>
          <Speaker label={LANG.ui.listen} onClick={() => say(card)} disabled={speakBusy(turn.phase)}>{LANG.ui.listen}</Speaker>
        </div>
        <SpeakPanel phase={turn.phase} takes={turn.takes} tapMic={turn.tapMic} replay={turn.replay} levelRef={turn.levelRef} compact={compact} />
        {turn.phase === "idle" && <p className="lx-note">{S.breakHint}</p>}
      </main>
      <footer className="tl-footer">
        <button
          type="button" className={`tbtn tbtn-wide ${turn.takes ? "tbtn-go" : "tbtn-ghost"}`}
          onClick={() => onDone(id)} data-testid="speak-break-go"
        >
          {turn.takes ? S.next : S.notNow}
        </button>
      </footer>
    </>
  );
}
