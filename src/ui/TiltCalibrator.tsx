import { useEffect, useRef, useState } from "react";
import { attachRawOrientation, saveAxisMap, vibrate, type AxisMap } from "../engine/sensors";
import { sfx } from "../engine/feedback/audio";

const THRESHOLD = 14; // degrees of deliberate tilt
const NO_SENSOR_TIMEOUT = 2500;

/** Which axis moved past the threshold (if any), and which way. */
function dominantAxis(dBeta: number, dGamma: number): { axis: "beta" | "gamma"; sign: 1 | -1 } | null {
  const axis = Math.abs(dBeta) > Math.abs(dGamma) ? "beta" : "gamma";
  const value = axis === "beta" ? dBeta : dGamma;
  if (Math.abs(value) < THRESHOLD) return null;
  return { axis, sign: value > 0 ? 1 : -1 };
}

/** Step 2 watches only the axis NOT already claimed by X. */
function otherAxisMove(map: Partial<AxisMap>, dBeta: number, dGamma: number): { axis: "beta" | "gamma"; sign: 1 | -1 } | null {
  const axis = map.xAxis === "beta" ? "gamma" : "beta";
  const value = axis === "beta" ? dBeta : dGamma;
  if (Math.abs(value) < THRESHOLD) return null;
  return { axis, sign: value > 0 ? 1 : -1 };
}

interface Props {
  /** Marble Maze needs both axes; Comet Catch only X. */
  needY: boolean;
  onDone: () => void;
}

/**
 * Physical axis calibration, run EVERY time a tilt game starts: we ASK the
 * player to tilt a known way and MEASURE which sensor axis responds. Immune
 * to every platform's orientation-convention quirks, and a botched
 * calibration never outlives the round. Auto-skips only when no sensor
 * events arrive (touch-only devices).
 */
export function TiltCalibrator({ needY, onDone }: Props) {
  const [step, setStep] = useState<"x" | "y">("x");
  const baseRef = useRef<{ beta: number; gamma: number } | null>(null);
  const mapRef = useRef<Partial<AxisMap>>({});
  const doneRef = useRef(false);

  function finish(skip = false): void {
    if (doneRef.current) return;
    doneRef.current = true;
    if (!skip) sfx.stageComplete();
    onDone();
  }

  useEffect(() => {
    let gotEvent = false;
    const noSensor = setTimeout(() => {
      if (!gotEvent) finish(true); // no sensors — touch fallback handles play
    }, NO_SENSOR_TIMEOUT);

    const detach = attachRawOrientation((beta, gamma) => {
      gotEvent = true;
      if (!baseRef.current) {
        baseRef.current = { beta, gamma };
        return;
      }
      const dBeta = beta - baseRef.current.beta;
      const dGamma = gamma - baseRef.current.gamma;
      const current = mapRef.current;

      if (!current.xAxis) {
        // step "x": waiting for a strong tilt toward the screen-RIGHT edge
        const hit = dominantAxis(dBeta, dGamma);
        if (!hit) return;
        current.xAxis = hit.axis;
        current.xSign = hit.sign;
        sfx.correct();
        vibrate(40);
        if (needY) {
          baseRef.current = { beta, gamma }; // re-baseline for step 2
          setStep("y");
        } else {
          // remaining axis becomes Y with a neutral guess (unused anyway)
          current.yAxis = hit.axis === "beta" ? "gamma" : "beta";
          current.ySign = 1;
          saveAxisMap(current as AxisMap);
          finish();
        }
        return;
      }

      if (needY && !current.yAxis) {
        // step "y": tilt the BOTTOM edge down — must be the other axis
        const hit = otherAxisMove(current, dBeta, dGamma);
        if (!hit) return;
        current.yAxis = hit.axis;
        current.ySign = hit.sign;
        saveAxisMap(current as AxisMap);
        sfx.correct();
        vibrate(40);
        finish();
      }
    });

    return () => {
      clearTimeout(noSensor);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay">
      <div className="panel celebration-card">
        <h2>🧭 Quick setup!</h2>
        {step === "x" ? (
          <>
            <div className="calib-arrow">➡️</div>
            <p className="catch-howto">Tilt the RIGHT edge down…</p>
            <p className="catch-howto dim">…and hold it for a moment!</p>
          </>
        ) : (
          <>
            <div className="calib-arrow">⬇️</div>
            <p className="catch-howto">Now tilt the BOTTOM edge down!</p>
          </>
        )}
        <button className="btn btn-secondary" onClick={() => finish(true)}>
          Skip (use touch)
        </button>
      </div>
    </div>
  );
}
