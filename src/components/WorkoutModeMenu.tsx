/**
 * WORKOUT MODE MENU — one control, same place, every workout view.
 * ------------------------------------------------------------------
 * Coach, Manual log, Glasses and Presentation are states of ONE workout,
 * not separate apps. This single button (always top-right of the active
 * workout shell) opens a compact sheet that switches the central view,
 * opens the exercise library in-context, hands the voice to this screen
 * and toggles full screen.
 *
 * Nothing here touches workout state: every entry is a plain route change
 * on the same day, and the canonical DayLog/session engine keeps the
 * exercise, set, weights, reps, timer and pause state intact.
 */
import { Suspense, lazy, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Eye, Glasses, Maximize2, Monitor, Smartphone, Volume2, X, ListChecks } from "lucide-react";

const ExerciseLibraryModal = lazy(() => import("@/components/ExerciseLibraryModal"));

export type WorkoutMode = "coach" | "manual" | "glasses" | "presentation";

export function toggleFullScreen() {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (document.fullscreenElement) void document.exitFullscreen?.();
  else void el.requestFullscreen?.().catch(() => undefined);
}

const MODES: { id: WorkoutMode; label: string; hint: string; icon: typeof Smartphone }[] = [
  { id: "coach", label: "Coach", hint: "Guided 1-on-1 session", icon: Smartphone },
  { id: "manual", label: "Manual log", hint: "Type every set yourself", icon: ListChecks },
  { id: "glasses", label: "Glasses", hint: "Heads-up display", icon: Glasses },
  { id: "presentation", label: "Big screen", hint: "TV / presentation", icon: Monitor },
];

export function WorkoutModeButton({
  day,
  current,
  dark = false,
  isLeader,
  onClaimVoice,
}: {
  day: number;
  current: WorkoutMode;
  dark?: boolean;
  isLeader?: boolean;
  onClaimVoice?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState(false);

  const trigger = dark ? "bg-black/55 text-white backdrop-blur-sm" : "bg-elevated text-foreground";

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        data-testid="workout-mode-button"
        data-current-mode={current}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Change workout view"
        onClick={() => setOpen(true)}
        className={`grid h-9 min-w-16 shrink-0 place-items-center rounded-lg px-2 text-[10px] font-bold uppercase tracking-widest ${trigger}`}
      >
        {MODES.find((m) => m.id === current)?.label ?? "View"}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Workout views"
            onClick={close}
          >
            <div
              data-testid="workout-mode-sheet"
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl border-t border-border bg-background p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">
                  Workout view
                </p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={close}
                  className="grid size-10 place-items-center rounded-lg bg-elevated"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                Same workout, same set, same clock — only the screen changes.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {MODES.map(({ id, label, hint, icon: Icon }) => {
                  const active = id === current;
                  const cls = `flex min-h-16 flex-col justify-center gap-0.5 rounded-2xl border px-3 py-2 text-left ${
                    active ? "border-primary bg-primary/15" : "border-border bg-elevated"
                  }`;
                  const body = (
                    <>
                      <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                        <Icon className="size-4 shrink-0" /> {label}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
                    </>
                  );
                  if (active) {
                    return (
                      <div key={id} data-testid={`mode-${id}`} data-active="true" className={cls}>
                        {body}
                      </div>
                    );
                  }
                  if (id === "coach") {
                    return (
                      <Link
                        key={id}
                        data-testid="mode-coach"
                        to="/coach/$day"
                        params={{ day: String(day) }}
                        onClick={close}
                        className={cls}
                      >
                        {body}
                      </Link>
                    );
                  }
                  if (id === "manual") {
                    return (
                      <Link
                        key={id}
                        data-testid="mode-manual"
                        to="/workout/$day"
                        params={{ day: String(day) }}
                        onClick={close}
                        className={cls}
                      >
                        {body}
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={id}
                      data-testid={`mode-${id}`}
                      to={id === "glasses" ? "/glasses" : "/presentation"}
                      search={{ day }}
                      onClick={close}
                      className={cls}
                    >
                      {body}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                data-testid="mode-library"
                onClick={() => {
                  setLibrary(true);
                  close();
                }}
                className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent/15 text-sm font-bold uppercase tracking-wide text-accent"
              >
                <Eye className="size-4" aria-hidden /> Exercise library
              </button>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleFullScreen();
                    close();
                  }}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-elevated text-[11px] font-bold uppercase tracking-wide"
                >
                  <Maximize2 className="size-4" /> Full screen
                </button>
                <button
                  type="button"
                  disabled={!onClaimVoice || isLeader}
                  onClick={() => {
                    onClaimVoice?.();
                    close();
                  }}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-elevated text-[11px] font-bold uppercase tracking-wide disabled:opacity-40"
                >
                  <Volume2 className="size-4" /> {isLeader ? "This screen speaks" : "Speak here"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {library &&
        typeof document !== "undefined" &&
        createPortal(
          <Suspense
            fallback={
              <div
                className="fixed inset-0 z-[70] grid place-items-center bg-background/95 text-sm text-muted-foreground"
                role="status"
              >
                Loading exercise library…
              </div>
            }
          >
            <div className="fixed inset-0 z-[70]">
              <ExerciseLibraryModal onClose={() => setLibrary(false)} />
            </div>
          </Suspense>,
          document.body,
        )}
    </>
  );
}