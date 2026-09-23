import type { HealthMetrics } from "@/lib/store";

/**
 * Reads an activity export file from a phone health app (Samsung Health,
 * Google Fit / Health Connect export, Fitbit, Garmin — CSV or JSON) and pulls
 * out the basic daily metrics. Free, local, no aggregator service.
 */

const KEYS: Record<keyof Omit<HealthMetrics, "source" | "provider" | "recordedAt">, string[]> = {
  steps: ["steps", "step_count", "total steps"],
  heartRate: ["heart_rate", "heartrate", "heart rate", "avg_hr", "average heart rate"],
  calories: ["calorie", "calories", "active_calories", "energy"],
  distance: ["distance", "distance_km", "distance_mi", "total distance"],
  durationMin: ["duration", "duration_min", "active_time", "workout duration"],
  activeMinutes: ["active_minutes", "active minutes", "move_minutes", "exercise_minutes"],
  paceMinPerMile: ["pace", "avg_pace", "average pace"],
};

function pick(row: Record<string, string | number>, names: string[]): number | undefined {
  for (const [key, value] of Object.entries(row)) {
    const k = key.toLowerCase().trim();
    if (names.some((n) => k === n || k.includes(n))) {
      const num = Number(String(value).replace(/[^0-9.]/g, ""));
      if (Number.isFinite(num) && num > 0) return num;
    }
  }
  return undefined;
}

function fromRow(row: Record<string, string | number>): HealthMetrics | null {
  const out: HealthMetrics = { source: "imported", recordedAt: new Date().toISOString() };
  let found = false;
  for (const [field, names] of Object.entries(KEYS) as [keyof typeof KEYS, string[]][]) {
    const value = pick(row, names);
    if (value !== undefined) {
      out[field] = value;
      found = true;
    }
  }
  return found ? out : null;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

/** Returns the most complete record found in the file, or null. */
export function parseHealthExport(fileName: string, text: string): HealthMetrics | null {
  let rows: Record<string, string | number>[] = [];
  try {
    if (/\.json$/i.test(fileName) || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      const data = JSON.parse(text);
      rows = Array.isArray(data) ? data : [data];
    } else {
      rows = parseCsv(text);
    }
  } catch {
    return null;
  }
  const parsed = rows.map(fromRow).filter(Boolean) as HealthMetrics[];
  if (!parsed.length) return null;
  const score = (m: HealthMetrics) => Object.values(m).filter((v) => typeof v === "number").length;
  const best = parsed.sort((a, b) => score(b) - score(a))[0];
  return { ...best, provider: fileName.replace(/\.[^.]+$/, "") };
}