import { useState } from "react";
import { Share2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  DEFAULT_SHARE_OPTIONS,
  buildShareData,
  cardPdf,
  cardPng,
  logText,
  shareFile,
  shareText,
  socialText,
  type ShareOptions,
} from "@/lib/share-workout";

/**
 * "Share workout" button + sheet. Everything is generated on this device:
 * a social caption, a full training log, a summary card image or a PDF.
 * You choose what goes in before anything leaves the app.
 */
export function ShareWorkout({
  day,
  label = "Share workout",
  className = "",
}: {
  day: number;
  label?: string;
  className?: string;
}) {
  const state = useApp();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const data = () => buildShareData(state, day, opts);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    try {
      setStatus(await fn());
    } catch {
      setStatus("Could not create that file on this device.");
    }
    setBusy(false);
  };

  const toggles: { key: keyof ShareOptions; label: string }[] = [
    { key: "weights", label: "Include weights and reps" },
    { key: "notes", label: "Include my workout notes" },
    { key: "pain", label: "Include pain and form flags" },
  ];

  const actions: { label: string; hint: string; run: () => Promise<string> }[] = [
    {
      label: "Share summary text",
      hint: "Short caption for messages or social",
      run: () => shareText(socialText(data()), "Workout summary"),
    },
    {
      label: "Share full training log",
      hint: "Every set, line by line",
      run: () => shareText(logText(data()), "Training log"),
    },
    {
      label: "Share summary image",
      hint: "Dark card, PNG",
      run: async () => {
        const d = data();
        return shareFile(await cardPng(d), `${d.fileBase}.png`, d.title);
      },
    },
    {
      label: "Save as PDF",
      hint: "One page, ready to print or send",
      run: async () => {
        const d = data();
        return shareFile(await cardPdf(d), `${d.fileBase}.pdf`, d.title);
      },
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("");
          setOpen(true);
        }}
        className={`tap-target flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-bold uppercase ${className}`}
      >
        <Share2 className="size-5" aria-hidden /> {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share workout"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-background/85 p-4 backdrop-blur"
        >
          <div className="surface-card max-h-[88vh] w-full max-w-lg overflow-auto rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Share workout</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Built on your phone. Nothing is uploaded and nothing is branded.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-elevated"
              >
                <X className="size-5" />
              </button>
            </div>

            <h3 className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              What to include
            </h3>
            <div className="mt-2 space-y-2">
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={opts[t.key]}
                  onClick={() => setOpts((p) => ({ ...p, [t.key]: !p[t.key] }))}
                  className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-left text-sm font-semibold"
                >
                  {t.label}
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                      opts[t.key]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {opts[t.key] ? "On" : "Off"}
                  </span>
                </button>
              ))}
            </div>

            <h3 className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Format
            </h3>
            <div className="mt-2 space-y-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  disabled={busy}
                  onClick={() => run(a.run)}
                  className="tap-target w-full rounded-xl bg-elevated px-4 py-3 text-left disabled:opacity-50"
                >
                  <span className="block text-sm font-bold uppercase">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.hint}</span>
                </button>
              ))}
            </div>

            {status && (
              <p role="status" className="mt-3 rounded-xl bg-elevated p-3 text-sm text-accent">
                {status}
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="tap-target mt-4 w-full rounded-xl border border-border bg-card text-sm font-bold uppercase"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}