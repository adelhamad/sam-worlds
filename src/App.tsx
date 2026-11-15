import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { COURSES } from "./content/courses";
import { useGame } from "./state/store";
import { TitleScreen } from "./ui/TitleScreen";
import { Hub } from "./ui/Hub";
import { Universe } from "./ui/Universe";
import { PlayRoute, WorldRoute } from "./modules/tour/TourRedirects";
import { ParentSection } from "./ui/ParentSection";
import { ParentAutoLock } from "./ui/ParentGate";
import { VideoCompanion } from "./ui/VideoCompanion";
import { TourPath } from "./modules/tour/TourPath";
import { TourLesson } from "./modules/tour/TourLesson";

// DEV-only labs for the World Tour mascot and exercise widgets.
const PogoLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/PogoLab")) : null;
const ExerciseLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/ExerciseLab")) : null;
const ChessLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/ChessLab")) : null;
const KitLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/KitLab")) : null;
const LangLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/LangLab")) : null;
const CodeLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/CodeLab")) : null;
const TickLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/TickLab")) : null;
const IconLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/IconLab")) : null;
// Parent Section → Voices (device voice + the parent's recordings), loaded on demand.
const VoicesPage = lazy(() => import("./ui/voices/VoicesPage").then((m) => ({ default: m.VoicesPage })));
const WriteLab = import.meta.env.DEV ? lazy(() => import("./modules/tour/dev/WriteLab")) : null;

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
import { loadClipIndex, primeClips } from "./engine/feedback/clips";
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
    // The parent's recordings: know which exist before any lesson asks.
    void loadClipIndex();
  }, [hydrate]);

  // Native feel: no long-press context menus anywhere.
  useEffect(() => {
    const onContextMenu = (e: Event) => e.preventDefault();
    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

  // The parent's recordings play through one <audio> element, which iOS only
  // lets play on its own after it has played inside a tap. A touch's
  // pointerdown is not such a tap; a click is. (Stops once primed.)
  useEffect(() => {
    const onClick = () => primeClips();
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
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
      <ParentAutoLock />
      <VideoCompanion />
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/universe" element={<Universe />} />
        <Route path="/world/:worldId" element={<WorldRoute />} />
        <Route path="/play/:stageId" element={<PlayRoute />} />
        {/* Every course gets its path and lesson routes from the registry. */}
        {COURSES.flatMap((course) => [
          <Route key={course.path} path={course.path} element={<TourPath />} />,
          <Route key={`${course.path}/lesson`} path={`${course.path}/lesson/:stageId`} element={<TourLesson />} />,
        ])}
        {KitLab && <Route path="/tour/lab/kit" element={<Suspense fallback={null}><KitLab /></Suspense>} />}
        {LangLab && <Route path="/tour/lab/lang" element={<Suspense fallback={null}><LangLab /></Suspense>} />}
        {CodeLab && <Route path="/tour/lab/code" element={<Suspense fallback={null}><CodeLab /></Suspense>} />}
        {TickLab && <Route path="/tour/lab/tick" element={<Suspense fallback={null}><TickLab /></Suspense>} />}
        {IconLab && <Route path="/tour/lab/icons" element={<Suspense fallback={null}><IconLab /></Suspense>} />}
        {WriteLab && <Route path="/tour/lab/write" element={<Suspense fallback={null}><WriteLab /></Suspense>} />}
        {ChessLab && <Route path="/tour/lab/chess" element={<Suspense fallback={null}><ChessLab /></Suspense>} />}
        {PogoLab && ExerciseLab && (
          <>
            <Route path="/tour/lab/pogo" element={<Suspense fallback={null}><PogoLab /></Suspense>} />
            <Route path="/tour/lab/exercises" element={<Suspense fallback={null}><ExerciseLab /></Suspense>} />
          </>
        )}
        <Route path="/parent" element={<ParentSection />} />
        <Route path="/parent/voices" element={<Suspense fallback={null}><VoicesPage /></Suspense>} />
      </Routes>
    </HashRouter>
  );
}
