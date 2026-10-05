import type { ExerciseMotion } from "@/data/coach-identity";

/** Credit stays attached to the footage on every exercise viewing surface. */
export function MotionCredit({ motion }: { motion: ExerciseMotion }) {
  if (motion.actor !== "demonstrator") return null;
  return (
    <details className="absolute left-3 top-3 z-10 max-w-[min(21rem,85%)] rounded-lg bg-background/90 px-3 py-2 text-xs text-foreground shadow-lg">
      <summary className="cursor-pointer text-[10px] font-extrabold uppercase tracking-widest text-primary">
        Workout Partner Demo{motion.variant ? ` · ${motion.variant}` : ""}
      </summary>
      {motion.credit && (
        <div className="mt-2 space-y-2">
          <p>
            {motion.credit.author} ·{" "}
            <a
              className="underline"
              href={motion.credit.licenseUrl}
              target="_blank"
              rel="noreferrer"
            >
              {motion.credit.license}
            </a>
          </p>
          <a
            className="inline-block underline"
            href={motion.credit.source}
            target="_blank"
            rel="noreferrer"
          >
            Original footage
          </a>
          <p>{motion.credit.changes}</p>
          {motion.credit.disclaimer && <p>{motion.credit.disclaimer}</p>}
        </div>
      )}
    </details>
  );
}
