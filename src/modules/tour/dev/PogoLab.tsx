// DEV-only showcase for the mascot (route /tour/lab/pogo): every mood at three
// sizes, the miss arc as one sequence, the "playing along" modifiers (ready,
// fidget, eyes following the pointer, tap reactions), the speech bubble on both
// sides, confetti, the lesson-complete entrances, Pogo's voice and the tour sounds.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Confetti, Pogo, PogoSay, PogoTap, type PogoMood } from "../../../ui/tour/Pogo";
import { usePogoPoke } from "../../../ui/tour/usePogoPoke";
import { unlockAudio } from "../../../engine/feedback/audio";
import { pogoVoice } from "../../../engine/feedback/pogoVoice";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { FinishEntrance } from "../lesson/FinishEntrance";
import type { EntranceAct } from "../lesson/finishActs";
import { lessonSound } from "../lesson/lessonSound";
import { usePogoGaze } from "../lesson/usePogoLive";

const MOODS: PogoMood[] = [
  "idle", "happy", "cheer", "think", "wave", "talk", "wow", "sleep", "sad", "dizzy", "zoom", "splat", "starry",
  "oops", "worried", "focus", "determined", "relieved", "proud", "whoa", "giggle", "beckon", "twirl", "flip",
];
const SIZES = [56, 110, 220];

/** The miss arc as the lesson plays it: [mood, ms, sound at the start]. */
type Beat = [PogoMood, number, (() => void)?];
const MISS_ARC: Beat[] = [
  ["oops", 600, lessonSound.almost],
  ["sad", 1200],
  ["focus", 2600, lessonSound.focus],
  ["determined", 3000],
  ["relieved", 1000, () => setTimeout(lessonSound.relieved, 380)],
  ["proud", 2200],
];
const TRICKY_ARC: Beat[] = [
  ["oops", 600, lessonSound.almost],
  ["worried", 1200, lessonSound.sinks],
  ["focus", 2600, lessonSound.focus],
  ["determined", 2400],
];
const GUESS_ARC: Beat[] = [
  ["oops", 600, lessonSound.almost],
  ["whoa", 3000],
];

/** Plays a list of beats on the big stage Pogo; returns the start function. */
function useArc(setMood: (mood: PogoMood) => void): (beats: Beat[]) => void {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (beats) => {
    unlockAudio();
    timers.current.forEach(clearTimeout);
    let at = 0;
    timers.current = [...beats, ["idle", 0] as Beat].map(([mood, ms, sound]) => {
      const timer = setTimeout(() => { setMood(mood); sound?.(); }, at);
      at += ms;
      return timer;
    });
  };
}
const LINES = [
  "Hi Sam! I'm Pogo.",
  "Which flag is Japan's?",
  "Ooh! A red circle on white. Earth flags are so cool!",
  "Almost — look at this.",
];
const SOUNDS: [string, () => void][] = [
  ["pop", tourSfx.pop],
  ["place", tourSfx.place],
  ["match", tourSfx.match],
  ["nudge", tourSfx.nudge],
  ["combo 1", () => tourSfx.combo(1)],
  ["combo 3", () => tourSfx.combo(3)],
  ["combo 6", () => tourSfx.combo(6)],
  ["whoosh", tourSfx.whoosh],
  ["stamp", tourSfx.stamp],
  ["chest", tourSfx.chest],
  ["hop", tourSfx.hop],
  ["lessonDone", tourSfx.lessonDone],
];

const ACTS: EntranceAct[] = ["splat", "drop", "peek"];
const VOICE: [string, () => void][] = [
  ["happy", () => pogoVoice.happy(Math.floor(Math.random() * 4))],
  ["aww", () => pogoVoice.aww()],
  ["uh-oh", () => pogoVoice.uhoh()],
  ["hm", () => pogoVoice.hm()],
  ["phew", () => pogoVoice.phew()],
  ["hey", () => pogoVoice.hey()],
  ["yay", () => pogoVoice.yay()],
  ["wow", () => pogoVoice.wow()],
  ["giggle", () => pogoVoice.giggle()],
  ["zoom", () => pogoVoice.zoom()],
  ["bonk", () => pogoVoice.bonk()],
  ["squeak", () => pogoVoice.squeak()],
  ["dizzy", () => pogoVoice.dizzy()],
  ["boing", () => pogoVoice.boing(0)],
  ["whistle", () => pogoVoice.whistle()],
];

const card: CSSProperties = { background: "var(--t-surface)", border: "2px solid var(--t-line)", borderRadius: 18, padding: 14 };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
const label: CSSProperties = { fontSize: 13, color: "var(--t-ink-dim)", textTransform: "uppercase", letterSpacing: "0.08em" };
const small: CSSProperties = { fontSize: 15, minHeight: 48, padding: "6px 14px" };

