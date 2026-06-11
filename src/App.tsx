import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { useGame } from "./state/store";
import { TitleScreen } from "./ui/TitleScreen";
import { Hub } from "./ui/Hub";
import { WorldMap } from "./modules/play/WorldMap";
import { PlayStage } from "./modules/play/PlayStage";
import { CometCatch } from "./modules/cometcatch/CometCatch";
import { CodeQuest } from "./modules/codequest/CodeQuest";
import { ParentSection } from "./ui/ParentSection";
import { MarbleMaze } from "./modules/maze/MarbleMaze";

/** Each screen starts at the top — no inherited scroll position. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { STR } from "./strings/en";
import { unlockAudio } from "./engine/feedback/audio";
import { startMusic } from "./engine/feedback/music";

export default function App() {
  const loaded = useGame((s) => s.loaded);
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // First tap anywhere unlocks audio and starts the background loop.
  useEffect(() => {
    const onFirstTap = () => {
      unlockAudio();
      if (useGame.getState().musicOn) startMusic();
      window.removeEventListener("pointerdown", onFirstTap);
    };
    window.addEventListener("pointerdown", onFirstTap);
    return () => window.removeEventListener("pointerdown", onFirstTap);
  }, []);

  if (!loaded) {
    return (
      <div className="boot-splash">
        <div className="boot-emblem">S</div>
        <div className="boot-title">{STR.gameTitle}</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/world/:worldId" element={<WorldMap />} />
        <Route path="/play/:stageId" element={<PlayStage />} />
        <Route path="/catch" element={<CometCatch />} />
        <Route path="/code" element={<CodeQuest />} />
        <Route path="/maze" element={<MarbleMaze />} />
        <Route path="/parent" element={<ParentSection />} />
      </Routes>
    </HashRouter>
  );
}
