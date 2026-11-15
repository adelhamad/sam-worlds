// lang-build — tap tiles in order: the words of a sentence, or the letters of
// one word (the line then shows them joined, so Arabic letters connect the way
// they do in real writing). Tap a placed word to take it back; the undo button
// takes the last tile back. Draft = buildAnswer(placed, unit); CHECK submits.
import { useState } from "react";
import { buildAnswer } from "../../../engine/lang/answers";
import type { BuildPayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { MeaningFace, Script, Speaker } from "./LangFaces";
import { useVoice } from "./useVoice";

const S = LANG.ui;

export function LangBuild({ payload, disabled, onDraft }: WidgetProps<BuildPayload>) {
  const { ready, say } = useVoice(payload.lang);
  /** Indexes into payload.tiles, in the order they were placed. */
  const [placed, setPlaced] = useState<number[]>([]);
  const letters = payload.unit === "letter";
  const texts = placed.map((index) => payload.tiles[index].text);
  useDraft(onDraft, placed.length >= 2 ? buildAnswer(texts, payload.unit) : null);

  const place = (index: number) => {
    if (disabled || placed.includes(index)) return;
    tourSound.place();
    const tile = payload.tiles[index];
    if (tile.say) say(tile.say);
    setPlaced([...placed, index]);
  };
  const takeBack = (index: number) => {
    if (disabled) return;
    tourSound.pop();
    setPlaced(placed.filter((item) => item !== index));
  };
  const undo = () => {
    if (!disabled && placed.length) takeBack(placed[placed.length - 1]);
  };
  const dir = payload.rtl ? "rtl" : "ltr";

  return (
    <div className={`tx lx lx-build is-${payload.unit}`} data-testid="lang-build" data-unit={payload.unit}>
      <div className="lx-hero is-mean">
        <MeaningFace card={payload.hero} />
        {letters && ready && <Speaker label={S.listen} onClick={() => say(payload.hero.say)} testId="lang-hear" />}
      </div>
      <p className="lx-help">{letters ? S.spellHelp : S.buildHelp}</p>
      <div className="lx-line-row">
        <div className={`lx-built ${placed.length ? "" : "is-empty"}`} dir={dir} data-testid="lang-built">
          {letters
            ? <Script text={texts.join("")} lang={payload.lang} className="lx-built-word" />
            : placed.map((index) => (
              <button key={index} type="button" className="ttile lx-tile is-placed" disabled={disabled} onClick={() => takeBack(index)}>
                <Script text={payload.tiles[index].text} lang={payload.lang} />
                {payload.tiles[index].roman && <span className="lx-roman">{payload.tiles[index].roman}</span>}
              </button>
            ))}
        </div>
        <button type="button" className="lx-undo" aria-label={S.undo} disabled={disabled || !placed.length} onClick={undo} data-testid="lang-undo">
          <Icon name="back" size={24} mono />
        </button>
      </div>
      <div className="lx-tray" dir={dir}>
        {payload.tiles.map((tile, index) => (
          <button
            key={`${index}-${tile.text}`} type="button"
            className={`ttile lx-tile ${letters ? "is-letter" : ""} ${placed.includes(index) ? "is-used" : ""}`}
            disabled={disabled || placed.includes(index)} data-testid={`lang-tile-${index}`} data-text={tile.text}
            onClick={() => place(index)}
          >
            <Script text={tile.text} lang={payload.lang} />
            {tile.roman && <span className="lx-roman">{tile.roman}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
