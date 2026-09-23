/**
 * REP CADENCE — the coach actually performs every rep with the user.
 * ------------------------------------------------------------------
 * A rep-based set has no clock in the script, so nothing used to drive
 * it: the coach's clip looped as wallpaper and the user had to tap.
 *
 * This is the missing beat. Once a set is live, a local clock counts the
 * coach's reps at the shared target tempo (seconds per rep from
 * motion-tempo). Everything that needs the beat — the HUD rep counter,
 * the "two more / last rep" calls, the automatic end of the set and the
 * user-versus-coach pace read-out — reads the SAME number.
 *
 * Purely local arithmetic. No new assets, no services.
 */
import { useEffect, useRef, useState } from "react";

export interface RepCadenceOpts {
  /** Changes whenever a new set starts — restarts the count at zero. */
  key: string;
  /** The set is live (running, countdown finished, rep-based). */
  active: boolean;
  /** Target reps for this set; null disables the cadence. */
  total: number | null;
  /** Target seconds for one full rep, from the shared tempo model. */
  secondsPerRep: number;
  /** Fired once per completed coach rep (1-based). */
  onRep?: (rep: number, total: number) => void;
  /** Fired once, shortly after the coach's final rep. */
  onDone?: (total: number) => void;
  /** Grace after the last rep before the set is called (seconds). */
  graceSec?: number;
}

/**
 * Returns the coach's current rep number (0 before the first rep, capped
 * at `total`). Ticks four times a second so the HUD feels live without
 * being expensive.
 */
export function useRepCadence(o: RepCadenceOpts): number {
  const [rep, setRep] = useState(0);
  const startedAt = useRef(0);
  const lastRep = useRef(0);
  const donePosted = useRef(false);
  const cb = useRef(o);
  cb.current = o;

  /* a new set — or a pause — resets the beat cleanly */
  useEffect(() => {
    startedAt.current = 0;
    lastRep.current = 0;
    donePosted.current = false;
    setRep(0);
  }, [o.key]);

  useEffect(() => {
    const { active, total, secondsPerRep } = o;
    if (!active || !total || total <= 0 || secondsPerRep <= 0) return;
    /* resume where the coach left off instead of restarting the set */
    startedAt.current = Date.now() - lastRep.current * secondsPerRep * 1000;
    const id = setInterval(() => {
      const spec = cb.current;
      const per = spec.secondsPerRep * 1000;
      const elapsed = Date.now() - startedAt.current;
      const n = Math.min(spec.total ?? 0, Math.floor(elapsed / per));
      if (n > lastRep.current) {
        lastRep.current = n;
        setRep(n);
        spec.onRep?.(n, spec.total ?? 0);
      }
      if (
        !donePosted.current &&
        spec.total &&
        lastRep.current >= spec.total &&
        elapsed >= (spec.total + (spec.graceSec ?? 1.5) / spec.secondsPerRep) * per
      ) {
        donePosted.current = true;
        spec.onDone?.(spec.total);
      }
    }, 250);
    return () => clearInterval(id);
  }, [o.active, o.total, o.secondsPerRep, o.key]);

  return rep;
}