import { useState } from "react";
import { COURSES, type Course } from "../../content/courses";
import { TOUR_COUNTRIES } from "../../content/tour/units";
import { QUEST_CHEST_DUST, questDone, questProgress } from "../../engine/quests/daily";
import { questView, type QuestView } from "../../state/quests";
import { useGame } from "../../state/store";
import { HOME } from "../../strings/home";
import { STAMP_GOAL } from "../../state/tour";
import { TOUR } from "../../strings/tour";
import { Glyph, Icon } from "../icons/Icon";

// ParentSection draws world icons through this re-export (it is at its line cap).
export { Glyph };

type Pending = "passport" | "chests" | null;

function chestsOpened(course: Course, opened: string[]): number {
  return course.units.filter((unit) => opened.includes(unit.id)).length;
}

/** One line per course: lessons, chests and (geography) passport stamps. */
function CourseSummary({ course }: { course: Course }) {
  const progress = useGame((s) => s.progress);
  const tourStamps = useGame((s) => s.tourStamps);
  const tourChests = useGame((s) => s.tourChests);
  const stages = course.world.stages;
  const lessons = stages.filter((stage) => progress[stage.id]?.completed).length;
  const stamps = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) >= STAMP_GOAL).length;
  const started = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) > 0).length - stamps;
  return (
    <p className="dim">
      <strong>{course.title}</strong>
      {" — "}
      {TOUR.parent.course(lessons, stages.length, chestsOpened(course, tourChests), course.units.length)}
      {course.id === "tour" && ` · ${TOUR.parent.stamps(stamps, TOUR_COUNTRIES.length)}`}
      {course.id === "tour" && started > 0 && ` · ${started} more on the way to a stamp`}
    </p>
  );
}

function chestState(view: QuestView): string {
  if (view.chestOpened) return "opened today";
  if (view.chestReady) return "ready to open on the home screen";
  return "opens once all three are collected";
}

function questState(done: boolean, claimed: boolean): string {
  if (claimed) return "collected";
  if (done) return "done — waiting to be collected at home";
  return "in progress";
}

/** Today's three quests with progress, collected state and the chest. */
function QuestToday() {
  const questDay = useGame((s) => s.questDay);
  const questCounters = useGame((s) => s.questCounters);
  const questClaimed = useGame((s) => s.questClaimed);
  const questChestDay = useGame((s) => s.questChestDay);
  const view = questView({ questDay, questCounters, questClaimed, questChestDay });
  const chest = chestState(view);
  return (
    <>
      {view.quests.map((quest) => {
        const state = questState(questDone(quest, view.counters), view.claimed.includes(quest.id));
        return (
          <p key={quest.id} className="dim">
            <Icon name={HOME.quests.icon[quest.kind]} size="1.1em" /> <strong>{HOME.quests.quest(quest.kind, quest.target)}</strong>
            {" — "}
            {questProgress(quest, view.counters)}/{quest.target} · {state} · +{quest.reward} Star Dust
          </p>
        );
      })}
      <p className="dim"><Icon name="chest" size="1.1em" /> Quest chest (+{QUEST_CHEST_DUST} Star Dust): {chest}.</p>
    </>
  );
}

/** Daily quests: view today, set the quest-days count, reset today (confirm step). */
function QuestControls() {
  const questDaysDone = useGame((s) => s.questDaysDone);
  const setQuestDaysDone = useGame((s) => s.setQuestDaysDone);
  const resetQuestsToday = useGame((s) => s.resetQuestsToday);
  const [daysInput, setDaysInput] = useState(String(questDaysDone));
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <h3>Daily quests</h3>
      <p className="dim">
        Three small goals a day, the same all day and picked from the date (every world and course counts).
        Rewards are collected on the home screen; nothing is lost by skipping a day.
      </p>
      <QuestToday />
      <p className="dim">Quest days: {questDaysDone} (days with all three quests done — only ever grows, not a streak)</p>
      <div className="parent-row">
        <span className="parent-world-name">Set quest days</span>
        <input
          className="parent-input parent-input-sm"
          type="number"
          min={0}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setQuestDaysDone(Number(daysInput) || 0)}>
          Set
        </button>
      </div>
      {confirming ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetQuestsToday(); setConfirming(false); }}>
            Yes, reset today’s quests
          </button>
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setConfirming(true)}>Reset today’s quests…</button>
        </div>
      )}
      <p className="dim">
        Resetting sets today’s quest progress back to zero and un-collects them (the chest closes too), so he
        can earn them again. Star Dust already collected is kept.
      </p>
    </>
  );
}

