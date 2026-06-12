// Shared device-sensor helpers for the tilt minigames.
//
// The cross-platform trap: iPadOS and Android disagree about which "natural
// orientation" the sensor axes and screen.orientation.angle are measured
// from, so any fixed beta/gamma formula is wrong on some device. The
// GUARANTEED fix is empirical: a one-time calibration per screen rotation
// ("tilt the right edge down") measures which raw axis really is screen-X,
// and the result is cached in localStorage.

interface PermissionedEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export async function requestTiltPermission(): Promise<void> {
  for (const ev of [DeviceOrientationEvent, DeviceMotionEvent]) {
    const target = ev as unknown as PermissionedEvent;
    if (typeof target?.requestPermission === "function") {
      try {
        await target.requestPermission();
      } catch {
        // fall back to touch controls
      }
    }
  }
}

export function screenAngle(): number {
  // iOS keeps window.orientation portrait-referenced — same reference as its
  // sensor frame — so prefer it. screen.orientation.angle is the fallback.
  const winO = (window as { orientation?: number }).orientation;
  const raw = typeof winO === "number" ? winO : screen.orientation?.angle ?? 0;
  return ((raw % 360) + 360) % 360;
}

/* ---------- empirically calibrated axis map ---------- */

export interface AxisMap {
  xAxis: "beta" | "gamma";
  xSign: 1 | -1;
  yAxis: "beta" | "gamma";
  ySign: 1 | -1;
}

const mapKey = () => `tilt-axis-map-${screenAngle()}`;

export function loadAxisMap(): AxisMap | null {
  try {
    const raw = localStorage.getItem(mapKey());
    return raw ? (JSON.parse(raw) as AxisMap) : null;
  } catch {
    return null;
  }
}

export function saveAxisMap(map: AxisMap): void {
  try {
    localStorage.setItem(mapKey(), JSON.stringify(map));
  } catch {
    // private mode — calibration just reruns next time
  }
}

export function clearAxisMaps(): void {
  for (const angle of [0, 90, 180, 270]) localStorage.removeItem(`tilt-axis-map-${angle}`);
}

/** Raw orientation listener (for the calibrator). Returns cleanup. */
export function attachRawOrientation(cb: (beta: number, gamma: number) => void): () => void {
  const on = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    cb(e.beta, e.gamma);
  };
  window.addEventListener("deviceorientation", on);
  return () => window.removeEventListener("deviceorientation", on);
}

/* ---------- tilt stream ---------- */

/** Heuristic fallback used only before any calibration exists. */
function heuristicRemap(gamma: number, beta: number): { x: number; y: number } {
  switch (screenAngle()) {
    case 90:
      return { x: beta, y: -gamma };
    case 180:
      return { x: -gamma, y: -beta };
    case 270:
      return { x: -beta, y: gamma };
    default:
      return { x: gamma, y: beta };
  }
}

function applyMap(map: AxisMap, beta: number, gamma: number): { x: number; y: number } {
  const v = { beta, gamma };
  return { x: map.xSign * v[map.xAxis], y: map.ySign * v[map.yAxis] };
}

let baseline: { x: number; y: number } | null = null;
let recalibrate = true;

/** Make the next sensor reading the neutral grip (call on game start). */
export function calibrateTilt(): void {
  recalibrate = true;
}

function emit(cb: (x: number, y: number) => void, rawX: number, rawY: number): void {
  if (recalibrate) {
    baseline = { x: rawX, y: rawY };
    recalibrate = false;
  }
  cb(rawX - (baseline?.x ?? 0), rawY - (baseline?.y ?? 0));
}

/**
 * Listen for tilt in DEGREES relative to the calibrated grip, screen-frame
 * (x: right edge down +, y: bottom edge down +). Uses the empirically
 * calibrated axis map when one exists for this rotation; falls back to
 * devicemotion gravity if orientation events never arrive. Returns cleanup.
 */
export function attachTilt(cb: (tiltX: number, tiltY: number) => void): () => void {
  let gotOrientation = false;
  const map = loadAxisMap();

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    gotOrientation = true;
    const { x, y } = map ? applyMap(map, e.beta, e.gamma) : heuristicRemap(e.gamma, e.beta);
    emit(cb, x, y);
  };

  const onMotion = (e: DeviceMotionEvent) => {
    if (gotOrientation) return;
    const g = e.accelerationIncludingGravity;
    if (!g || g.x === null || g.y === null || g.z === null) return;
    const zSign = g.z > 0 ? -1 : 1;
    const toDeg = 90 / 9.81;
    const { x, y } = heuristicRemap(g.x * zSign * toDeg, -g.y * zSign * toDeg);
    emit(cb, x, y);
  };

  window.addEventListener("deviceorientation", onOrientation);
  window.addEventListener("devicemotion", onMotion);
  return () => {
    window.removeEventListener("deviceorientation", onOrientation);
    window.removeEventListener("devicemotion", onMotion);
  };
}

export function vibrate(pattern: number | number[]): void {
  navigator.vibrate?.(pattern);
}

/**
 * Acceleration magnitude stream in m/s² (gravity included — at rest ≈ 9.8).
 * Used by the exercise game to detect jumps/shakes/stillness. Returns cleanup.
 */
export function attachMotion(cb: (magnitude: number) => void): () => void {
  const on = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    cb(Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0));
  };
  window.addEventListener("devicemotion", on);
  return () => window.removeEventListener("devicemotion", on);
}

/** Compass/spin stream: cumulative rotation in degrees. Returns cleanup. */
export function attachSpin(cb: (totalDegrees: number) => void): () => void {
  let last: number | null = null;
  let total = 0;
  const on = (e: DeviceOrientationEvent) => {
    if (e.alpha === null) return;
    if (last !== null) {
      let d = e.alpha - last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      total += Math.abs(d);
      cb(total);
    }
    last = e.alpha;
  };
  window.addEventListener("deviceorientation", on);
  return () => window.removeEventListener("deviceorientation", on);
}
