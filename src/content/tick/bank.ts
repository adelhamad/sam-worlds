// Course Kit templates used by Tick Tock's "Parts of the Day" unit (words and
// drawn icons only — no emoji). Every statement is true and has exactly one
// defensible answer; pools follow docs/COURSE_KIT.md §1.2. Template ids are
// referenced by src/content/tick/units.ts; item ids may change freely.
import type { IconName } from "../iconNames";
import type { KitItem, KitTemplate } from "../../engine/kit/types";

const card = (id: string, label: string, icon?: IconName): KitItem => (icon ? { id, label, art: { kind: "icon", name: icon } } : { id, label });
/** Cards from labels: ids are `<prefix>-<n>`. */
const cards = (prefix: string, labels: string[]): KitItem[] => labels.map((label, i) => card(`${prefix}-${i + 1}`, label));

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const short = (day: string) => day.slice(0, 3).toLowerCase();

const BANK: KitTemplate[] = [
  {
    id: "day-parts", kind: "sort",
    prompt: "Morning, afternoon or night?",
    explain: "Morning is when the day starts. Night is when it is dark.",
    buckets: [
      {
        bucket: card("morning", "Morning", "sun"),
        items: [
          card("dp-wake", "Wake up"), card("dp-breakfast", "Eat breakfast"), card("dp-sunrise", "The sun comes up"),
          card("dp-walk", "Walk to school", "school"), card("dp-dress", "Get dressed for the day"),
        ],
      },
      {
        bucket: card("afternoon", "Afternoon"),
        items: [
          card("dp-lunch", "Eat lunch"), card("dp-home", "Come home from school", "bus"), card("dp-play", "Play after lunch"),
          card("dp-snack", "Snack after school"), card("dp-clear", "Clear the lunch table"),
        ],
      },
      {
        bucket: card("night", "Night", "moon"),
        items: [
          card("dp-pyjamas", "Put on pyjamas"), card("dp-stars", "See the stars"), card("dp-sleep", "Go to sleep", "bed"),
          card("dp-story", "Bedtime story"), card("dp-teeth", "Brush teeth for bed", "toothbrush"),
        ],
      },
    ],
  },
  {
    id: "day-order", kind: "order",
    prompt: "Put the day in order, first to last",
    explain: "A day goes morning, then afternoon, then evening, then night.",
    sequences: [
      cards("do-a", ["Wake up", "Eat breakfast", "Go to school", "Eat lunch", "Come home", "Go to bed"]),
      cards("do-b", ["Morning", "Noon", "Afternoon", "Evening", "Night"]),
      cards("do-c", ["6 in the morning", "9 in the morning", "12 noon", "3 in the afternoon", "6 in the evening", "9 at night"]),
      cards("do-d", ["Eat breakfast", "Morning lessons", "Lunch break", "Afternoon lessons", "Walk home"]),
    ],
  },
  {
    id: "am-or-pm", kind: "sort",
    prompt: "Is it A.M. or P.M.?",
    explain: "A.M. is after midnight until noon. P.M. is after noon until midnight.",
    buckets: [
      {
        bucket: card("am", "A.M. (morning)"),
        items: cards("am", ["Breakfast at 7", "School starts at 8", "Wake up at 6:30", "Sunrise at 6", "Walk to school at 7:45", "Morning break at 10"]),
      },
      {
        bucket: card("pm", "P.M. (afternoon and night)"),
        items: cards("pm", ["Lunch at 12:30", "School ends at 3", "Dinner at 6:30", "Sunset at 6", "Bedtime at 8", "Bedtime story at 7:30"]),
      },
    ],
  },
  {
    id: "noon-midnight", kind: "pick", layout: "list",
    prompt: "Which one is true?",
    explain: "Noon is 12 in the middle of the day. Midnight is 12 at night.",
    right: cards("nm-yes", [
      "Noon is 12 in the middle of the day", "Midnight is 12 in the middle of the night",
      "Noon is around lunchtime", "Midnight is late at night", "Noon is 12 o'clock in the daytime",
    ]),
    wrong: cards("nm-no", [
      "Noon is 12 in the middle of the night", "Midnight is 12 in the middle of the day", "Noon is at bedtime",
      "Midnight is around lunchtime", "At noon the stars come out", "At midnight the sun is high",
      "Noon is when we eat breakfast",
    ]),
  },
  {
    id: "week-order", kind: "order",
    prompt: "Monday comes first. Put the days in order.",
    explain: "The week starts on Monday. Say the days in order out loud.",
    sequences: [DAYS.map((day) => card(short(day), day))],
  },
  {
    id: "day-after", kind: "pairs",
    prompt: "Which day comes next? Match them.",
    explain: "After Sunday, a new week starts on Monday.",
    pairs: DAYS.map((day, i) => {
      const next = DAYS[(i + 1) % DAYS.length];
      return { left: card(`after-${short(day)}`, `After ${day}`), right: card(short(next), next) };
    }),
  },
];

/** The bank templates with these ids (unknown ids are skipped). */
export function tickKit(ids: string[]): KitTemplate[] {
  return ids.flatMap((id) => BANK.filter((template) => template.id === id));
}

/** Every template of the bank (the audit checks each one). */
export const TICK_BANK: readonly KitTemplate[] = BANK;
