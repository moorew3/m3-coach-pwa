/**
 * COACH AUDIO GATE + BADGE
 * ------------------------------------------------------------------
 * Browsers refuse to speak until the page has had a real user gesture.
 * The gate is that gesture: one big "Start coaching" button that
 * unlocks speech, plays "Coach audio on. Let's begin." and then hands
 * straight back to the coached session.
 *
 * The badge shows, at a glance, whether coach audio is ON, MUTED,
 * needs a tap, or is unavailable on this browser.
 */
import { useState } from "react";
import { Volume2, VolumeX, TriangleAlert, Play } from "lucide-react";
import type { VoiceStatus } from "@/lib/coach-voice";

export function CoachAudioGate({
  status,
  voiceOn,
  title,
  onEnable,
  onSkip,
  dark = false,
  suppressed = false,
}: {
  status: VoiceStatus;
  voiceOn: boolean;
  title: string;
  onEnable: () => Promise<VoiceStatus> | void;
  onSkip: () => void;
  dark?: boolean;
  /**
   * Another surface is already collecting the unlocking tap — the mirror
   * entrance. Two overlapping "tap here" panels is exactly the friction
   * Coach Mode is supposed to remove, so this one stands down.
   */
  suppressed?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  if (status === "ready" || !voiceOn || suppressed) return null;

  const unsupported = status === "unsupported";
  const blocked = status === "blocked";

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center p-6 ${dark ? "bg-black/90" : "bg-background/95"} backdrop-blur`}
      role="dialog"
      aria-modal="true"
      aria-label="Enable coach audio"
    >
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{title}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">
          {unsupported ? "Sound isn't available on this device" : "Turn the coach's voice on"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {unsupported
            ? "This device isn't letting any app play audio right now. Every cue is still shown on screen and the countdown beeps still play. Check that the phone isn't on silent, then tap to try again."
            : blocked
              ? "The coach's voice didn't come through — we tried the streamed coach and your browser's built-in voice. Tap again to retry, and check the device isn't on silent and that this site is allowed to play sound."
              : "Tap once to start. The coach confirms out loud, then talks you through the whole session — warm-up, cues, countdowns, rest and cooldown."}
        </p>

        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onEnable();
            } finally {
              setBusy(false);
            }
          }}
          className="tap-target mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-5 text-lg font-black uppercase tracking-wide text-primary-foreground"
        >
          <Play className="size-6" />
          {busy
            ? "Starting…"
            : blocked || unsupported
              ? "Try coach voice again"
              : "Enable Coach Voice"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="tap-target mt-3 w-full rounded-2xl border border-border bg-elevated text-sm font-bold uppercase text-muted-foreground"
        >
          Continue without sound
        </button>
      </div>
    </div>
  );
}

export function CoachAudioBadge({
  status,
  voiceOn,
  onEnable,
  onToggleMute,
  dark = false,
}: {
  status: VoiceStatus;
  voiceOn: boolean;
  onEnable: () => void;
  onToggleMute: () => void;
  dark?: boolean;
}) {
  const muted = !voiceOn;
  const needsTap = voiceOn && (status === "locked" || status === "blocked");
  const unsupported = status === "unsupported";

  const label = unsupported
    ? "Tap to retry audio"
    : muted
      ? "Coach muted"
      : needsTap
        ? "Tap to enable audio"
        : "Coach audio on";

  const tone = dark
    ? unsupported || needsTap
      ? "border-amber-300 bg-amber-300/20 text-amber-200"
      : muted
        ? "border-white/25 bg-white/10 text-white/70"
        : "border-cyan-300 bg-cyan-300/20 text-cyan-200"
    : unsupported || needsTap
      ? "border-accent bg-accent/15 text-accent"
      : muted
        ? "border-border bg-elevated text-muted-foreground"
        : "border-primary bg-primary/15 text-primary";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => (needsTap || unsupported ? onEnable() : onToggleMute())}
      className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[11px] font-bold uppercase tracking-wide ${tone}`}
    >
      {unsupported || needsTap ? (
        <TriangleAlert className="size-4 shrink-0" />
      ) : muted ? (
        <VolumeX className="size-4 shrink-0" />
      ) : (
        <Volume2 className="size-4 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}