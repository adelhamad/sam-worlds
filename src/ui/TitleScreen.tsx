import { useNavigate } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, focusWorld } from "../content/worlds";
import { cliffhanger } from "../engine/missions/missions";
import { unlockAudio, sfx } from "../engine/feedback/audio";
import { MUSIC_CREDIT, startMusic } from "../engine/feedback/music";
import { STR } from "../strings/en";

const DECOR = [
  { icon: "🪐", left: "8%", top: "14%", delay: "0s" },
  { icon: "🚀", left: "84%", top: "20%", delay: "0.8s" },
  { icon: "⭐", left: "16%", top: "72%", delay: "1.4s" },
  { icon: "🌙", left: "78%", top: "70%", delay: "0.4s" },
  { icon: "☄️", left: "60%", top: "8%", delay: "1.1s" },
];

export function TitleScreen() {
  const navigate = useNavigate();
  const hasSave = useGame((s) => s.hasSave);
  const session = useGame((s) => s.session);
  const progress = useGame((s) => s.progress);

  const resumeMidPuzzle = session && !session.result;

  function go() {
    unlockAudio();
    if (useGame.getState().musicOn) startMusic();
    sfx.tap();
    navigate(resumeMidPuzzle ? `/play/${session.stageId}` : "/hub");
  }

  return (
    <div className="screen title-screen">
      {DECOR.map((d) => (
        <span
          key={d.icon}
          className="title-decor"
          style={{ left: d.left, top: d.top, animationDelay: d.delay }}
          aria-hidden
        >
          {d.icon}
        </span>
      ))}
      <h1 className="game-title">
        {STR.gameTitle.split(" ").map((word, wi) => (
          <span key={wi} className="title-word">
            {word.split("").map((ch, i) => (
              <span key={i} style={{ animationDelay: `${(wi * 6 + i) * 60}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <p className="title-sub">{hasSave ? STR.welcomeBack : STR.newAdventure}</p>
      {hasSave && (
        <p className="title-cliffhanger">
          “{cliffhanger(focusWorld(progress).id, completedInWorld(focusWorld(progress), progress))}”
        </p>
      )}
      <button className="btn btn-primary btn-big" onClick={go}>
        {hasSave ? STR.continueBtn : STR.startBtn}
      </button>
      <span className="music-credit">{MUSIC_CREDIT}</span>
    </div>
  );
}
