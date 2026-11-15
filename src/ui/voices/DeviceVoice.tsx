// "The device voice" for one language: which voice the app uses, a Test
// button, a picker over the installed voices (best first, novelty ones last
// and labelled), a speed choice, and how to add a voice when there is none.
import { useEffect, useReducer } from "react";
import type { LangCourseSeed } from "../../content/langCourse";
import { unlockAudio } from "../../engine/feedback/audio";
import { stopClip } from "../../engine/feedback/clips";
import { onVoicesChanged, primeSpeech, rankedVoices, speakIn, voiceFor } from "../../engine/feedback/speech";
import { isNovelty } from "../../engine/feedback/voiceRank";
import { VOICE_SPEEDS } from "../../state/voices";
import { useGame } from "../../state/store";
import { VOICES } from "../../strings/voices";
import { Icon } from "../icons/Icon";
import { samplePhrase } from "./studioData";

const S = VOICES.device;

function voiceLabel(voice: SpeechSynthesisVoice): string {
  const parts = [voice.name, voice.lang, voice.localService ? S.local : S.network];
  if (isNovelty(voice)) parts.push(S.novelty);
  return parts.join(" · ");
}

function HowTo({ noveltyOnly }: { noveltyOnly: boolean }) {
  return (
    <div className="vx-howto" data-testid="vx-howto">
      {noveltyOnly && <p>{S.onlyNovelty}</p>}
      <p><strong>{S.howTo.title}</strong> {S.howTo.steps}</p>
      <p className="dim">{S.howTo.without}</p>
    </div>
  );
}

export function DeviceVoice({ seed }: { seed: LangCourseSeed }) {
  const lang = seed.lang;
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onVoicesChanged(refresh), []);
  const pick = useGame((s) => s.voicePick[lang]);
  const speed = useGame((s) => s.voiceSpeed);
  const setVoicePick = useGame((s) => s.setVoicePick);
  const setVoiceSpeed = useGame((s) => s.setVoiceSpeed);

  const ranked = rankedVoices(lang);
  const current = voiceFor(lang);
  const best = ranked[0];
  const noveltyOnly = ranked.length > 0 && ranked.every((voice) => isNovelty(voice));
  const picked = pick && ranked.some((voice) => voice.voiceURI === pick) ? pick : "";

  const test = () => {
    unlockAudio();
    primeSpeech();
    stopClip();
    speakIn(lang, samplePhrase(seed), false, current);
  };

  return (
    <section className="panel parent-block vx-device" data-testid={`vx-device-${lang}`}>
      <h2>{S.heading}</h2>
      <p className="vx-note">{S.lastResort}</p>
      {current ? (
        <div className="parent-row vx-current">
          <span className="parent-world-name">
            <small className="parent-world-count">{S.uses}</small>
            <span data-testid="vx-current-voice">{voiceLabel(current)}</span>
          </span>
          <button type="button" className="btn btn-compact btn-primary" onClick={test} data-testid="vx-test">
            <Icon name="sound" size={20} mono /> {S.test}
          </button>
        </div>
      ) : (
        <p className="vx-problem">{S.none}</p>
      )}
      {ranked.length > 1 && (
        <label className="vx-field">
          <span className="vx-field-label">{S.choose}</span>
          <select
            className="parent-input vx-select" value={picked} data-testid="vx-pick"
            onChange={(e) => setVoicePick(lang, e.target.value || null)}
          >
            <option value="">{best ? S.auto(best.name) : S.autoNone}</option>
            {ranked.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voiceLabel(voice)}</option>)}
          </select>
        </label>
      )}
      <div className="vx-field">
        <span className="vx-field-label">{S.speed}</span>
        <div className="parent-row">
          {(["slower", "normal"] as const).map((name) => (
            <button
              key={name} type="button" aria-pressed={speed === VOICE_SPEEDS[name]}
              className={`btn btn-compact ${speed === VOICE_SPEEDS[name] ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setVoiceSpeed(VOICE_SPEEDS[name])} data-testid={`vx-speed-${name}`}
            >
              {S[name]}
            </button>
          ))}
        </div>
      </div>
      {(!current || noveltyOnly) && <HowTo noveltyOnly={noveltyOnly} />}
    </section>
  );
}
