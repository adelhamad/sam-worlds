// World Tour state — passport stamps, unit chests and tour days. Rides the
// SettingsRow: no Dexie schema bump, and the localStorage
// backup already mirrors it. Lesson progress itself lives in the normal
// `progress` table (tour lessons are ordinary stages).
import { db, logEvent } from "../engine/save/db";
import { todayKey } from "../engine/economy/gifts";
import { courseById, courseUnitById, unitComplete } from "../content/courses";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

/** First-try correct answers a country needs before its passport stamp lands. */
export const STAMP_GOAL = 3;

export interface TourSlice {
  /** First-try correct answers per country code. `>= STAMP_GOAL` = stamped. */
  tourStamps: Record<string, number>;
  /** Unit ids (of any course) whose treasure chest has been opened. */
  tourChests: string[];
  /** Distinct days with a finished lesson. Only ever grows — never a streak to lose. */
  tourDays: number;
  tourLastDay: string | null;

  /** Credit a first-try correct answer. Returns the codes that just got stamped. */
  tourCredit: (codes: string[]) => string[];
  /** Open a finished unit's chest. Returns the Star Dust paid (0 = nothing to open). */
  tourOpenChest: (unitId: string) => number;
  /** Call when a lesson finishes. Returns true when it is the first one today. */
  tourMarkDay: () => boolean;
  // Parent controls
  setTourDays: (days: number) => void;
  resetTourPassport: () => void;
  resetTourChests: () => void;
  /** Close the chests of one course only (the other course keeps its keepsakes). */
  resetCourseChests: (courseId: string) => void;
}

export const tourInitial = {
  tourStamps: {} as Record<string, number>,
  tourChests: [] as string[],
  tourDays: 0,
  tourLastDay: null as string | null,
};

export function stampedCount(stamps: Record<string, number>): number {
  return Object.values(stamps).filter((count) => count >= STAMP_GOAL).length;
}

export function tourActions(set: Set, get: Get) {
  return {
    tourCredit: (codes: string[]): string[] => {
      const stamps = { ...get().tourStamps };
      const fresh: string[] = [];
      for (const code of new Set(codes)) {
        const before = stamps[code] ?? 0;
        stamps[code] = before + 1;
        if (before < STAMP_GOAL && stamps[code] >= STAMP_GOAL) fresh.push(code);
      }
      set({ tourStamps: stamps });
      persistSettings(get);
      if (fresh.length) logEvent("tour.stamp", { codes: fresh });
      return fresh;
    },

    tourOpenChest: (unitId: string): number => {
      const s = get();
      const unit = courseUnitById(unitId);
      if (!unit || s.tourChests.includes(unitId) || !unitComplete(unit, s.progress)) return 0;
      const starDust = s.starDust + unit.chestDust;
      set({ starDust, tourChests: [...s.tourChests, unitId], hasSave: true });
      void db.economy.put({ id: 1, starDust, melodyShards: 0 });
      persistSettings(get);
      logEvent("tour.chest", { unitId, dust: unit.chestDust });
      return unit.chestDust;
    },

    tourMarkDay: (): boolean => {
      const today = todayKey();
      if (get().tourLastDay === today) return false;
      set({ tourDays: get().tourDays + 1, tourLastDay: today });
      persistSettings(get);
      logEvent("tour.day", { days: get().tourDays });
      return true;
    },

    setTourDays: (days: number) => {
      set({ tourDays: Math.max(0, Math.round(days)), tourLastDay: null });
      persistSettings(get);
      logEvent("parent.setTourDays", { days: get().tourDays });
    },

    resetTourPassport: () => {
      set({ tourStamps: {} });
      persistSettings(get);
      logEvent("parent.resetTourPassport", {});
    },

    resetTourChests: () => {
      set({ tourChests: [] });
      persistSettings(get);
      logEvent("parent.resetTourChests", {});
    },

    resetCourseChests: (courseId: string) => {
      const course = courseById(courseId);
      if (!course) return;
      const unitIds = course.units.map((unit) => unit.id);
      set({ tourChests: get().tourChests.filter((id) => !unitIds.includes(id)) });
      persistSettings(get);
      logEvent("parent.resetCourseChests", { courseId });
    },
  };
}
