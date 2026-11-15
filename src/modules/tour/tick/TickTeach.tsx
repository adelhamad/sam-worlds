// The SOLVED view inside the amber "Almost — look at this." sheet: a clock
// showing the RIGHT time, the hands named in their colours, the time written
// both ways, one rule line that fits the minutes, and — when the child's
// answer was another time — that time small, so the difference shows.
// "Later" puzzles show before → after with the jump. Compact: well under half
// of a 360×740 screen.
import { addMinutes, hasWords, jumpWords, sameTime, timeKey, timeWords } from "../../../engine/tick/clock";
import { tickPayload, type ClockTime, type TickPayload } from "../../../engine/tick/types";
import { TICK } from "../../../strings/tick";
import { ClockFace } from "../../../ui/clock/ClockFace";
import type { TeachProps } from "../exercises/contract";
import { HandLegend } from "./HandLegend";
import { parseTime } from "./tickClock";
import { ArrowGlyph } from "./TickGlyphs";
import "./tick.css";

const T = TICK.exercise.teach;

function minuteRule(minute: number): string {
  if (minute === 0) return T.oclock;
  if (minute === 30) return T.half;
  if (minute === 15) return T.quarterPast;
  if (minute === 45) return T.quarterTo;
  return minute % 5 === 0 ? T.fives : T.minutes;
}

function ruleOf(answer: ClockTime, jump: number): string {
  if (jump > 0 && jump % 60 === 0) return T.turn;
  if (jump === 30) return T.halfTurn;
  if (jump === 15) return T.quarterTurn;
  return minuteRule(answer.minute);
}

function solved(payload: TickPayload): { before: ClockTime; answer: ClockTime; jump: number } {
  if (payload.tour === "tick-read") {
    return { before: payload.shown, answer: addMinutes(payload.shown, payload.jump), jump: payload.jump };
  }
  return { before: payload.start, answer: payload.target, jump: payload.jump };
}

export function TickTeach({ question, submitted }: TeachProps) {
  const payload = tickPayload(question);
  if (!payload) return null;
  const { before, answer, jump } = solved(payload);
  const later = jump > 0;
  const mine = parseTime(submitted);
  const shownMine = mine && !sameTime(mine, answer) ? mine : null;
  const words = hasWords(answer) ? timeWords(answer) : null;
  return (
    <div className={`tk-teach ${later ? "is-later" : ""}`} data-testid={`teach-${payload.tour}`}>
      <div className="tk-teach-main">
        {later && (
          <div className="tk-teach-before">
            <ClockFace time={before} size={62} />
            <span>{timeKey(before)}</span>
          </div>
        )}
        {later && (
          <div className="tk-teach-jump">
            <ArrowGlyph size={26} />
            <small>{jumpWords(jump)}</small>
          </div>
        )}
        <div className="tk-teach-clock">
          <ClockFace time={answer} />
        </div>
        <div className="tk-teach-side">
          <strong className="tk-teach-time" data-testid="teach-time">{timeKey(answer)}</strong>
          {words && <span className="tk-teach-words">{words}</span>}
          {!later && <HandLegend className="is-teach" />}
        </div>
      </div>
      <p className="tk-teach-rule">{ruleOf(answer, jump)}</p>
      {shownMine && (
        <div className="tk-teach-mine" data-testid="teach-mine">
          <ClockFace time={shownMine} size={40} />
          <span>{payload.tour === "tick-set" ? T.youMade(timeKey(shownMine)) : T.youTyped(timeKey(shownMine))}</span>
        </div>
      )}
    </div>
  );
}
