import { useState } from "react";
import { Eye, X, ZoomIn, ZoomOut } from "lucide-react";
import { guideFor } from "@/data/guides";

/** Inline guide image for a training day. */
export function GuideImage({ dayKey, className = "" }: { dayKey: string; className?: string }) {
  const g = guideFor(dayKey);
  if (!g) return null;
  return (
    <img
      src={g.src}
      alt={g.alt}
      loading="lazy"
      className={`w-full rounded-xl border border-border bg-card object-contain ${className}`}
    />
  );
}

/** Big "View Guide" button that opens the day's guide image full screen. */
export function ViewGuideButton({
  dayKey,
  label = "View Guide",
}: {
  dayKey: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const g = guideFor(dayKey);
  if (!g) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setZoom(1);
          setOpen(true);
        }}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/15 px-4 text-base font-bold uppercase tracking-wide text-primary active:bg-primary/30"
      >
        <Eye className="size-5" aria-hidden />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-auto bg-background/98 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label={g.title}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3">
            <h2 className="truncate text-lg font-bold">{g.title}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                className="grid size-11 place-items-center rounded-lg bg-elevated"
              >
                <ZoomOut className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                className="grid size-11 place-items-center rounded-lg bg-elevated"
              >
                <ZoomIn className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Close guide"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="overflow-auto p-3 pb-24" style={{ touchAction: "pinch-zoom pan-y" }}>
            <img
              src={g.src}
              alt={g.alt}
              style={{
                width: `${zoom * 100}%`,
                maxWidth: "none",
                maxHeight: zoom === 1 ? "calc(100vh - 8rem)" : "none",
                objectFit: "contain",
                margin: "0 auto",
              }}
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}