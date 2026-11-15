// The small daily quest chest: three slots fill as quests are collected; when
// all three are in, it wiggles and opens for a fixed bonus. Once open it rests
// with a warm "see you tomorrow" — no clock, nothing to lose.
import { QUEST_CHEST_DUST, QUESTS_PER_DAY } from "../../engine/quests/daily";
import { HOME } from "../../strings/home";
import { Icon } from "../icons/Icon";

const T = HOME.quests;
const LINE = "#2a1606";

export function ChestArt({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="qchest-svg" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="92" rx="34" ry="5" fill="rgba(6,10,38,0.3)" />
      {open && <circle cx="50" cy="50" r="30" fill="#ffe7a3" opacity="0.5" className="qchest-glow" />}
      {/* body */}
      <rect x="16" y="48" width="68" height="40" rx="8" fill="#b8692a" stroke={LINE} strokeWidth="5" />
      <rect x="16" y="58" width="68" height="8" fill="#ffd166" stroke={LINE} strokeWidth="4" />
      <rect x="44" y="55" width="12" height="16" rx="3" fill="#ffd166" stroke={LINE} strokeWidth="4" />
      {open ? (
        <>
          <path d="M 18 48 L 24 26 Q 50 18 76 26 L 82 48 Z" fill="#8a4a1a" stroke={LINE} strokeWidth="5" strokeLinejoin="round" />
          <path d="M 30 40 L 40 30 M 56 30 L 68 40" stroke="#fff6cf" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="38" r="6" fill="#fff6cf" />
        </>
      ) : (
        <path d="M 16 50 L 16 40 Q 16 22 50 22 Q 84 22 84 40 L 84 50 Z" fill="#cf7c34" stroke={LINE} strokeWidth="5" strokeLinejoin="round" />
      )}
      <path d="M 24 76 L 24 80" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export interface QuestChestProps {
  collected: number;
  ready: boolean;
  opened: boolean;
  daysDone: number;
  onOpen: (from: HTMLElement) => void;
}

export function QuestChest({ collected, ready, opened, daysDone, onOpen }: QuestChestProps) {
  let text: string = T.chestHint;
  if (ready) text = T.chestReady;
  if (opened) text = T.chestOpened;
  const slots = Array.from({ length: QUESTS_PER_DAY }, (_, i) => i < collected || opened);
  const body = (
    <>
      <span className="qchest-art"><ChestArt open={opened} /></span>
      <span className="qchest-text">
        <span className="qchest-title">{text}</span>
        <span className="qchest-slots" aria-hidden="true">
          {slots.map((on, i) => <span key={i} className={`qchest-slot ${on ? "is-on" : ""}`}>{on ? <Icon name="star" size="1em" /> : ""}</span>)}
          {!opened && <span className="qchest-prize">+{QUEST_CHEST_DUST} <Icon name="dust" size="1.1em" /></span>}
        </span>
        {daysDone > 0 && <span className="qchest-days">{T.daysDone(daysDone)}</span>}
      </span>
    </>
  );
  if (ready) {
    return (
      <button type="button" className="qchest is-ready" data-testid="quest-chest" onClick={(e) => onOpen(e.currentTarget)}>
        {body}
      </button>
    );
  }
  return <div className={`qchest ${opened ? "is-opened" : ""}`}>{body}</div>;
}
