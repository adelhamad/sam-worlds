// lang-chat — a real-life moment as a chat: someone says a line, the child
// builds the reply from a word bank. Several replies can be right; the engine
// decides (chatVerdict). Draft = the verdict of what is placed; CHECK submits.
import { useEffect, useState } from "react";
import { chatVerdict } from "../../../engine/lang/verdicts";
import type { ChatPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { PhraseFace, Script } from "./LangFaces";
import { useVoice } from "./useVoice";

const S = LANG.ui;

export function LangChat({ payload, disabled, onDraft }: WidgetProps<ChatPayload>) {
  const { canSay, say } = useVoice(payload.lang);
  /** Indexes into payload.tiles, in the order they were placed. */
  const [placed, setPlaced] = useState<number[]>([]);
  const texts = placed.map((index) => payload.tiles[index].text);
  useDraft(onDraft, placed.length ? chatVerdict(payload, texts) : null);
  const { line } = payload;
  const audible = canSay(line);

  useEffect(() => {
    if (!line || !audible) return;
    const timer = window.setTimeout(() => say(line), 500);
    return () => window.clearTimeout(timer);
  }, [line, audible, say]);

  const place = (index: number) => {
    if (disabled || placed.includes(index)) return;
    tourSound.place();
    if (payload.tiles[index].say) say(payload.tiles[index].say);
    setPlaced([...placed, index]);
  };
  const takeBack = (index: number) => {
    if (disabled) return;
    tourSound.pop();
    setPlaced(placed.filter((item) => item !== index));
  };
  const dir = payload.rtl ? "rtl" : "ltr";

  return (
    <div className="tx lx lx-chat" data-testid="lang-chat">
      <p className="lx-setup">{payload.setup}</p>
      {line && (
        <div className="lx-chat-row is-them">
          <span className="lx-who">{payload.who?.art && <Icon name={payload.who.art} size="1.3em" />} {payload.who?.name}</span>
          <button type="button" className="lx-bubble" onClick={() => say(line)} aria-label={S.listenAgain}>
            <PhraseFace card={line} lang={payload.lang} />
            <Icon name="sound" size={22} mono />
          </button>
        </div>
      )}
      <div className="lx-chat-row is-me">
        <span className="lx-who">{S.theySay}</span>
        <div className={`lx-built lx-chat-reply ${placed.length ? "" : "is-empty"}`} dir={dir} data-testid="lang-built">
          {placed.map((index) => (
            <button key={index} type="button" className="ttile lx-tile is-placed" disabled={disabled} onClick={() => takeBack(index)}>
              <Script text={payload.tiles[index].text} lang={payload.lang} />
              {payload.tiles[index].roman && <span className="lx-roman">{payload.tiles[index].roman}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="lx-tray" dir={dir}>
        {payload.tiles.map((tile, index) => (
          <button
            key={`${index}-${tile.text}`} type="button" className={`ttile lx-tile ${placed.includes(index) ? "is-used" : ""}`}
            disabled={disabled || placed.includes(index)} data-testid={`lang-tile-${index}`} data-text={tile.text} onClick={() => place(index)}
          >
            <Script text={tile.text} lang={payload.lang} />
            {tile.roman && <span className="lx-roman">{tile.roman}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
