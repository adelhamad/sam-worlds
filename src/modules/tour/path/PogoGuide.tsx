// Pogo on the course path: he stands beside the lesson to play next, waves,
// giggles when tapped — and when that lesson moves on (a lesson was just
// finished) he hops over from where he stood before.
import { useEffect, useState, type CSSProperties } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { pogoVoice } from "../../../engine/feedback/pogoVoice";
import { TOUR } from "../../../strings/tour";
import { Pogo, PogoTap } from "../../../ui/tour/Pogo";
import { usePogoPoke } from "../../../ui/tour/usePogoPoke";
import type { LessonItem } from "./layout";

/** How far Pogo stands from the centre of the lesson he is waiting at. */
const POGO_GAP = 108;
const SIZE = 104;
/** The hop over from his last spot, then the wave. */
const TRAVEL_MS = 1100;
const WAVE_MS = 3200;

/** Where Pogo last stood on each course's path during this visit (cosmetic only, never saved). */
const lastSpot = new Map<string, { x: number; y: number }>();

const giggle = () => {
  unlockAudio();
  pogoVoice.giggle();
};

export function PogoGuide({ courseId, item, amp }: { courseId: string; item: LessonItem; amp: number }) {
  const side = item.unitIndex % 2 === 0 ? -1 : 1;
  const x = item.x * amp + side * POGO_GAP;
  const [travel] = useState(() => {
    const from = lastSpot.get(courseId);
    return from && (Math.abs(from.x - x) > 1 || Math.abs(from.y - item.y) > 1) ? { dx: from.x - x, dy: from.y - item.y } : null;
  });
  const [phase, setPhase] = useState<"travel" | "wave" | "idle">(travel ? "travel" : "wave");
  useEffect(() => {
    lastSpot.set(courseId, { x, y: item.y });
  }, [courseId, x, item.y]);
  useEffect(() => {
    const start = travel ? TRAVEL_MS : 0;
    const timers = [
      setTimeout(() => setPhase("wave"), start),
      setTimeout(() => setPhase("idle"), start + WAVE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [travel]);
  const poke = usePogoPoke(giggle);
  const mood = poke.mood ?? (phase === "travel" ? "happy" : phase);
  const style = travel ? ({ "--tp-from-x": `${travel.dx.toFixed(1)}px`, "--tp-from-y": `${travel.dy.toFixed(1)}px` } as CSSProperties) : undefined;

  return (
    <div className="tp-anchor tp-pogo" style={{ left: `calc(50% + ${x.toFixed(1)}px)`, top: item.y }}>
      <span className={`tp-pogo-hop ${travel ? "is-travelling" : ""}`} style={style}>
        <PogoTap poke={poke} label={TOUR.tapPogo}>
          <Pogo mood={mood} size={SIZE} />
        </PogoTap>
      </span>
    </div>
  );
}
