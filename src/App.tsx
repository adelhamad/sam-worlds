import { useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { useGame } from "./state/store";
import { TitleScreen } from "./ui/TitleScreen";
import { Hub } from "./ui/Hub";
import { WorldMap } from "./modules/play/WorldMap";
import { PlayStage } from "./modules/play/PlayStage";
import { ParentSection } from "./ui/ParentSection";
import { VideoCompanion } from "./ui/VideoCompanion";

/** Each screen starts at the top — no inherited scroll position. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Native-app feel: browser back/forward (iPad edge-swipe, Android back
 * gesture) is neutralized by keeping a duplicate history entry on top —
 * popping it lands on an identical URL, so nothing changes on screen.
 * All navigation goes through the in-app buttons.
 */
function BlockBrowserNav() {
  const location = useLocation();
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
  }, [location]);
  useEffect(() => {
    const onPop = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return null;
}
import { STR } from "./strings/en";
import { unlockAudio } from "./engine/feedback/audio";
import { startMusic } from "./engine/feedback/music";
import { keepScreenAwake } from "./engine/wakeLock";
import { armReminders } from "./engine/notify/reminders";

export default function App() {
  const loaded = useGame((s) => s.loaded);
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    // Re-arm encouragement reminders relative to this visit (they fire ~6h
    // apart afterwards, even with the app closed).
    void hydrate().then(() => {
      if (useGame.getState().remindersOn) void armReminders(Date.now());
    });
    keepScreenAwake();
  }, [hydrate]);

  // Native feel: no long-press context menus anywhere.
  useEffect(() => {
    const onContextMenu = (e: Event) => e.preventDefault();
    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

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
      <BlockBrowserNav />
      <VideoCompanion />
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/world/:worldId" element={<WorldMap />} />
        <Route path="/play/:stageId" element={<PlayStage />} />
        <Route path="/parent" element={<ParentSection />} />
      </Routes>
    </HashRouter>
  );
}
