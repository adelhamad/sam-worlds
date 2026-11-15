// Daily quests state — today's counters, which quests were collected, the
// daily chest and the count of finished quest days. Rides the SettingsRow (no
// Dexie schema bump; the localStorage backup mirrors it). The store calls the
// two `questNote…` hooks from `answer` and `advance`, so every world and
// course feeds the quests without knowing about them.
import { db, logEvent } from "../engine/save/db";
import { todayKey } from "../engine/economy/gifts";
import {
  NO_COUNTERS, QUEST_CHEST_DUST, questDone, questsForDay, type DailyQuest, type QuestCounters,
} from "../engine/quests/daily";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export interface QuestSlice {
  /** Day the counters belong to; a new day starts from zero. */
  questDay: string | null;
  questCounters: QuestCounters;
  /** Ids of today's quests whose reward was collected. */
  questClaimed: string[];
  /** Day the daily quest chest was opened. */
  questChestDay: string | null;
  /** Days on which all three quests were finished. Only ever grows. */
  questDaysDone: number;
  /** Transient: current run of first-try correct answers (feeds the combo quest). */
  questRun: number;

  /** Store hook: an answer was judged. */
  questNoteAnswer: (correct: boolean, firstTry: boolean) => void;
  /** Store hook: a lesson / stage was finished. */
  questNoteStage: (payout: number, perfect: boolean) => void;
  /** Collect a finished quest. Returns the Star Dust paid (0 = nothing to collect). */
  claimQuest: (questId: string) => number;
  /** Open the chest once all three quests are collected. Returns the Star Dust paid. */
  claimQuestChest: () => number;
  // Parent controls
  resetQuestsToday: () => void;
  setQuestDaysDone: (days: number) => void;
}

export const questInitial = {
  questDay: null as string | null,
  questCounters: NO_COUNTERS,
  questClaimed: [] as string[],
  questChestDay: null as string | null,
  questDaysDone: 0,
  questRun: 0,
};

export interface QuestView {
  quests: DailyQuest[];
  counters: QuestCounters;
  claimed: string[];
  /** Every quest collected and the chest not opened yet. */
  chestReady: boolean;
  chestOpened: boolean;
}

/** Today's quests as the home should show them (yesterday's counters never leak in). */
export function questView(state: Pick<GameStore, "questDay" | "questCounters" | "questClaimed" | "questChestDay">, today = todayKey()): QuestView {
  const fresh = state.questDay === today;
  const quests = questsForDay(today);
  const claimed = fresh ? state.questClaimed : [];
  const chestOpened = state.questChestDay === today;
  return {
    quests,
    counters: fresh ? state.questCounters : NO_COUNTERS,
    claimed,
    chestReady: !chestOpened && quests.every((quest) => claimed.includes(quest.id)),
    chestOpened,
  };
}

/** Today's counters, starting from zero on a new day. */
function todays(get: Get): { day: string; counters: QuestCounters; claimed: string[] } {
  const s = get();
  const day = todayKey();
  return s.questDay === day
    ? { day, counters: s.questCounters, claimed: s.questClaimed }
    : { day, counters: NO_COUNTERS, claimed: [] };
}

function pay(set: Set, get: Get, amount: number): void {
  const starDust = get().starDust + amount;
  set({ starDust, hasSave: true });
  void db.economy.put({ id: 1, starDust, melodyShards: 0 });
}

export function questActions(set: Set, get: Get) {
  return {
    questNoteAnswer: (correct: boolean, firstTry: boolean) => {
      const { day, counters, claimed } = todays(get);
      const run = correct && firstTry ? get().questRun + 1 : 0;
      if (!correct || !firstTry) {
        set({ questRun: run });
        return;
      }
      set({
        questDay: day, questClaimed: claimed, questRun: run,
        questCounters: { ...counters, firstTry: counters.firstTry + 1, combo: Math.max(counters.combo, run) },
      });
      persistSettings(get);
    },

    questNoteStage: (payout: number, perfect: boolean) => {
      const { day, counters, claimed } = todays(get);
      set({
        questDay: day, questClaimed: claimed,
        questCounters: {
          ...counters,
          lessons: counters.lessons + 1,
          dust: counters.dust + Math.max(0, payout),
          perfect: counters.perfect + (perfect ? 1 : 0),
        },
      });
      persistSettings(get);
    },

    claimQuest: (questId: string): number => {
      const { day, counters, claimed } = todays(get);
      const quest = questsForDay(day).find((item) => item.id === questId);
      if (!quest || claimed.includes(questId) || !questDone(quest, counters)) return 0;
      set({ questDay: day, questCounters: counters, questClaimed: [...claimed, questId] });
      pay(set, get, quest.reward);
      persistSettings(get);
      logEvent("quest.claim", { questId, dust: quest.reward });
      return quest.reward;
    },

    claimQuestChest: (): number => {
      const s = get();
      const { day, claimed } = todays(get);
      if (s.questChestDay === day || !questsForDay(day).every((quest) => claimed.includes(quest.id))) return 0;
      set({ questChestDay: day, questDaysDone: s.questDaysDone + 1 });
      pay(set, get, QUEST_CHEST_DUST);
      persistSettings(get);
      logEvent("quest.chest", { day, dust: QUEST_CHEST_DUST });
      return QUEST_CHEST_DUST;
    },

    resetQuestsToday: () => {
      set({ questDay: null, questCounters: NO_COUNTERS, questClaimed: [], questChestDay: null, questRun: 0 });
      persistSettings(get);
      logEvent("parent.resetQuests", {});
    },

    setQuestDaysDone: (days: number) => {
      set({ questDaysDone: Math.max(0, Math.round(days)) });
      persistSettings(get);
      logEvent("parent.setQuestDays", { days: get().questDaysDone });
    },
  };
}
