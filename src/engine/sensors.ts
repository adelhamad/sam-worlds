// Shared device-sensor helpers for the tilt minigames.
//
// iPad/iOS notes: motion needs HTTPS, and permission must be requested on
// BOTH DeviceOrientationEvent and DeviceMotionEvent from a user tap. Some
// iPadOS contexts deliver no `deviceorientation` events at all — so
// attachTilt() falls back to `devicemotion` gravity readings automatically.
//
// Intuitiveness: nobody holds a tablet flat. calibrateTilt() makes the NEXT
// reading the neutral position, so however the player holds the device when
// they tap Start becomes "no tilt".

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

function screenAngle(): number {
  const raw = screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0;
  return ((raw % 360) + 360) % 360;
}

/** Rotate device-frame x/y into screen-frame x/y for the current rotation. */
function remap(x: number, y: number): { x: number; y: number } {
  switch (screenAngle()) {
    case 90:
      return { x: y, y: -x };
    case 180:
      return { x: -x, y: -y };
    case 270:
      return { x: -y, y: x };
    default:
      return { x, y };
  }
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
 * (x: right edge down +, y: bottom edge down +). Uses deviceorientation;
 * falls back to devicemotion gravity if orientation stays silent (iPadOS).
 * Returns a cleanup function.
 */
export function attachTilt(cb: (tiltX: number, tiltY: number) => void): () => void {
  let gotOrientation = false;

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    gotOrientation = true;
    const { x, y } = remap(e.gamma, e.beta);
    emit(cb, x, y);
  };

  const onMotion = (e: DeviceMotionEvent) => {
    if (gotOrientation) return; // orientation is the better signal when present
    const g = e.accelerationIncludingGravity;
    if (!g || g.x === null || g.y === null || g.z === null) return;
    // Normalize the platform sign so "gravity" really points down: when the
    // device is near-flat, physical gravity along z is negative (into the
    // back). iOS and Android report opposite conventions.
    const zSign = g.z > 0 ? -1 : 1;
    const toDeg = 90 / 9.81;
    const { x, y } = remap(g.x * zSign * toDeg, -g.y * zSign * toDeg);
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
