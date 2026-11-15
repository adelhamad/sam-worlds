// "Speaking practice" (Parent Section → Voices): one switch for every language
// course, off by default. On: the lesson slides get a microphone — Sam says the
// phrase and hears the model and then himself; nothing is stored. Switching it
// on asks for the microphone right here (with the parent), and the section
// says plainly when the microphone cannot be used — lessons then quietly look
// as they do with the switch off.
import { useEffect, useState, useSyncExternalStore } from "react";
import { checkMic, micPermission, recordingSupported, releaseMic, type MicProblem } from "../../engine/feedback/recorder";
import { clearMicTrouble, micTrouble, noteMicTrouble, onMicTrouble } from "../../engine/feedback/speakBack";
import { useGame } from "../../state/store";
import { VOICES } from "../../strings/voices";

const S = VOICES.speak;

type MicState = "unknown" | "checking" | "ready" | "prompt" | MicProblem;

function statusLine(state: MicState): string | null {
  if (state === "unknown") return null;
  if (state === "checking") return S.checking;
  if (state === "ready") return S.ready;
  if (state === "prompt") return S.asked;
  return VOICES.mic[state];
}

/** What the browser says without asking (no prompt). */
function useMicPermission(on: boolean): [MicState, (state: MicState) => void] {
  const [state, setState] = useState<MicState>("unknown");
  useEffect(() => {
    if (!on) return;
    let live = true;
    if (!recordingSupported()) {
      queueMicrotask(() => { if (live) setState("unsupported"); });
      return () => { live = false; };
    }
    void micPermission().then((permission) => {
      if (!live || permission === "unknown") return;
      const told: MicState = permission === "granted" ? "ready" : permission;
      // A real try (the parent's tap) knows better: never overwrite it.
      setState((now) => (now === "unknown" ? told : now));
    });
    return () => { live = false; };
  }, [on]);
  return [state, setState];
}

export function SpeakSwitch({ studioBusy }: { studioBusy: boolean }) {
  const on = useGame((s) => s.speakPractice);
  const setSpeakPractice = useGame((s) => s.setSpeakPractice);
  const trouble = useSyncExternalStore(onMicTrouble, micTrouble);
  const [mic, setMic] = useMicPermission(on);
  const [tried, setTried] = useState(false);

  const tryMic = async () => {
    setMic("checking");
    const problem = await checkMic();
    if (!studioBusy) releaseMic(); // only a check: the lessons ask again when Sam taps
    setMic(problem ?? "ready");
    setTried(true);
    // The lessons follow the parent's try: a mic that does not work stays hidden there.
    if (problem) noteMicTrouble(problem, "parent");
    else clearMicTrouble();
  };

  const choose = (next: boolean) => {
    if (next === on) return;
    setSpeakPractice(next);
    if (next) void tryMic(); // this tap is the parent's: let the device ask now
  };

  const fromLesson = trouble?.where === "lesson" ? trouble : null;
  // Until the parent tries again here, what the lesson (or the last try) met wins
  // over the browser's own word, which can say "allowed" for a missing mic.
  const shown: MicState = trouble && !tried ? trouble.problem : mic;
  const status = fromLesson && shown === fromLesson.problem ? null : statusLine(shown);
  const blocked = shown !== "ready" && shown !== "prompt" && shown !== "unknown" && shown !== "checking";

  return (
    <section className="panel parent-block vx-speak" data-testid="vx-speak">
      <h2>{S.heading}</h2>
      {S.lines.map((line) => <p key={line} className="vx-speak-line">{line}</p>)}
      <div className="parent-row" role="group" aria-label={S.heading}>
        {([false, true] as const).map((value) => (
          <button
            key={String(value)} type="button" aria-pressed={on === value}
            className={`btn btn-compact ${on === value ? "btn-primary" : "btn-secondary"}`}
            onClick={() => choose(value)} data-testid={`vx-speak-${value ? "on" : "off"}`}
          >
            {value ? S.on : S.off}
          </button>
        ))}
      </div>
      {on && (
        <div className="vx-speak-status" data-testid="vx-speak-status">
          {fromLesson && (
            <p className="vx-problem" data-testid="vx-speak-trouble">{S.inLesson} {VOICES.mic[fromLesson.problem]}</p>
          )}
          {status && <p className={blocked ? "vx-problem" : "dim"} data-testid="vx-speak-mic">{status}</p>}
          {(blocked || trouble) && <p className="dim">{S.hidden}</p>}
          <button type="button" className="btn btn-compact btn-secondary" onClick={() => void tryMic()} disabled={mic === "checking"} data-testid="vx-speak-try">
            {S.check}
          </button>
        </div>
      )}
    </section>
  );
}
