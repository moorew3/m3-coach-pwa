/** Human-readable release marker for the unified M3 FLEX build. */
export const RELEASE = "2026-11-02.1";

/** Distinguish native Android from a browser/PWA without requesting permissions. */
export function surfaceLabel(): string {
  if (typeof window === "undefined") return "server";
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }).Capacitor;
  try {
    if (cap?.isNativePlatform?.())
      return cap.getPlatform?.() === "android" ? "Android app" : "Installed app";
  } catch { /* A broken optional native bridge must not break Settings. */ }
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  return standalone ? "Installed web app" : "Browser";
}
