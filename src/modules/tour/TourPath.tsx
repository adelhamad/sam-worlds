// The path of a Pogo course (World Tour at /tour, Chess Camp at /chess): one
// winding trail through every unit — lessons, a treasure chest per unit, Pogo
// waiting at the next lesson — plus the course's collection (passport / chess set).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { COURSES, stageRoute, type Course, type CourseUnit } from "../../content/courses";
import { TOUR_COUNTRIES } from "../../content/tour/units";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { tourSfx } from "../../engine/feedback/tourSfx";
import { useGame } from "../../state/store";
import { stampedCount } from "../../state/tour";
import { TOUR } from "../../strings/tour";
import { ChessPiece } from "../../ui/chess/ChessPiece";
import { LockedScreen } from "../../ui/LockedScreen";
import { Pogo, PogoSay } from "../../ui/tour/Pogo";
import "../../ui/tour/tour-base.css";
import "./path.css";
import "./path/devHook";
import { ChessSet } from "./path/ChessSet";
import { ChestNode } from "./path/ChestNode";
import { ChestOpening } from "./path/ChestOpening";
import { CourseSwitch } from "./path/CourseSwitch";
import { courseOfPath, courseText } from "./path/courseText";
import { prefersReducedMotion, useOpenCourses, usePathAmp, useToast } from "./path/hooks";
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

/** 12345 → "12k": big Star Dust counts on phones too narrow for every digit. */
function shortCount(value: number): string {
  return value >= 10000 ? `${Math.floor(value / 1000)}k` : String(value);
}

/** The course's collection in the top bar: passport stamps, or chess set keepsakes. */
function CollectionChip({ course, label, onOpen }: { course: Course; label: string; onOpen: () => void }) {
  const chess = course.id === "chess";
  const total = chess ? course.units.length : TOUR_COUNTRIES.length;
  const count = useGame((s) => (chess
    ? course.units.filter((unit) => s.tourChests.includes(unit.id)).length
    : Math.min(total, stampedCount(s.tourStamps))));
  return (
    <button type="button" className="tp-chip tp-chip-pass" data-testid="collection" aria-label={label} onClick={onOpen}>
      {chess
        ? <span className="tp-chip-piece" aria-hidden="true"><ChessPiece type="K" size={24} /></span>
        : <span aria-hidden="true">🛂</span>}
      {count}/{total}
    </button>
  );
}

interface TopBarProps {
  course: Course;
  title: string;
  collection: string;
  /** Courses to hop between; fewer than two = no switch, the title sits in the bar. */
  courses: Course[];
  onCollection: () => void;
}

function TopBar({ course, title, collection, courses, onCollection }: TopBarProps) {
  const starDust = useGame((s) => s.starDust);
  const tourDays = useGame((s) => s.tourDays);
  return (
    <header className="tp-bar">
      <Link to="/hub" className="tbtn tbtn-ghost tp-back" aria-label={TOUR.path.back} onClick={() => sfx.tap()}>
        <span aria-hidden="true">←</span>
        <span className="tp-back-word">{TOUR.path.back}</span>
      </Link>
      {courses.length > 1
        ? <CourseSwitch current={course} courses={courses} />
        : <h1 className="tp-title">{title}</h1>}
      <div className="tp-chips">
        <span className="tp-chip tp-chip-dust" aria-label={String(starDust)}>
          <span aria-hidden="true">✨</span>
          <span className="tp-dust-long" aria-hidden="true">{starDust}</span>
          <span className="tp-dust-short" aria-hidden="true">{shortCount(starDust)}</span>
        </span>
        {tourDays > 0 && (
          <span className="tp-chip tp-chip-day" aria-label={TOUR.path.day(tourDays)}>
            <span aria-hidden="true">🔥</span>
            <span className="tp-day-long" aria-hidden="true">{TOUR.path.day(tourDays)}</span>
            <span className="tp-day-short" aria-hidden="true">{tourDays}</span>
          </span>
        )}
        <CollectionChip course={course} label={collection} onOpen={onCollection} />
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

function CoursePath({ course }: { course: Course }) {
  const navigate = useNavigate();
  const enabled = useGame((s) => Boolean(s.enabledWorlds[course.worldId]));
  const progress = useGame((s) => s.progress);
  const chests = useGame((s) => s.tourChests);
  const session = useGame((s) => s.session);
  const tourOpenChest = useGame((s) => s.tourOpenChest);

  const amp = usePathAmp();
  const [toast, say] = useToast();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [opening, setOpening] = useState<{ unit: CourseUnit; paid: number } | null>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const text = courseText(course);
  // The switch offers this course plus every other one Sam may open right now.
  const openCourses = useOpenCourses();
  const switchCourses = COURSES.filter((other) => other.id === course.id || openCourses.includes(other));
  const hasSwitch = switchCourses.length > 1;
  const model = useMemo(() => buildTourPath(course, progress, chests), [course, progress, chests]);
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
    <div className={`screen tour tour-path ${hasSwitch ? "has-switch" : ""}`} data-course={course.id}>
      <TopBar
        course={course}
        title={text.title}
        collection={text.collection}
        courses={switchCourses}
        onCollection={() => { unlockAudio(); tourSfx.whoosh(); setCollectionOpen(true); }}
      />
      {hasSwitch
        ? <h1 className="tp-title-inline">{text.title}</h1>
        : <p className="tp-title-inline" aria-hidden="true">{text.title}</p>}

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
          <PogoSay mood="cheer" size={112} side="top" text={text.finished} />
          <p className="tp-finish-sub">{text.finishedSub}</p>
        </div>
      )}

      {picked && (
        <LessonPopover
          course={course}
          item={picked}
          inProgress={Boolean(session && !session.result && session.stageId === picked.stage.id)}
          onClose={() => setPickedId(null)}
          onStart={() => { unlockAudio(); sfx.tap(); navigate(stageRoute(picked.stage.id)); }}
        />
      )}
      {collectionOpen && course.id === "chess" && <ChessSet course={course} onClose={() => setCollectionOpen(false)} />}
      {collectionOpen && course.id !== "chess" && <Passport onClose={() => setCollectionOpen(false)} />}
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

/** One screen for every course: the URL says which one (default: World Tour). */
export function TourPath() {
  const { pathname } = useLocation();
  const course = courseOfPath(pathname);
  // Keyed, so hopping to the other course starts its path fresh (scroll focus, open sheets).
  return <CoursePath key={course.id} course={course} />;
}
