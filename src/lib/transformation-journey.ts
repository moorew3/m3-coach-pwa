/** Portable, provider-independent M3 FLEX transformation summary. No network or tracking. */
export type JourneyMeasurement = {
  id: string;
  date: string;
  bodyweight: string;
  waist: string;
};

export type JourneySummary = {
  entries: number;
  startDate: string | null;
  latestDate: string | null;
  startWeight: number | null;
  latestWeight: number | null;
  weightChange: number | null;
  startWaist: number | null;
  latestWaist: number | null;
  waistChange: number | null;
  completedWorkouts: number;
};

/** Reject missing/implausible values; never invent a measurement or body-fat percentage. */
function numeric(value: string, min: number, max: number): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function firstLast(values: { date: string; value: number }[]) {
  if (!values.length) return { first: null, last: null, difference: null };
  const first = values[0].value;
  const last = values[values.length - 1].value;
  return { first, last, difference: values.length > 1 ? Number((last - first).toFixed(1)) : null };
}

export function summarizeJourney(measurements: readonly JourneyMeasurement[], completedWorkouts: number): JourneySummary {
  const ordered = [...measurements]
    .filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weight = firstLast(ordered.map((m) => ({ date: m.date, value: numeric(m.bodyweight, 40, 1500) }))
    .filter((m): m is { date: string; value: number } => m.value !== null));
  const waist = firstLast(ordered.map((m) => ({ date: m.date, value: numeric(m.waist, 10, 100) }))
    .filter((m): m is { date: string; value: number } => m.value !== null));
  return {
    entries: ordered.length,
    startDate: ordered[0]?.date ?? null,
    latestDate: ordered.at(-1)?.date ?? null,
    startWeight: weight.first,
    latestWeight: weight.last,
    weightChange: weight.difference,
    startWaist: waist.first,
    latestWaist: waist.last,
    waistChange: waist.difference,
    completedWorkouts: Math.max(0, Math.trunc(Number.isFinite(completedWorkouts) ? completedWorkouts : 0)),
  };
}

/** Public summary excludes ALL measurements by default, plus photos/medical/identity records always. */
export function shareJourney(summary: JourneySummary, options: { includeWeight: boolean; includeWaist: boolean }): string {
  const lines = [
    "M3 FLEX | My Road to Becoming a Personal Trainer",
    "Building consistency, strength, and experience with guided workouts.",
    "Workouts recorded: " + summary.completedWorkouts,
  ];
  if (summary.startDate && summary.latestDate) lines.push("Progress log: " + summary.startDate + " to " + summary.latestDate);
  if (options.includeWeight && summary.weightChange !== null) {
    lines.push("Bodyweight change (units as recorded): " + (summary.weightChange > 0 ? "+" : "") + summary.weightChange);
  }
  if (options.includeWaist && summary.waistChange !== null) {
    lines.push("Waist change (units as recorded): " + (summary.waistChange > 0 ? "+" : "") + summary.waistChange);
  }
  lines.push("Documenting my own journey. Not a claim of certification or client results.");
  return lines.join("\n");
}
