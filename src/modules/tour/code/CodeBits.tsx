// Small shared pieces of the Code Lab widgets: the line above the grid (with
// the star counter) and the big RUN button.
import { CODE } from "../../../strings/code";
import { PlayIcon, StarIcon } from "./CodeGlyphs";

const S = CODE.exercise;

export function HelpBar({ text, stars, got }: { text: string; stars: number; got: number }) {
  return (
    <div className="cw-bar">
      {stars > 0 && (
        <span key={got} className={`cw-stars ${got > 0 ? "is-got" : ""}`} role="img" aria-label={S.starsGot(got, stars)} data-testid="code-stars">
          <StarIcon />
          <b>{got}/{stars}</b>
        </span>
      )}
      <p className="cw-help" aria-live="polite" key={text}>{text}</p>
    </div>
  );
}

export function RunButton({ onRun, disabled }: { onRun: () => void; disabled: boolean }) {
  return (
    <button type="button" className="tbtn tbtn-yes cw-go" data-testid="code-run" disabled={disabled} onClick={onRun}>
      {S.runBtn}
      <PlayIcon />
    </button>
  );
}
