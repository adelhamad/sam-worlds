// Small hooks + helpers for the home screen.
import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { todayKey } from "../../engine/economy/gifts";
import { pogoLine, type MotivatorLine } from "../../engine/quests/motivator";
import { questDone } from "../../engine/quests/daily";
import { questView, type QuestView } from "../../state/quests";
import { useGame } from "../../state/store";
import type { Course } from "../../content/courseTypes";
import { devPadCourses } from "./devShelf";
import { courseStatus, daysBetween, focusCourse, nextAction, visibleCourses, type HomeState, type NextAction } from "./nextAction";

/** True while the media query matches (re-renders on change). */
export function useMedia(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** Everything the home reads from the store, as stable references. */
export function useHomeState(): HomeState {
  const progress = useGame((s) => s.progress);
  const session = useGame((s) => s.session);
  const lastStageId = useGame((s) => s.lastStageId);
  const recentWorlds = useGame((s) => s.recentWorlds);
  const tourChests = useGame((s) => s.tourChests);
  const enabledWorlds = useGame((s) => s.enabledWorlds);
  const hiddenWorlds = useGame((s) => s.hiddenWorlds);
  return useMemo(
    () => ({ progress, session, lastStageId, recentWorlds, tourChests, enabledWorlds, hiddenWorlds }),
    [progress, session, lastStageId, recentWorlds, tourChests, enabledWorlds, hiddenWorlds],
  );
}

/** Courses on the shelf (parent-visible; padded with fakes on the DEV bench). */
export function useShelfCourses(state: HomeState): Course[] {
  return useMemo(() => devPadCourses(visibleCourses(state.enabledWorlds, state.hiddenWorlds)), [state.enabledWorlds, state.hiddenWorlds]);
}

/** Today's quests (memoised — `questView` builds new arrays every call). */
export function useQuestView(): QuestView {
  const questDay = useGame((s) => s.questDay);
  const questCounters = useGame((s) => s.questCounters);
  const questClaimed = useGame((s) => s.questClaimed);
  const questChestDay = useGame((s) => s.questChestDay);
  return useMemo(
    () => questView({ questDay, questCounters, questClaimed, questChestDay }),
    [questDay, questCounters, questClaimed, questChestDay],
  );
}

/** The big button + what Pogo says about it. */
export function useNextUp(state: HomeState, courses: Course[], quests: QuestView): { action: NextAction; line: MotivatorLine } {
  const tourLastDay = useGame((s) => s.tourLastDay);
  const [turn] = useState(() => Math.floor(Math.random() * 1_000_000));
  return useMemo(() => {
    const action = nextAction(state, courses);
    const focus = action.course ?? focusCourse(state, courses);
    const statuses = courses.map((course) => ({ course, status: courseStatus(course, state.progress, state.tourChests) }));
    const chest = statuses.find(({ status }) => status.chestUnit);
    const focusStatus = statuses.find(({ course }) => course === focus)?.status;
    const done = quests.quests.filter((quest) => questDone(quest, quests.counters));
    const line = pogoLine({
      hour: new Date().getHours(),
      daysAway: daysBetween(tourLastDay, todayKey()),
      questsToCollect: done.filter((quest) => !quests.claimed.includes(quest.id)).length,
      questsOpen: quests.quests.length - done.length,
      questChestReady: quests.chestReady,
      chestWaitingIn: chest?.course.title ?? null,
      lessonsToChest: focusStatus?.lessonsToChest ?? null,
      nextLesson: action.kind === "continue" ? action.lesson?.name ?? null : null,
      lessonsToday: quests.counters.lessons,
      turn,
    });
    return { action, line };
  }, [state, courses, quests, tourLastDay, turn]);
}

export interface DustFlight {
  id: number;
  amount: number;
  style: CSSProperties & Record<`--${string}`, string>;
}

/** "+7" Star Dust flies from a tapped reward to the Star Dust chip, which then pops. */
export function useDustFly(target: RefObject<HTMLElement>) {
  const [flights, setFlights] = useState<DustFlight[]>([]);
  const [landed, setLanded] = useState(0);
  const nextId = useRef(1);
  const launch = useCallback((from: HTMLElement | null, amount: number) => {
    const to = target.current?.getBoundingClientRect();
    const start = from?.getBoundingClientRect();
    if (!to || !start || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLanded((n) => n + 1);
      return;
    }
    const x = start.left + start.width / 2;
    const y = start.top + start.height / 2;
    const id = nextId.current++;
    const style = {
      left: `${x}px`, top: `${y}px`,
      "--dx": `${Math.round(to.left + to.width / 2 - x)}px`,
      "--dy": `${Math.round(to.top + to.height / 2 - y)}px`,
    };
    setFlights((list) => [...list, { id, amount, style }]);
  }, [target]);
  const land = useCallback((id: number) => {
    setFlights((list) => list.filter((flight) => flight.id !== id));
    setLanded((n) => n + 1);
  }, []);
  return { flights, landed, launch, land };
}

/** Readable ink for text on a course hue: dark on light hues, white on deep ones. */
export function inkOn(hue: string): string {
  const hex = hue.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Number.isFinite(luminance) && luminance < 0.3 ? "#ffffff" : "#0b1533";
}
