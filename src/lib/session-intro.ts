/**
 * SESSION INTRO GATE
 * ------------------------------------------------------------------
 * The coach introduction is the first thing seen in each app session —
 * not a per-workout screen. sessionStorage means it returns on a fresh
 * app open but never re-triggers while moving between workout screens.
 */
const KEY = "coach-intro-seen-v1";

export function introSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* private mode — the intro simply shows again */
  }
}