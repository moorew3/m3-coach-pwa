/**
 * EXERCISE DEMO LIBRARY — lightweight entry point.
 * ------------------------------------------------------------------
 * Only the button lives here. The browsable catalog (which pulls in the
 * full Mirror Me data set, the MirrorMe card and every movement asset)
 * is code-split and fetched on first tap, so the Today screen's initial
 * load stays small and a media-chunk failure can never blank the route.
 */
import { Suspense, lazy, useState } from "react";
import { Eye } from "lucide-react";

const ExerciseLibraryModal = lazy(() => import("@/components/ExerciseLibraryModal"));

export function ExerciseLibraryButton({ label = "Exercise demo library" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="open-exercise-library"
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent/15 px-4 text-base font-bold uppercase tracking-wide text-accent active:bg-accent/30"
      >
        <Eye className="size-4" aria-hidden />
        {label}
      </button>

      {open && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-background/95 text-sm text-muted-foreground"
              role="status"
            >
              Loading exercise library…
            </div>
          }
        >
          <ExerciseLibraryModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}