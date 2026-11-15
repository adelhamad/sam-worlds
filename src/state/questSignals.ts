// Quest signals — a tiny module-level bridge started once from main.tsx. It
// watches the store and the page visibility and:
//   (a) keeps the app-icon badge in sync with "something good is waiting"
//       (a quest to collect, the quest chest, today's daily gift);
//   (b) re-arms the reminders with fresh context after a finished lesson and
//       whenever the app goes to the background (only when `remindersOn`);
//   (c) remembers which quests were already done when a lesson started, so the
//       "Lesson complete!" quest row can pop the ones this lesson finished.
// Debounced, never throws, does nothing before the store has loaded.
import { courseOfStage, COURSES, lessonPlayable, unitComplete, type Course } from "../content/courses";
import { giftReady, todayKey } from "../engine/economy/gifts";
import { badgeCount, setBadge } from "../engine/notify/badge";
import { armReminders, setReminderContextSource, type ReminderContext } from "../engine/notify/reminders";
import { questDone } from "../engine/quests/daily";
import { questView } from "./quests";
import { useGame, type GameStore } from "./store";

const BADGE_DEBOUNCE_MS = 400;
const ARM_DEBOUNCE_MS = 1500;

type State = GameStore;

function courseOpen(s: State, course: Course): boolean {
  return s.enabledWorlds[course.worldId] !== false && !s.hiddenWorlds[course.worldId];
}

/** Quest ids already finished today (collected or not). */
export function doneQuestIds(s: State, today = todayKey()): string[] {
  const view = questView(s, today);
  return view.quests.filter((quest) => questDone(quest, view.counters)).map((quest) => quest.id);
}

function lessonsToday(s: State, today = todayKey()): number {
  return s.questDay === today ? s.questCounters.lessons : 0;
}

/** Title of the lesson the Continue button would start in the last-played course. */
export function nextLessonTitle(s: State): string | null {
  const course = s.lastStageId ? courseOfStage(s.lastStageId) : undefined;
  if (!course || !courseOpen(s, course)) return null;
  const next = course.world.stages.find((stage) => !s.progress[stage.id]?.completed && lessonPlayable(course, stage.id, s.progress));
  return next?.name ?? null;
}

/** First course (in registry order) with a finished unit whose chest is still closed. */
export function chestWaitingCourse(s: State): Course | null {
  return (
    COURSES.find((course) =>
      courseOpen(s, course) && course.units.some((unit) => unitComplete(unit, s.progress) && !s.tourChests.includes(unit.id)),
    ) ?? null
  );
}

export function reminderContext(s: State): ReminderContext {
  const today = todayKey();
  const view = questView(s, today);
  return {
    questsOpenToday: view.quests.filter((quest) => !questDone(quest, view.counters)).length,
    nextLesson: nextLessonTitle(s),
    chestWaiting: chestWaitingCourse(s) !== null,
    playedToday: lessonsToday(s, today) > 0,
  };
}

function badgeFor(s: State): number {
  const view = questView(s);
  const toCollect = view.quests.filter((quest) => questDone(quest, view.counters) && !view.claimed.includes(quest.id)).length;
  return badgeCount({ questsToCollect: toCollect, questChestReady: view.chestReady, giftReady: giftReady(s.lastGiftDay) });
}

// ── (c) quests done when the current lesson started ─────────────────────────
let baseline: { key: string; done: string[] } | null = null;

function sessionKey(s: State): string | null {
  return s.session && !s.session.result ? `${s.session.stageId}:${s.session.seed}` : null;
}

/** Quest ids that were already done when the lesson `stageId`/`seed` began (null = unknown). */
export function questsDoneAtLessonStart(stageId: string, seed: number): string[] | null {
  return baseline?.key === `${stageId}:${seed}` ? baseline.done : null;
}

// ── wiring ──────────────────────────────────────────────────────────────────
let started = false;
let badgeTimer: ReturnType<typeof setTimeout> | null = null;
let armTimer: ReturnType<typeof setTimeout> | null = null;

function safely(work: () => void): void {
  try {
    work();
  } catch {
    // Signals are a nicety — never break the game over them.
  }
}

function syncBadge(): void {
  safely(() => {
    const s = useGame.getState();
    if (s.loaded) setBadge(badgeFor(s));
  });
}

function rearm(): void {
  safely(() => {
    const s = useGame.getState();
    if (s.loaded && s.remindersOn) void armReminders(Date.now(), reminderContext(s));
  });
}

function later(timer: ReturnType<typeof setTimeout> | null, ms: number, work: () => void): ReturnType<typeof setTimeout> {
  if (timer) clearTimeout(timer);
  return setTimeout(work, ms);
}

function onChange(state: State, prev: State): void {
  if (!state.loaded) return;
  const key = sessionKey(state);
  if (key && key !== sessionKey(prev) && baseline?.key !== key) baseline = { key, done: doneQuestIds(state) };
  badgeTimer = later(badgeTimer, BADGE_DEBOUNCE_MS, syncBadge);
  if (lessonsToday(state) > lessonsToday(prev)) armTimer = later(armTimer, ARM_DEBOUNCE_MS, rearm);
}

function onVisibility(): void {
  if (document.visibilityState !== "hidden") {
    syncBadge(); // a new day may have brought a fresh gift
    return;
  }
  // Leaving: settle now, the page may be frozen any moment.
  if (badgeTimer) clearTimeout(badgeTimer);
  if (armTimer) clearTimeout(armTimer);
  syncBadge();
  rearm();
}

export function startQuestSignals(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  safely(() => {
    setReminderContextSource(() => {
      const s = useGame.getState();
      return s.loaded ? reminderContext(s) : undefined;
    });
    useGame.subscribe((state, prev) => safely(() => onChange(state, prev)));
    document.addEventListener("visibilitychange", onVisibility);
  });
}
