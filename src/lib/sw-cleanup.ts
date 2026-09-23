// This app is manifest-only: it has no offline app-shell service worker.
// Any registration found in a browser is a leftover from an older build and can
// pin an installed Android PWA to a stale app shell. On startup we force the
// kill-switch worker at the old path to update, then unregister everything.
// localStorage (workouts, logs, settings) is never touched here.

export async function cleanupLegacyServiceWorkers() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      try {
        // Pull the kill-switch worker so returning installs evict their old shell.
        await registration.update();
      } catch {
        /* ignore */
      }
      try {
        await registration.unregister();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}