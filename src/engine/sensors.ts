// Shared device-sensor helpers for the tilt minigames.

interface IOSOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/** iOS needs explicit motion permission, and it must come from a tap. */
export async function requestTiltPermission(): Promise<void> {
  const DOE = DeviceOrientationEvent as unknown as IOSOrientationEvent;
  if (typeof DOE.requestPermission === "function") {
    try {
      await DOE.requestPermission();
    } catch {
      // fall back to touch controls
    }
  }
}

/**
 * Screen-relative LEFT/RIGHT tilt in degrees. In portrait that's gamma, but
 * when the screen rotates the device axes don't — beta/gamma are remapped.
 */
export function screenTiltX(e: DeviceOrientationEvent): number | null {
  if (e.beta === null || e.gamma === null) return null;
  switch (screenAngle()) {
    case 90:
      return e.beta;
    case 180:
      return -e.gamma;
    case 270:
      return -e.beta;
    default:
      return e.gamma;
  }
}

/** Screen-relative FORWARD/BACK tilt in degrees (positive = top toward you). */
export function screenTiltY(e: DeviceOrientationEvent): number | null {
  if (e.beta === null || e.gamma === null) return null;
  switch (screenAngle()) {
    case 90:
      return -e.gamma;
    case 180:
      return -e.beta;
    case 270:
      return e.gamma;
    default:
      return e.beta;
  }
}

function screenAngle(): number {
  const raw = screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0;
  return ((raw % 360) + 360) % 360;
}

export function vibrate(pattern: number | number[]): void {
  navigator.vibrate?.(pattern);
}
