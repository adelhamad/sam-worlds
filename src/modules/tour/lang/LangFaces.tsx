// The faces every language widget is made of: a phrase in its own writing
// (with its Latin spelling under it), a meaning (English + picture), and the
// round speaker button.
import type { LangCard, LangCode } from "../../../engine/lang/types";
import { Icon } from "../../../ui/icons/Icon";

const DIR: Record<LangCode, "rtl" | "ltr"> = { ar: "rtl", fr: "ltr" };

/** The words in the language's own writing. */
export function Script({ text, lang, className = "" }: { text: string; lang: LangCode; className?: string }) {
  return <span className={`lx-script is-${lang} ${className}`} lang={lang} dir={DIR[lang]}>{text}</span>;
}

/** A phrase (or a letter): its writing, and how it sounds in Latin letters. */
export function PhraseFace({ card, lang, noRoman = false }: { card: LangCard; lang: LangCode; noRoman?: boolean }) {
  return (
    <span className={`lx-face lx-phrase ${card.letter ? "is-letter" : ""}`}>
      <Script text={card.text} lang={lang} />
      {card.roman && !noRoman && <span className="lx-roman">{card.roman}</span>}
    </span>
  );
}

/** What it means: a picture when there is one, and the English. */
export function MeaningFace({ card }: { card: LangCard }) {
  return (
    <span className="lx-face lx-meaning">
      {card.art && <Icon name={card.art} size="1.9em" className="lx-art" />}
      <span className="lx-en">{card.en}</span>
    </span>
  );
}

interface SpeakerProps {
  label: string;
  onClick: () => void;
  /** "big" is the hero of a listening question. */
  size?: "big" | "small";
  disabled?: boolean;
  testId?: string;
  children?: React.ReactNode;
}

export function Speaker({ label, onClick, size = "small", disabled = false, testId, children }: SpeakerProps) {
  return (
    <button type="button" className={`lx-speaker is-${size}`} aria-label={label} onClick={onClick} disabled={disabled} data-testid={testId}>
      <Icon name="sound" size={size === "big" ? 54 : 26} mono />
      {children}
    </button>
  );
}
