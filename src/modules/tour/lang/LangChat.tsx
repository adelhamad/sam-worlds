// lang-chat — a real-life moment as a little phone chat: the moment as a quiet
// scene line, the family member's message arriving after a "typing" beat (and
// spoken once; tap it to hear it again), and the child's own reply bubble that
// fills up as he taps words from the bank. Several replies can be right; the
// engine decides (chatVerdict). Draft = the verdict of what is placed; CHECK
// submits. When the lesson locks the widget the reply takes its "sent" look —
// right or not is the feedback sheet's business, never this widget's.
import { useEffect, useState } from "react";
import { chatVerdict } from "../../../engine/lang/verdicts";
import type { ChatPayload, LangTile } from "../../../engine/lang/types";
import { persona } from "../../../persona.config";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { Avatar } from "../../../ui/lang/Avatar";
import { reducedMotion, tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { PhraseFace, Script } from "./LangFaces";
import { useFlight } from "./useFlight";
import { useVoice } from "./useVoice";
import "./chat.css";

const S = LANG.ui;
/** How long "typing…" shows before the message lands. */
const TYPING_MS = 1100;

function TileFace({ tile, lang }: { tile: LangTile; lang: ChatPayload["lang"] }) {
  return (
    <>
      <Script text={tile.text} lang={lang} />
      {tile.roman && <span className="lx-roman">{tile.roman}</span>}
    </>
  );
}

/** The moment, when nobody speaks: who is there, and what happens. */
function Moment({ payload }: { payload: ChatPayload }) {
  return (
    <div className="lxc-moment">
      {payload.who && <Avatar who={payload.who.name} size={48} className="lxc-avatar" />}
      <p className="lxc-moment-text">
        {payload.who && !payload.setup.includes(payload.who.name) && <span className="lxc-name">{payload.who.name}</span>}
        {payload.setup}
      </p>
    </div>
  );
}

interface IncomingProps {
  payload: ChatPayload;
  arrived: boolean;
  audible: boolean;
  onHear: () => void;
}

/** Their message: avatar, name, and the bubble (three dots while they type). */
function Incoming({ payload, arrived, audible, onHear }: IncomingProps) {
  const name = payload.who?.name ?? "";
  return (
    <div className="lxc-row is-them">
      <Avatar who={name} size={44} className="lxc-avatar" />
      <div className="lxc-col">
        {name && <span className="lxc-name">{name}</span>}
        {arrived && payload.line
          ? (
            <button type="button" className="lxc-in is-arrived" onClick={onHear} aria-label={S.listenAgain} data-testid="lang-chat-line">
              <PhraseFace card={payload.line} lang={payload.lang} />
              {audible && <Icon name="sound" size={20} mono className="lxc-in-sound" />}
            </button>
          )
          : (
            <span className="lxc-in is-typing" role="status" aria-label={S.typing(name)}>
              <i /><i /><i />
            </span>
          )}
      </div>
    </div>
  );
}

export function LangChat({ payload, disabled, onDraft }: WidgetProps<ChatPayload>) {
  const { canSay, say } = useVoice(payload.lang);
  /** Indexes into payload.tiles, in the order they were placed. */
  const [placed, setPlaced] = useState<number[]>([]);
  const texts = placed.map((index) => payload.tiles[index].text);
  useDraft(onDraft, placed.length ? chatVerdict(payload, texts) : null);
  const { line } = payload;
  const audible = canSay(line);
  // The message lands after a short "typing" beat (at once with reduced motion).
  const [arrived, setArrived] = useState(() => !line || reducedMotion());
  const { root, launch } = useFlight<HTMLDivElement>(placed);

  useEffect(() => {
    if (arrived) return;
    const timer = window.setTimeout(() => setArrived(true), TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [arrived]);

  useEffect(() => {
    if (!arrived || !line || !audible) return;
    const timer = window.setTimeout(() => say(line), 250);
    return () => window.clearTimeout(timer);
  }, [arrived, line, audible, say]);

  const place = (index: number, from: Element) => {
    if (disabled || placed.includes(index)) return;
    tourSound.place();
    if (payload.tiles[index].say) say(payload.tiles[index].say);
    launch(from, `[data-chip="${index}"]`);
    setPlaced([...placed, index]);
  };
  const takeBack = (index: number, from: Element) => {
    if (disabled) return;
    tourSound.pop();
    launch(from, `[data-testid="lang-tile-${index}"]`);
    setPlaced(placed.filter((item) => item !== index));
  };
  const dir = payload.rtl ? "rtl" : "ltr";
  const sent = disabled && placed.length > 0;

  return (
    <div ref={root} className={`tx lx lx-chat ${sent ? "is-sent" : ""}`} data-testid="lang-chat">
      <div className="lxc-thread">
        {line ? <p className="lxc-scene">{payload.setup}</p> : <Moment payload={payload} />}
        {line && <Incoming payload={payload} arrived={arrived} audible={audible} onHear={() => say(line)} />}
        <div className="lxc-row is-me">
          <div className="lxc-col">
            <div className={`lxc-out ${placed.length ? "" : "is-empty"}`} dir={dir} data-testid="lang-built">
              {placed.length === 0 && <span className="lxc-turn" dir="ltr">{S.yourTurn}<i className="lxc-caret" /></span>}
              {placed.map((index) => (
                <button
                  key={index} type="button" className="lxc-chip" data-chip={index} disabled={disabled}
                  onClick={(event) => takeBack(index, event.currentTarget)}
                >
                  <TileFace tile={payload.tiles[index]} lang={payload.lang} />
                </button>
              ))}
            </div>
            {sent && <span className="lxc-sent">{S.sent}</span>}
          </div>
          <Avatar who={persona.name} size={40} className="lxc-avatar" />
        </div>
      </div>
      <div className="lx-tray lxc-bank" dir={dir}>
        {payload.tiles.map((tile, index) => (
          <button
            key={`${index}-${tile.text}`} type="button" className={`ttile lx-tile ${placed.includes(index) ? "is-used" : ""}`}
            disabled={disabled || placed.includes(index)} data-testid={`lang-tile-${index}`} data-text={tile.text}
            onClick={(event) => place(index, event.currentTarget)}
          >
            <TileFace tile={tile} lang={payload.lang} />
          </button>
        ))}
      </div>
    </div>
  );
}
