// The solved view for the "Almost — look at this." sheet of a language
// question: the right phrase (tap to hear it), what it means, one warm line.
import { langPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import type { TeachProps } from "../exercises/contract";
import { TraceCanvas } from "../../../ui/write/TraceCanvas";
import { MeaningFace, PhraseFace, Speaker } from "./LangFaces";
import { glyphOf } from "./glyphs";
import { useVoice } from "./useVoice";

export function LangTeach({ question }: TeachProps) {
  const payload = langPayload(question);
  const { ready, say } = useVoice(payload?.lang ?? "ar");
  if (!payload) return null;
  const { model, lang } = payload;
  const glyph = payload.tour === "lang-trace" ? glyphOf(payload.letter.char) : null;
  if (glyph) {
    // A missed letter: watch it being written, stroke by stroke.
    return (
      <div className="lx lx-teach" data-testid="lang-teach">
        <TraceCanvas glyph={glyph} disabled maxSize={230} />
        <p className="lx-teach-line">{payload.explain}</p>
      </div>
    );
  }
  return (
    <div className="lx lx-teach" data-testid="lang-teach">
      <div className="lx-teach-card">
        <PhraseFace card={model} lang={lang} />
        {ready && model.say && <Speaker label={LANG.ui.listen} onClick={() => say(model.say)} />}
      </div>
      <div className="lx-teach-means">
        <span className="lx-teach-label">{model.letter ? LANG.meet.soundsLike("") : LANG.ui.means}</span>
        <MeaningFace card={model} />
      </div>
      <p className="lx-teach-line">{payload.explain}</p>
      {payload.tip && <p className="lx-teach-tip">{payload.tip}</p>}
    </div>
  );
}
