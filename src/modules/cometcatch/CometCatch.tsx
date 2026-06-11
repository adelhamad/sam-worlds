import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { TiltCatchScene } from "../../pixi/TiltCatchScene";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { randInt, mulberry32, newSeed } from "../../engine/rng";
import { requestTiltPermission, screenTiltX } from "../../engine/sensors";

const ROUND_SECONDS = 60;
const MAX_PAYOUT = 30;

export function CometCatch() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TiltCatchScene | null>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [target, setTarget] = useState(10);
  const [caught, setCaught] = useState(0);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [tiltActive, setTiltActive] = useState(false);

  // Mount the Pixi scene once.
  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    void TiltCatchScene.create(hostRef.current).then((scene) => {
      if (cancelled) {
        scene.destroy();
        return;
      }
      sceneRef.current = scene;
    });
    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Round loop: timer + comet spawner.
  useEffect(() => {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (!scene) return;
    const rng = mulberry32(newSeed());

    scene.onCatch = (correct) => {
      if (correct) {
        sfx.correct();
        setCaught((c) => c + 1);
      } else {
        sfx.wrong();
      }
    };
    scene.start();

    const spawner = setInterval(() => {
      const correct = rng() < 0.45;
      let value = target;
      if (!correct) {
        do {
          value = target + randInt(rng, -4, 4);
        } while (value === target || value < 2);
      }
      const a = randInt(rng, 1, value - 1);
      scene.spawn(`${a} + ${value - a}`, correct);
    }, 1300);

    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          clearInterval(spawner);
          scene.stop();
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawner);
      clearInterval(timer);
      scene.onCatch = undefined;
    };
  }, [phase, target]);

  // Tilt steering (gamma = left/right) with touch-drag fallback.
  useEffect(() => {
    if (phase !== "play") return;
    const onTilt = (e: DeviceOrientationEvent) => {
      const tilt = screenTiltX(e);
      if (tilt === null) return;
      setTiltActive(true);
      sceneRef.current?.steer(Math.max(-30, Math.min(30, tilt)) / 30);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      sceneRef.current?.setXNorm(e.clientX / window.innerWidth);
    };
    window.addEventListener("deviceorientation", onTilt);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [phase]);

  // Pay out when the round ends.
  useEffect(() => {
    if (phase !== "done") return;
    const payout = Math.min(caught, MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "comet-catch");
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    unlockAudio();
    sfx.tap();
    await requestTiltPermission(); // iOS: must come from a tap
    setTarget(randInt(mulberry32(newSeed()), 8, 16));
    setCaught(0);
    setSeconds(ROUND_SECONDS);
    setPhase("play");
  }

  return (
    <div className="screen stage-play">
      <div className="pixi-host" ref={hostRef} />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🌠 Comet Catch</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="catch-hud">
          <span className="catch-target">🎯 = {target}</span>
          <span className="catch-stat">⏱ {seconds}</span>
          <span className="catch-stat">✨ {caught}</span>
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🌠 Comet Catch</h2>
            <p className="catch-howto">Tilt left and right to fly!</p>
            <p className="catch-howto dim">Catch comets that make the target number.</p>
            <button className="btn btn-primary btn-big" onClick={() => void start()}>
              Start!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>Great flying!</h2>
            <div className="payout">
              {caught} comets → +{Math.min(caught, MAX_PAYOUT)} ✨
            </div>
            {!tiltActive && <p className="dim catch-howto">Tip: on the tablet, tilt to steer!</p>}
            <div className="celebration-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  sfx.tap();
                  navigate("/hub");
                }}
              >
                ← Base
              </button>
              <button className="btn btn-primary" onClick={() => void start()}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
