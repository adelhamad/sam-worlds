// "Today" — the daily rhythm in one card: the Daily Gift (when it is ready),
// three quests to collect, and the quest chest. An invitation, never a duty.
import { useState } from "react";
import { tourSfx } from "../../engine/feedback/tourSfx";
import { unlockAudio } from "../../engine/feedback/audio";
import { questDone, questProgress, type DailyQuest } from "../../engine/quests/daily";
import type { QuestView } from "../../state/quests";
import { useGame } from "../../state/store";
import { HOME } from "../../strings/home";
import { DailyGiftBanner } from "../DailyGift";
import { Confetti } from "../tour/Pogo";
import { Icon } from "../icons/Icon";
import { QuestChest } from "./QuestChest";

const T = HOME.quests;

interface QuestRowProps {
  quest: DailyQuest;
  value: number;
  state: "open" | "ready" | "claimed";
  popped: boolean;
  onCollect: (quest: DailyQuest, from: HTMLElement) => void;
}

function QuestRow({ quest, value, state, popped, onCollect }: QuestRowProps) {
  const body = (
    <>
      <span className="quest-icon" aria-hidden="true"><Icon name={T.icon[quest.kind]} size="1em" /></span>
      <span className="quest-body">
        <span className="quest-text">{T.quest(quest.kind, quest.target)}</span>
        <span className="quest-track">
          <span className="quest-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${value / quest.target})` }} />
          </span>
          <span className="quest-count">{value}/{quest.target}</span>
        </span>
      </span>
      {state === "claimed" ? (
        <span className="quest-tick" role="img" aria-label={T.collected}><Icon name="check" size="1em" /></span>
      ) : (
        <span className="quest-reward">
          {state === "ready" && <span className="quest-collect">{T.collect}</span>}
          <span className="quest-dust">{T.reward(quest.reward)} <Icon name="dust" size="1.1em" /></span>
        </span>
      )}
    </>
  );
  const cls = `quest is-${state} ${popped ? "is-popped" : ""}`;
  if (state === "ready") {
    return (
      <li>
        <button type="button" className={cls} data-testid={`quest-${quest.kind}`} onClick={(e) => onCollect(quest, e.currentTarget)}>
          {body}
        </button>
      </li>
    );
  }
  return <li><div className={cls}>{body}</div></li>;
}

export interface QuestCardProps {
  view: QuestView;
  /** Fly Star Dust from an element to the top-bar chip. */
  onDust: (from: HTMLElement | null, amount: number) => void;
  onCelebrate: () => void;
}

export function QuestCard({ view, onDust, onCelebrate }: QuestCardProps) {
  const claimQuest = useGame((s) => s.claimQuest);
  const claimQuestChest = useGame((s) => s.claimQuestChest);
  const daysDone = useGame((s) => s.questDaysDone);
  const [popped, setPopped] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);

  const collect = (quest: DailyQuest, from: HTMLElement) => {
    unlockAudio();
    const paid = claimQuest(quest.id);
    if (!paid) return;
    tourSfx.pop();
    setTimeout(() => tourSfx.dust(), 120);
    setPopped(quest.id);
    onDust(from.querySelector(".quest-dust") ?? from, paid);
  };
  const openChest = (from: HTMLElement) => {
    unlockAudio();
    const paid = claimQuestChest();
    if (!paid) return;
    tourSfx.chest();
    setTimeout(() => tourSfx.cheer(), 450);
    setBurst((n) => n + 1);
    onCelebrate();
    onDust(from.querySelector(".qchest-art") ?? from, paid);
  };

  const rowState = (quest: DailyQuest): QuestRowProps["state"] => {
    if (view.claimed.includes(quest.id)) return "claimed";
    return questDone(quest, view.counters) ? "ready" : "open";
  };

  return (
    <section className="home-card home-today home-rise" style={{ "--i": 2 } as React.CSSProperties}>
      <header className="home-card-head">
        <h2 className="home-h2"><Icon name="star" size="1.1em" /> {T.title}</h2>
      </header>
      <div className="home-gift"><DailyGiftBanner /></div>
      <ul className="quest-list">
        {view.quests.map((quest) => (
          <QuestRow
            key={quest.id}
            quest={quest}
            value={questProgress(quest, view.counters)}
            state={rowState(quest)}
            popped={popped === quest.id}
            onCollect={collect}
          />
        ))}
      </ul>
      <QuestChest
        collected={view.claimed.length}
        ready={view.chestReady}
        opened={view.chestOpened}
        daysDone={daysDone}
        onOpen={openChest}
      />
      <Confetti burstKey={burst} count={48} />
    </section>
  );
}
