import { useEffect, useState, type ReactNode } from "react";

export const LEGACY_MODE_KEY = "m3-flex-legacy-workout-ack-v1";

export function isLegacyWorkoutRoute(pathname: string): boolean {
  return (
    /^\\/coach\\/\\d+(?:\\/|$)/.test(pathname) ||
    /^\\/workout\\/\\d+(?:\\/|$)/.test(pathname) ||
    pathname === "/glasses" ||
    pathname === "/presentation" ||
    pathname.startsWith("/display")
  );
}

/**
 * Seated-only recovery is the safe default. An old deep link must not
 * bypass the legacy warning merely because the athlete skipped Home.
 * This is a temporary navigation acknowledgment, never medical clearance.
 */
export function LegacyRouteGate({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    try {
      setAllowed(window.sessionStorage.getItem(LEGACY_MODE_KEY) === "acknowledged");
    } catch {
      setAllowed(false);
    }
  }, [pathname]);

  if (!isLegacyWorkoutRoute(pathname) || allowed) return <>{children}</>;

  return (
    <main
      role="dialog"
      aria-modal="true"
      aria-label="Legacy standing workout safety acknowledgment"
      data-testid="legacy-route-gate"
      className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 bg-background px-5 py-8 text-foreground"
    >
      <p className="text-sm font-black uppercase tracking-widest text-accent">
        M3 FLEX · Recovery first
      </p>
      <h1 className="text-2xl font-black">Legacy workouts are not seated-only</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This old coached-workout route may include standing, stepping, squats,
        kicks and leg loading. It has not been approved for foot-cast recovery.
        Do not perform those movements while restricted to seated exercise.
      </p>
      <a
        href="/recovery-coach/"
        className="tap-target flex items-center justify-center rounded-xl bg-primary px-4 text-center text-sm font-bold text-primary-foreground"
      >
        Open approved seated Recovery Coach
      </a>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          data-testid="legacy-route-ack"
          className="mt-1 size-5 accent-primary"
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        I understand the old workout is not a seated-only plan and will not
        use standing or weight-bearing movements while those restrictions apply.
      </label>
      <button
        type="button"
        data-testid="legacy-route-continue"
        className="tap-target rounded-xl border border-border bg-elevated px-3 text-sm font-bold disabled:opacity-40"
        disabled={!acknowledged}
        onClick={() => {
          try {
            window.sessionStorage.setItem(LEGACY_MODE_KEY, "acknowledged");
            setAllowed(true);
          } catch {
            // Without writable session storage, keep the legacy route blocked.
            setAllowed(false);
          }
        }}
      >
        Continue to legacy workout
      </button>
      <p className="text-xs text-muted-foreground">
        This one-session acknowledgment is not permission from a clinician.
        It does not replace the workout's separate readiness check.
      </p>
    </main>
  );
}