export default function PogoLab() {
  const [mood, setMood] = useState<PogoMood>("idle");
  const [replay, setReplay] = useState(0);
  const [still, setStill] = useState(false);
  const [line, setLine] = useState(0);
  const [burst, setBurst] = useState(0);
  const [act, setAct] = useState<EntranceAct | null>(null);
  const [modifier, setModifier] = useState("");
  const stageRef = useRef<HTMLElement>(null);
  const poke = usePogoPoke(() => { unlockAudio(); pogoVoice.giggle(); });
  usePogoGaze(stageRef, true);

  const pick = (m: PogoMood) => {
    setMood(m);
    setReplay((n) => n + 1);
  };
  const arc = useArc(pick);
  const play = (fn: () => void) => {
    unlockAudio();
    fn();
  };

  return (
    <div className="screen tour" style={{ background: "var(--t-bg)", gap: 18 }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Pogo Lab</h1>

      <section ref={stageRef} id="lab-stage" style={{ ...card, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 44 }}>
        <Confetti burstKey={burst} />
        <PogoTap poke={poke} label="Tickle Pogo">
          <Pogo mood={poke.mood ?? mood} size={220} replayKey={replay} still={still} className={modifier} />
        </PogoTap>
        <div style={label}>{mood}{modifier ? ` + ${modifier}` : ""} (tap him; move the pointer: his eyes follow)</div>
        <div style={{ ...row, justifyContent: "center" }}>
          <button className="tbtn tbtn-go" style={small} data-testid="arc-miss" onClick={() => arc(MISS_ARC)}>miss arc</button>
          <button className="tbtn tbtn-go" style={small} data-testid="arc-tricky" onClick={() => arc(TRICKY_ARC)}>second miss</button>
          <button className="tbtn tbtn-go" style={small} data-testid="arc-guess" onClick={() => arc(GUESS_ARC)}>rapid guess</button>
          {["", "pogo-ready", "pogo-fidget"].map((m) => (
            <button key={m || "none"} className={`tbtn ${m === modifier ? "tbtn-go" : "tbtn-ghost"}`} style={small} onClick={() => setModifier(m)}>
              {m ? m.replace("pogo-", "") : "no modifier"}
            </button>
          ))}
        </div>
        <div style={{ ...row, justifyContent: "center" }}>
          {MOODS.map((m) => (
            <button key={m} className={`tbtn ${m === mood ? "tbtn-go" : ""}`} style={small} onClick={() => pick(m)}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ ...row, justifyContent: "center" }}>
          <button className="tbtn tbtn-ghost" style={small} onClick={() => setStill((s) => !s)}>
            {still ? "motion on" : "hold still"}
          </button>
          <button className="tbtn tbtn-ghost" style={small} onClick={() => setBurst((n) => n + 1)}>
            confetti
          </button>
        </div>
      </section>

      <section id="lab-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
        {MOODS.map((m) => (
          <div key={m} style={{ ...card, display: "flex", flexDirection: "column", gap: 4, paddingTop: 30 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-around" }}>
              {SIZES.map((s) => (
                <Pogo key={s} mood={m} size={s} />
              ))}
            </div>
            <div style={{ ...label, textAlign: "center" }}>{m}</div>
          </div>
        ))}
      </section>

      <section id="lab-say" style={{ ...card, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={label}>PogoSay · side="right" (auto talk, then idle)</div>
        <PogoSay text={LINES[line]} size={120}>
          <button className="tbtn tbtn-go" style={{ minHeight: 48, minWidth: 48, padding: 6, flex: "none" }} aria-label="Hear it" onClick={() => play(tourSfx.pop)}>
            hear
          </button>
        </PogoSay>
        <div style={label}>PogoSay · side="top" · mood="think"</div>
        <PogoSay text={LINES[(line + 3) % LINES.length]} side="top" mood="think" size={140} />
        <button className="tbtn" style={small} onClick={() => setLine((n) => (n + 1) % LINES.length)}>
          next line
        </button>
      </section>

      <section id="lab-enter" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={label}>Lesson-complete entrance (tap to skip)</div>
        <div style={row}>
          {ACTS.map((name) => (
            <button key={name} className="tbtn" style={small} data-testid={`act-${name}`} onClick={() => play(() => setAct(name))}>
              {name}
            </button>
          ))}
        </div>
        {act && <FinishEntrance key={act} act={act} onDone={() => setAct(null)} />}
        <div style={label}>Pogo's voice</div>
        <div style={row}>
          {VOICE.map(([name, fn]) => (
            <button key={name} className="tbtn" style={small} onClick={() => play(fn)}>
              {name}
            </button>
          ))}
        </div>
      </section>

      <section id="lab-sfx" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={label}>tourSfx</div>
        <div style={row}>
          {SOUNDS.map(([name, fn]) => (
            <button key={name} className="tbtn" style={small} onClick={() => play(fn)}>
              {name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
