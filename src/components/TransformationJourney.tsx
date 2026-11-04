import { useMemo, useState } from "react";
import type { Measurement } from "@/lib/store";
import { shareJourney, summarizeJourney } from "@/lib/transformation-journey";

interface Props {
  measurements: readonly Measurement[];
  completedWorkouts: number;
}

/** Adds trainer-journey proof to the existing Progress page without a new data store. */
export function TransformationJourney({ measurements, completedWorkouts }: Props) {
  const summary = useMemo(
    () => summarizeJourney(measurements, completedWorkouts),
    [measurements, completedWorkouts],
  );
  const [includeWeight, setIncludeWeight] = useState(false);
  const [includeWaist, setIncludeWaist] = useState(false);
  const [status, setStatus] = useState("");
  const shareText = shareJourney(summary, { includeWeight, includeWaist });

  function exportLog() {
    try {
      const document = {
        format: "m3-flex-transformation-v1",
        exportedAt: new Date().toISOString(),
        summary,
        measurements: measurements.map((m) => ({
          date: m.date,
          bodyweight: m.bodyweight,
          waist: m.waist,
          leftFlexed: m.leftFlexed,
          rightFlexed: m.rightFlexed,
          leftRelaxed: m.leftRelaxed,
          rightRelaxed: m.rightRelaxed,
        })),
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }));
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = "m3-flex-transformation-" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.style.display = "none";
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus("Private data export requested. Confirm the JSON file in your Downloads folder.");
    } catch {
      setStatus("Export unavailable in this browser. Your original records have not been changed.");
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("Selected progress summary copied. Nothing was published.");
    } catch {
      setStatus("Copy is blocked in this browser. Select and copy the summary text below manually.");
    }
  }

  const format = (value: number | null) => value === null ? "Not recorded" : String(value);
  return (
    <section data-testid="flex-transformation-journey" className="surface-card mt-5 rounded-2xl border border-primary/30 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-primary">M3 FLEX · Trainer Journey</p>
      <h2 className="mt-2 text-xl font-bold">My transformation, documented</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep your training evidence private while building a credible future personal-training portfolio.
        This tracks logged activity, not medical clearance or professional certification.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-muted-foreground">Completed workouts</p><p className="text-2xl font-black">{summary.completedWorkouts}</p></div>
        <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-muted-foreground">Measurement check-ins</p><p className="text-2xl font-black">{summary.entries}</p></div>
        <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-muted-foreground">Last bodyweight</p><p className="text-lg font-bold">{format(summary.latestWeight)}</p></div>
        <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-muted-foreground">Bodyweight change</p><p className="text-lg font-bold">{format(summary.weightChange)}</p></div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Weight and waist measurements use the units you entered in Progress. A change is calculated only when two valid values exist; it is not a body-fat estimate.</p>
      <button type="button" onClick={exportLog} className="tap-target mt-4 w-full rounded-xl border border-primary px-4 py-3 font-bold">Export my private journey (JSON)</button>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-lg font-bold">Optional future trainer portfolio</h3>
        <p className="mt-1 text-sm text-muted-foreground">Nothing below is automatically posted. Your photos, injury details, and private exercise notes are never included in this summary.</p>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-5" checked={includeWeight} onChange={(e) => setIncludeWeight(e.target.checked)} />
          Include my recorded bodyweight change in the copied summary
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-5" checked={includeWaist} onChange={(e) => setIncludeWaist(e.target.checked)} />
          Include my recorded waist change in the copied summary
        </label>
        <label className="mt-3 block text-sm font-semibold" htmlFor="trainer-share-preview">Preview the exact text before copying</label>
        <textarea id="trainer-share-preview" value={shareText} readOnly rows={7} className="mt-2 w-full rounded-xl border border-border bg-elevated p-3 text-sm" />
        <button type="button" onClick={copySummary} className="tap-target mt-2 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Copy selected summary (no publishing)</button>
      </div>
      {status && <p role="status" className="mt-3 text-sm text-muted-foreground">{status}</p>}
    </section>
  );
}
