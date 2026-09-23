/**
 * COACH FACE — the approved coach still, completely static.
 * ------------------------------------------------------------------
 * There is no genuine talking clip of this exact approved coach, and any
 * procedurally faked mouth / breath / body motion reads as a puppet, not a
 * person. While he speaks we show the clean front-facing still and let the
 * voice carry it. The image itself never moves, scales, filters, or animates
 * during speaking / eye-contact / rest / transition states.
 *
 * `useCoachLevel()` is still read so parent UI can show an off-image speaking
 * indicator, but it is no longer used to transform the coach photograph.
 *
 * If a real front-facing talking clip of this coach is ever approved, it
 * replaces this component's <img> — nothing else in Coach Mode changes.
 */
import { COACH_REFERENCE } from "@/data/coach-identity";
import { useCoachLevel } from "@/lib/coach-voice";

export function CoachFace({
  className = "",
  mirrored: _mirrored = false,
  /** Set false during movement clips: no speaking presence cue there. */
  enabled = true,
  alt = "Your coach",
  ...rest
}: {
  className?: string;
  /** Retained for call-site compatibility; the speaking still is never transformed. */
  mirrored?: boolean;
  enabled?: boolean;
  alt?: string;
} & Record<string, unknown>) {
  const level = useCoachLevel();
  const speaking = enabled && level > 0.1;

  return (
    <div
      className={`relative overflow-hidden ${className} transform-none transition-none [filter:none]`}
      data-testid="coach-face"
      data-speaking={speaking ? "true" : "false"}
      {...rest}
    >
      <img
        src={COACH_REFERENCE}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full transform-none object-cover object-top transition-none [filter:none]"
      />
    </div>
  );
}