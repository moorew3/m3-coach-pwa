/**
 * BUILD MARKER
 * ------------------------------------------------------------------
 * Lets us confirm the installed phone app and the website are running
 * the same release. Bump RELEASE whenever a build is published.
 */
export const RELEASE = "2026-09-14.1";

/** Where this copy is running — helps tell the installed app from the tab. */
export function surfaceLabel(): string {
  if (typeof window === "undefined") return "server";
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  return standalone ? "Installed app" : "Browser";
}