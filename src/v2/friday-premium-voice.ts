const FRIDAY_KEYS = new Set([
  "easyWalk",
  "lowerBodyMobility",
  "gluteBridge",
  "squat",
  "romanianDeadlift",
  "trapBarDeadlift",
  "legPress",
  "bulgarianSplitSquat",
  "hamstringCurl",
  "chestPress",
  "seatedRow",
  "lateralRaise",
  "dumbbellCurl",
  "tricepsPressdown",
  "suitcaseCarry",
]);

let active: HTMLAudioElement | null = null;

function endpoint(key: string) {
  return `/api/public/friday-coach-audio?key=${encodeURIComponent(key)}`;
}

export function stopFridayPremiumCue() {
  if (!active) return;
  try {
    active.pause();
    active.currentTime = 0;
  } catch {
    // Ignore a stale media element.
  }
  active = null;
}

export function hasFridayPremiumCue(motionKey?: string): boolean {
  return Boolean(motionKey && FRIDAY_KEYS.has(motionKey));
}

export function preloadFridayPremiumCue(motionKey?: string) {
  if (typeof Audio !== "function" || !hasFridayPremiumCue(motionKey)) return;
  const audio = new Audio(endpoint(motionKey!));
  audio.preload = "auto";
  audio.volume = 0;
  try {
    audio.load();
  } catch {
    // Preload is opportunistic only.
  }
}

export async function playFridayPremiumCue(motionKey?: string): Promise<boolean> {
  if (typeof Audio !== "function" || !hasFridayPremiumCue(motionKey)) return false;

  stopFridayPremiumCue();
  const audio = new Audio(endpoint(motionKey!));
  audio.preload = "auto";
  audio.volume = 0.82;
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  active = audio;

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    audio.onplaying = () => done(true);
    audio.onerror = () => {
      if (active === audio) active = null;
      done(false);
    };
    audio.onended = () => {
      if (active === audio) active = null;
    };
    const timer = window.setTimeout(() => done(false), 3500);
    void audio.play().catch(() => done(false));
  });
}
