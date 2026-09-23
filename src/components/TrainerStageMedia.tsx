/**
 * TRAINER STAGE MEDIA
 * ------------------------------------------------------------------
 * The only component allowed to choose between the approved static coach
 * portrait and an exercise clip on the full-screen Coach Mode stage.
 */
import { CoachFace } from "@/components/CoachFace";
import { CoachMotion } from "@/components/CoachMotion";
import { AMBIENT_RATE } from "@/lib/coach-ambient";
import type { TrainerMediaDecision } from "@/lib/trainer-media-state";

export function TrainerStageMedia({
  decision,
  preloadMotion,
  mirrored,
  playing,
  rate,
  label,
}: {
  decision: TrainerMediaDecision;
  preloadMotion?: { url: string; poster?: string };
  mirrored?: boolean;
  playing: boolean;
  rate: number;
  label: string;
}) {
  const motion = decision.mode === "motion" ? decision.motion : undefined;
  const ambient = motion ? undefined : decision.ambient;

  return (
    <div
      className="absolute inset-0"
      data-testid="trainer-stage-media"
      data-trainer-state={decision.state}
      data-media-mode={decision.mode}
      data-ambient={ambient ? "true" : "false"}
      data-ambient-motion={ambient?.url ?? ""}
      data-visible-motion={motion?.url ?? ""}
      data-preload-motion={preloadMotion?.url ?? ""}
    >
      {ambient ? (
        /* PRESENCE — the same approved coach, alive between working sets.
           Held slightly back so it never competes with the spoken cue. */
        <>
          <CoachMotion
            url={ambient.url}
            poster={ambient.poster}
            mirrored={mirrored}
            playing
            rate={AMBIENT_RATE}
            preloadUrl={preloadMotion?.url}
            className="h-full w-full"
            label={`${label} — your coach`}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
        </>
      ) : motion ? (
        <CoachMotion
          url={motion.url}
          poster={motion.poster}
          mirrored={mirrored}
          playing={playing}
          rate={rate}
          preloadUrl={preloadMotion?.url}
          className="h-full w-full"
          label={label}
        />
      ) : (
        <>
          <CoachFace
            enabled
            data-testid="stage-still"
            data-visible="true"
            className="absolute inset-0 h-full w-full"
          />
          {preloadMotion && (
            <video
              src={preloadMotion.url}
              muted
              playsInline
              preload="auto"
              data-testid="coach-preload"
              className="pointer-events-none absolute size-px opacity-0"
              aria-hidden
            />
          )}
        </>
      )}
    </div>
  );
}