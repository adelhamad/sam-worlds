// Today's three quests as small pills under the "Lesson complete!" stat cards:
// a tick or progress/target each. Quests this lesson just finished pop with a
// "Quest done!" flourish — the reward itself is collected on the home screen.
import { questDone, questProgress } from "../../../engine/quests/daily";
import { questView } from "../../../state/quests";
import { questsDoneAtLessonStart } from "../../../state/questSignals";
import { useGame } from "../../../state/store";
import { HOME } from "../../../strings/home";
import { Icon } from "../../../ui/icons/Icon";
import "./quest-row.css";

export function QuestRow({ stageId, seed }: { stageId: string; seed: number }) {
  const questDay = useGame((s) => s.questDay);
  const questCounters = useGame((s) => s.questCounters);
  const questClaimed = useGame((s) => s.questClaimed);
  const questChestDay = useGame((s) => s.questChestDay);
  const view = questView({ questDay, questCounters, questClaimed, questChestDay });
  const before = questsDoneAtLessonStart(stageId, seed);
  const fresh = new Set(
    view.quests.filter((quest) => before !== null && questDone(quest, view.counters) && !before.includes(quest.id)).map((quest) => quest.id),
  );

  return (
    <section className={`tl-quests ${fresh.size > 0 ? "has-fresh" : ""}`} aria-label={HOME.pogo.questRowLabel}>
      {fresh.size > 0 && (
        <p className="tl-quests-done">
          <b>{HOME.pogo.questRowDone(fresh.size)}</b> {HOME.pogo.questRowCollect(fresh.size)}
        </p>
      )}
      <div className="tl-quests-row">
        {view.quests.map((quest, i) => {
          const done = questDone(quest, view.counters);
          const progress = questProgress(quest, view.counters);
          const isFresh = fresh.has(quest.id);
          const value = `${progress}/${quest.target}`;
          return (
            <div
              key={quest.id}
              className={`tl-quest-pill ${done ? "is-done" : ""} ${isFresh ? "is-fresh" : ""}`}
              style={isFresh ? { animationDelay: `${1300 + i * 200}ms` } : undefined}
              aria-label={`${HOME.quests.quest(quest.kind, quest.target)}: ${done ? HOME.quests.collected : value}`}
            >
              <Icon name={HOME.quests.icon[quest.kind]} size="1.05em" className="tl-quest-icon" />
              <span className="tl-quest-text" aria-hidden="true">
                <span className="tl-quest-label">{HOME.quests.short[quest.kind]}</span>
                <span className="tl-quest-value">{done ? <Icon name="check" size="1em" /> : value}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
