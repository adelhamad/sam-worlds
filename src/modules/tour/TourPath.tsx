// The World Tour path: one winding trail through every unit — lessons, a
// treasure chest per unit, Pogo waiting at the next lesson — plus the passport.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TOUR_COUNTRIES, TOUR_WORLD_ID, stageRoute, type TourUnit } from "../../content/tour/units";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { tourSfx } from "../../engine/feedback/tourSfx";
import { useGame } from "../../state/store";
import { stampedCount } from "../../state/tour";
import { TOUR } from "../../strings/tour";
import { LockedScreen } from "../../ui/LockedScreen";
import { Pogo, PogoSay } from "../../ui/tour/Pogo";
import "../../ui/tour/tour-base.css";
import "./path.css";
import "./path/devHook";
import { ChestNode } from "./path/ChestNode";
import { ChestOpening } from "./path/ChestOpening";
import { prefersReducedMotion, usePathAmp, useToast } from "./path/hooks";
import { buildTourPath, trailPath, type ChestItem, type LessonItem, type TourPathModel } from "./path/layout";
import { LessonPopover } from "./path/LessonPopover";
import { Passport } from "./path/Passport";
import { LessonNode } from "./path/PathNode";
import { UnitBanner } from "./path/UnitBanner";

/** How far Pogo stands from the centre of the lesson he is waiting at. */
const POGO_GAP = 104;

type FocusTarget = { kind: "chest" | "lesson"; id: string } | { kind: "end" };

/** Where the screen scrolls to on arrival: a chest to open, else the next lesson. */
function focusTarget(model: TourPathModel): FocusTarget {
  const chest = model.items.find((item) => item.kind === "chest" && item.state === "ready");
  if (chest) return { kind: "chest", id: chest.unit.id };
  if (model.currentId) return { kind: "lesson", id: model.currentId };
  return { kind: "end" };
}

function scrollToFocus(root: HTMLElement | null, arriving: boolean): number {
  const target = root?.querySelector<HTMLElement>("[data-focus]");
  if (!target) return 0;
  const rect = target.getBoundingClientRect();
  const top = Math.max(0, rect.top + window.scrollY + rect.height / 2 - window.innerHeight * 0.52);
  if (prefersReducedMotion()) {
    window.scrollTo(0, top);
    return 0;
  }
  // On arrival land a little short, then glide the last stretch.
  if (arriving) window.scrollTo(0, Math.max(0, top - 150));
  return requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
}

function Trail({ model, amp }: { model: TourPathModel; amp: number }) {
  const nodes = model.items.filter((item) => item.kind !== "banner");
  const points = nodes.map((item) => ({ x: item.x * amp, y: item.y }));
  const reached = model.finished ? nodes.length : nodes.findIndex((item) => item.kind === "lesson" && item.state === "current") + 1;
  return (
    <svg className="tp-trail-svg" width="1" height={model.height} aria-hidden="true">
      <path className="tp-trail-line" d={trailPath(points)} />
      <path className="tp-trail-line is-walked" d={trailPath(points.slice(0, reached))} />
    </svg>
  );
}

function TopBar({ onPassport }: { onPassport: () => void }) {
  const starDust = useGame((s) => s.starDust);
  const tourDays = useGame((s) => s.tourDays);
  const stamped = useGame((s) => Math.min(TOUR_COUNTRIES.length, stampedCount(s.tourStamps)));
  return (
    <header className="tp-bar">
      <Link to="/hub" className="tbtn tbtn-ghost tp-back" aria-label={TOUR.path.back} onClick={() => sfx.tap()}>
        <span aria-hidden="true">←</span>
        <span className="tp-back-word">{TOUR.path.back}</span>
      </Link>
      <h1 className="tp-title">{TOUR.path.title}</h1>
      <div className="tp-chips">
        <span className="tp-chip tp-chip-dust"><span aria-hidden="true">✨</span> {starDust}</span>
        {tourDays > 0 && (
          <span className="tp-chip tp-chip-day"><span aria-hidden="true">🔥</span> {TOUR.path.day(tourDays)}</span>
        )}
        <button type="button" className="tp-chip tp-chip-pass" aria-label={TOUR.path.passport} onClick={onPassport}>
          <span aria-hidden="true">🛂</span> {stamped}/{TOUR_COUNTRIES.length}
        </button>
      </div>
    </header>
  );
}

