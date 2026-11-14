// One gift per lesson session, even across a reload. The gift is paid in the
// answer handler on the step that reaches its slot; this synchronous note of
// the session seed closes the last gap (the app killed in the instant before
// the session's new position reached IndexedDB, then the slot played again).

const KEY = "sams-worlds-lesson-gift-seed";

/** True when this session's gift may be paid now — at most once per seed. */
export function claimLessonGift(seed: number): boolean {
  try {
    if (localStorage.getItem(KEY) === String(seed)) return false;
    localStorage.setItem(KEY, String(seed));
  } catch {
    // Storage unavailable (private mode): the handler's own once-only rule still holds.
  }
  return true;
}
