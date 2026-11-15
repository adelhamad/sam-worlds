// Which phrase the speaking break asks for, decided when its slot is reached:
// one of the lesson's new phrases (else a review phrase) that can be heard —
// the parent's recording or a device voice — picked by the session seed.
// Null whenever speaking practice is off or the microphone is out this visit,
// so with the switch off a lesson never shows the break.
import type { StageDef } from "../../../content/types";
import { langParams } from "../../../content/langCourse";
import { cardClipKey } from "../../../engine/feedback/clipKeys";
import { hasClip } from "../../../engine/feedback/clips";
import { recordingSupported } from "../../../engine/feedback/recorder";
import { micTrouble } from "../../../engine/feedback/speakBack";
import { voiceFor } from "../../../engine/feedback/speech";
import { phraseCard } from "../../../engine/lang/cards";
import { useGame } from "../../../state/store";
import type { SpeakOffer } from "../lesson/useLessonFlow";

export function speakOfferOf(stage: StageDef): SpeakOffer | undefined {
  if (stage.generator !== "lang") return undefined;
  return () => {
    const game = useGame.getState();
    if (!game.speakPractice || micTrouble() || !recordingSupported()) return null;
    const params = langParams(stage);
    const voiced = voiceFor(params.lang) !== null;
    const audible = (list: typeof params.teach) => list.map(phraseCard).filter((card) => card.say && (voiced || hasClip(cardClipKey(params.lang, card))));
    const teach = audible(params.teach);
    const pool = teach.length ? teach : audible(params.review);
    if (!pool.length) return null;
    const seed = Math.abs(game.session?.seed ?? 0);
    return { lang: params.lang, card: pool[seed % pool.length] };
  };
}