function PogoGuide({ item, amp }: { item: LessonItem; amp: number }) {
  const [mood, setMood] = useState<"wave" | "idle">("wave");
  useEffect(() => {
    const timer = window.setTimeout(() => setMood("idle"), 3200);
    return () => window.clearTimeout(timer);
  }, []);
  const side = item.unitIndex % 2 === 0 ? -1 : 1;
  const left = `calc(50% + ${(item.x * amp + side * POGO_GAP).toFixed(1)}px)`;
  return (
    <div className="tp-anchor tp-pogo" style={{ left, top: item.y }}>
      <span className="tp-pogo-hop"><Pogo mood={mood} size={88} /></span>
    </div>
  );
}

export function TourPath() {
  const navigate = useNavigate();
  const enabled = useGame((s) => Boolean(s.enabledWorlds[TOUR_WORLD_ID]));
  const progress = useGame((s) => s.progress);
  const chests = useGame((s) => s.tourChests);
  const session = useGame((s) => s.session);
  const tourOpenChest = useGame((s) => s.tourOpenChest);

  const amp = usePathAmp();
  const [toast, say] = useToast();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [opening, setOpening] = useState<{ unit: TourUnit; paid: number } | null>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const model = useMemo(() => buildTourPath(progress, chests), [progress, chests]);
  const focus = focusTarget(model);
  const current = model.items.find((item): item is LessonItem => item.kind === "lesson" && item.state === "current");
  const picked = model.items.find((item): item is LessonItem => item.kind === "lesson" && item.stage.id === pickedId);

  useEffect(() => {
    if (!enabled) return undefined;
    const frame = scrollToFocus(trailRef.current?.parentElement ?? null, true);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  const openChest = useCallback((item: ChestItem) => {
    unlockAudio();
    tourSfx.pop();
    // The save is updated right here, once; the sequence afterwards is only a show.
    const paid = tourOpenChest(item.unit.id);
    if (paid > 0) setOpening({ unit: item.unit, paid });
  }, [tourOpenChest]);

  /** A locked node or chest was tapped: a little boing and one friendly line. */
  const nudge = (text: string) => {
    unlockAudio();
    tourSfx.hop();
    say(text);
  };

  if (!enabled) return <LockedScreen />;

  return (
    <div className="screen tour tour-path">
      <TopBar onPassport={() => { unlockAudio(); tourSfx.whoosh(); setPassportOpen(true); }} />
      <p className="tp-title-inline" aria-hidden="true">{TOUR.path.title}</p>

      <div className="tp-trail" ref={trailRef} style={{ height: model.height }}>
        <Trail model={model} amp={amp} />
        {model.items.map((item) => {
          if (item.kind === "banner") return <UnitBanner key={item.unit.id} item={item} />;
          if (item.kind === "chest") {
            return (
              <ChestNode
                key={`${item.unit.id}-chest`}
                item={item}
                amp={amp}
                focus={focus.kind === "chest" && focus.id === item.unit.id}
                onOpen={openChest}
                onNudge={nudge}
              />
            );
          }
          return (
            <LessonNode
              key={item.stage.id}
              item={item}
              amp={amp}
              focus={focus.kind === "lesson" && focus.id === item.stage.id}
              onOpen={(lesson) => { unlockAudio(); tourSfx.pop(); setPickedId(lesson.stage.id); }}
              onLocked={() => nudge(TOUR.path.locked)}
            />
          );
        })}
        {current && <PogoGuide key={current.stage.id} item={current} amp={amp} />}
      </div>

      {model.finished && (
        <div className="tp-finish" data-focus={focus.kind === "end" || undefined}>
          <PogoSay mood="cheer" size={112} side="top" text={TOUR.path.finished} />
          <p className="tp-finish-sub">{TOUR.path.finishedSub}</p>
        </div>
      )}

      {picked && (
        <LessonPopover
          item={picked}
          inProgress={Boolean(session && !session.result && session.stageId === picked.stage.id)}
          onClose={() => setPickedId(null)}
          onStart={() => { unlockAudio(); sfx.tap(); navigate(stageRoute(picked.stage.id)); }}
        />
      )}
      {passportOpen && <Passport onClose={() => setPassportOpen(false)} />}
      {opening && (
        <ChestOpening
          unit={opening.unit}
          paid={opening.paid}
          onClose={() => {
            setOpening(null);
            requestAnimationFrame(() => scrollToFocus(trailRef.current?.parentElement ?? null, false));
          }}
        />
      )}
      {toast && <div key={toast.id} className="tp-toast" role="status">{toast.text}</div>}
    </div>
  );
}
