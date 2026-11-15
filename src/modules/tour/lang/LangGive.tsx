// lang-give — a little scene: Pogo stands at a picnic blanket and asks for a
// thing in the language. The child drags its picture to him (or taps the
// picture, then taps Pogo). His eyes follow the picture, he gets excited as it
// comes near, and it flies into his hands with a giggle — a neutral "got it":
// the widget never judges. Self-submitting: the hand-over is the answer (the
// item's id), reported once.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { pogoVoice } from "../../../engine/feedback/pogoVoice";
import type { GivePayload } from "../../../engine/lang/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import { Pogo, type PogoMood } from "../../../ui/tour/Pogo";
import { usePogoGaze } from "../lesson/usePogoLive";
import { reducedMotion, tourSound, useTimers, type WidgetProps } from "../exercises/shared";
import { PhraseFace } from "./LangFaces";
import { flyGhost, liftGhost, useGiveDrag, type Band, type Ghost } from "./useGiveDrag";
import { useVoice } from "./useVoice";
import "./play.css";

const FLY_MS = 320;
const SUBMIT_MS = 560; // after the hand-over: the gift has landed and the giggle has begun
const GOBBLE_MS = 1100;
const TALK_MS = 1700;

/** Scene Pogo's size: smaller on a phone on its side, bigger on a tablet. */
function sceneSize(): number {
  if (typeof window === "undefined") return 124;
  const { innerWidth: w, innerHeight: h } = window;
  if (h < 520) return 92;
  if (w >= 600 && h >= 900) return 190;
  return h >= 700 ? 150 : 124;
}
const onResize = (fn: () => void) => {
  window.addEventListener("resize", fn);
  return () => window.removeEventListener("resize", fn);
};

type Phase = "ask" | "wait" | "gobble" | "hold";

function moodOf(phase: Phase, band: Band | null, picked: boolean): PogoMood {
  if (phase === "gobble") return "giggle";
  if (phase === "hold") return "idle";
  if (band === "near" || band === "over" || picked) return "wow";
  return phase === "ask" ? "talk" : "idle";
}

export function LangGive({ payload, disabled, onSubmit }: WidgetProps<GivePayload>) {
  const { canSay, say } = useVoice(payload.lang);
  const size = useSyncExternalStore(onResize, sceneSize, () => 124);
  const [picked, setPicked] = useState<string | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [given, setGiven] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("ask");
  const sent = useRef(false);
  const ghostRef = useRef<Ghost | null>(null);
  const pogoRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const handsRef = useRef<HTMLSpanElement>(null);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });
  const { ask } = payload;
  const audible = canSay(ask);
  const open = !disabled && given === null;
  usePogoGaze(sceneRef, given === null);

  // Pogo asks as the question arrives.
  useEffect(() => {
    const timers = [window.setTimeout(() => setPhase((now) => (now === "ask" ? "wait" : now)), TALK_MS)];
    if (audible) timers.push(window.setTimeout(() => say(ask), 500));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [ask, audible, say]);
  useEffect(() => () => ghostRef.current?.remove(), []);

  const hearAgain = () => {
    say(ask);
    if (given === null) {
      setPhase("ask");
      later(() => setPhase((now) => (now === "ask" ? "wait" : now)), TALK_MS);
    }
  };

  /** The hand-over. `ghost` is the picture already in the air (a drag), else it takes off from the table. */
  const handOver = (id: string, ghost: Ghost | null) => {
    if (sent.current || disabled) {
      ghost?.remove();
      return;
    }
    sent.current = true;
    const art = sceneRef.current?.querySelector<HTMLElement>(`[data-testid="lang-item-${id}"] .lxg-art`);
    const air = ghost ?? (art && !reducedMotion() ? liftGhost(art) : null);
    const hands = handsRef.current?.getBoundingClientRect();
    setPicked(null);
    setBand(null);
    setGiven(id);
    const land = () => {
      ghostRef.current?.remove();
      ghostRef.current = null;
      setLanded(true);
      setPhase("gobble");
      tourSound.place();
      pogoVoice.giggle();
    };
    if (air && hands && !reducedMotion()) {
      ghostRef.current = air;
      requestAnimationFrame(() => flyGhost(air, hands, FLY_MS));
      later(land, FLY_MS);
    } else {
      air?.remove();
      land();
    }
    later(() => submit.current(id), SUBMIT_MS);
    later(() => setPhase("hold"), FLY_MS + GOBBLE_MS);
  };

  const drag = useGiveDrag({
    enabled: open,
    zone: () => pogoRef.current,
    onBand: (next) => {
      setBand(next);
      if (next) setPicked(null);
    },
    onDrop: (id, ghost) => handOver(id, ghost),
  });

  const pick = (id: string) => {
    if (drag.wasDrag(id) || !open) return;
    tourSound.pop();
    setPicked((now) => (now === id ? null : id));
  };
  const tapPogo = () => {
    if (!open) return;
    if (picked) handOver(picked, null);
    else hearAgain();
  };

  const item = payload.items.find((it) => it.id === given);
  const sceneCls = ["lxg-scene", band ? `is-${band}` : "", picked ? "is-picked" : "", landed ? "is-fed" : "", `is-${phase}`].filter(Boolean).join(" ");

  return (
    <div className="tx lx lx-give" data-testid="lang-give" style={{ "--lxg-pogo": `${size}px` } as CSSProperties}>
      <div ref={sceneRef} className={sceneCls}>
        <div className="lxg-top">
          <button
            ref={pogoRef} type="button" className="lxg-pogo" onClick={tapPogo}
            aria-label={LANG.engine.give} data-testid="lang-give-pogo" disabled={disabled}
          >
            <Pogo mood={moodOf(phase, band, picked !== null)} size={size} className={band || picked ? "pogo-ready" : ""} />
            <span ref={handsRef} className={`lxg-hands ${landed ? "is-full" : ""}`} aria-hidden="true">
              {item?.art && <Icon name={item.art} size="100%" />}
            </span>
          </button>
          <button type="button" className="lx-bubble lxg-bubble" onClick={hearAgain} aria-label={LANG.ui.listenAgain}>
            <PhraseFace card={ask} lang={payload.lang} />
            {audible && <Icon name="sound" size={22} mono />}
          </button>
        </div>
        <div className="lxg-blanket">
          <div className="lxg-items" data-count={payload.items.length}>
            {payload.items.map((it, i) => (
              <button
                key={it.id} type="button" style={{ "--i": i } as CSSProperties}
                className={`lxg-item ${picked === it.id ? "is-picked" : ""} ${given === it.id ? "is-given" : ""}`}
                disabled={disabled || given !== null} aria-pressed={picked === it.id}
                aria-label={LANG.ui.giveThis(it.en)} data-testid={`lang-item-${it.id}`}
                onPointerDown={(event) => drag.start(event, it.id, event.currentTarget.querySelector<HTMLElement>(".lxg-art"))}
                onClick={() => pick(it.id)}
                onContextMenu={(event) => event.preventDefault()}
              >
                <span className="lxg-plate">
                  <span className="lxg-art">{it.art && <Icon name={it.art} size="100%" />}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