/** Plain-English note on what reminders can and cannot do on each device. */
function ReminderNote() {
  return (
    <>
      <h3>Reminders and the app badge</h3>
      <p className="dim">
        Friendly notifications about Pogo, the courses and today’s quests: at most two a day (about 10:30 and
        16:30), never before 8:00 or after 19:30, and none for the rest of a day once he has finished a lesson.
        The on/off switch is under “Encouragement reminders”.
      </p>
      <p className="dim">
        They are scheduled on this device, which needs the browser’s “Notification Triggers” feature. No
        browser ships it today (Chrome only had it as a trial), so the switch usually stays off and says this
        device can’t — the app is ready if a browser ever turns it on. The app-icon badge works now on installed
        apps (Android / desktop Chrome, and iPad / iPhone added to the home screen): a number when a quest prize,
        the quest chest or the daily gift is waiting. On iPad / iPhone, tap the reminders switch once and allow
        notifications so the badge can show; the switch itself stays off there.
      </p>
      <p className="dim">Real push notifications would need a small server — see docs/NOTIFICATIONS.md.</p>
    </>
  );
}

/** Controls for Pogo's courses (CLAUDE.md rule 2: persisted state needs view/edit/reset). */
export function TourControls() {
  const tourChests = useGame((s) => s.tourChests);
  const tourDays = useGame((s) => s.tourDays);
  const setTourDays = useGame((s) => s.setTourDays);
  const resetTourPassport = useGame((s) => s.resetTourPassport);
  const resetCourseChests = useGame((s) => s.resetCourseChests);
  const [daysInput, setDaysInput] = useState(String(tourDays));
  const [pending, setPending] = useState<Pending>(null);

  const ranges = COURSES.map((course) => `${course.title} 0–${course.world.stages.length}`).join(", ");
  const names = COURSES.map((course) => course.title).join(" or ");

  return (
    <section className="panel parent-block">
      <h2>{TOUR.parent.heading}</h2>
      {COURSES.map((course) => <CourseSummary key={course.id} course={course} />)}
      <p className="dim">{TOUR.parent.days(tourDays)}</p>
      <p className="dim">
        Lesson progress is set under “World progress” ({ranges}); lock or hide {names} in the world access
        controls like any other world — a locked or hidden course leaves the hub banner. A passport stamp needs{" "}
        {STAMP_GOAL} first-try answers. Tour days only ever grow — a count of days played, not a streak.
      </p>
      <div className="parent-row">
        <span className="parent-world-name">Set tour days</span>
        <input
          className="parent-input parent-input-sm"
          type="number"
          min={0}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setTourDays(Number(daysInput) || 0)}>
          Set
        </button>
      </div>
      {pending === "passport" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetTourPassport(); setPending(null); }}>
            Yes, clear all stamps
          </button>
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("passport")}>Reset passport stamps…</button>
        </div>
      )}
      {pending === "chests" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          {COURSES.map((course) => (
            <button
              key={course.id}
              className="btn btn-danger"
              disabled={chestsOpened(course, tourChests) === 0}
              onClick={() => { resetCourseChests(course.id); setPending(null); }}
            >
              Yes, close {course.title} chests ({chestsOpened(course, tourChests)})
            </button>
          ))}
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("chests")}>Reset treasure chests…</button>
        </div>
      )}
      <p className="dim">
        Resetting chests closes them again for that course only, so he can re-open each finished unit’s chest and
        collect its Star Dust once more. Star Dust already earned is kept.
      </p>
      <QuestControls />
      <ReminderNote />
    </section>
  );
}
