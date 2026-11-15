// The blocks the child can use: four arrows (one colour per direction) and a
// loop tile per repeat count on offer. DirPicker is the debug widget's
// "turn this arrow" bar — the same chunky arrows.
import type { Dir } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import { ArrowGlyph, RepeatIcon } from "./CodeGlyphs";
import { DIRS } from "./codeRun";
import "./codeBlocks.css";

const S = CODE.exercise;

export interface BlockPaletteProps {
  loops: number[];
  onArrow: (dir: Dir) => void;
  onLoop: (times: number) => void;
  /** Arrows go into the open loop: they wear its colour ring. */
  into?: boolean;
  disabled?: boolean;
}

export function BlockPalette({ loops, onArrow, onLoop, into = false, disabled = false }: BlockPaletteProps) {
  return (
    <div className={`cp-palette ${into ? "is-into" : ""} ${loops.length > 0 ? "has-loops" : ""}`} data-testid="code-palette">
      <div className="cp-palette-arrows">
        {DIRS.map((dir) => (
          <button
            key={dir} type="button" className={`cp-block cp-key d-${dir}`} data-testid={`code-add-${dir}`}
            aria-label={S.add(S.dir[dir])} disabled={disabled} onClick={() => onArrow(dir)}
          >
            <ArrowGlyph dir={dir} />
          </button>
        ))}
      </div>
      {loops.length > 0 && (
        <div className="cp-palette-loops">
          {loops.map((times) => (
            <button
              key={times} type="button" className="cp-loop-key" data-testid={`code-loop-${times}`}
              aria-label={S.addLoop(times)} disabled={disabled} onClick={() => onLoop(times)}
            >
              <RepeatIcon />
              <span>×{times}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DirPicker({ value, onPick, disabled = false }: { value: Dir | null; onPick: (dir: Dir) => void; disabled?: boolean }) {
  return (
    <div className="cp-picker" data-testid="code-picker" role="group">
      {DIRS.map((dir) => (
        <button
          key={dir} type="button" className={`cp-block cp-key d-${dir} ${dir === value ? "is-current" : ""}`}
          data-testid={`code-pick-${dir}`} aria-label={S.pick(S.dir[dir])} aria-pressed={dir === value}
          disabled={disabled} onClick={() => onPick(dir)}
        >
          <ArrowGlyph dir={dir} />
        </button>
      ))}
    </div>
  );
}
