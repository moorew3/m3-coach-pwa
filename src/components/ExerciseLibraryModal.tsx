/**
 * EXERCISE DEMO LIBRARY — heavy content (lazy-loaded).
 * ------------------------------------------------------------------
 * Browsable list of EVERY movement in the centralized Mirror Me catalog
 * (ALL_MIRROR_MOVES). Nothing is hidden because media is missing — each
 * row shows the approved coach clip state honestly ("Coach motion" vs
 * "Motion pending"). The canonical coach identity guard is untouched:
 * media state is read through coachStatusFor()/coachMotionFor() only.
 *
 * This module pulls in the full mirror catalog and the MirrorMe card, so
 * it is imported lazily by ExerciseLibrary.tsx and never ships on the
 * Today screen's critical path.
 */
import { useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { ALL_MIRROR_MOVES, type MirrorMove } from "@/data/mirror-me";
import { coachStillFor, coachStatusFor } from "@/data/coach-identity";
import { MirrorMeCard } from "@/components/MirrorMe";

type Category =
  | "Warm-up & mobility"
  | "Cardio"
  | "Core"
  | "Push"
  | "Pull"
  | "Legs"
  | "Biceps"
  | "Triceps"
  | "Boxing"
  | "Carry & combo";

const CATEGORY_BY_ID: Record<string, Category> = {
  // warm-up & mobility
  hipFlexorStretch: "Warm-up & mobility",
  shoulderMobility: "Warm-up & mobility",
  chestMobility: "Warm-up & mobility",
  hamstringMobility: "Warm-up & mobility",
  lowerBodyMobility: "Warm-up & mobility",
  bandPullApart: "Warm-up & mobility",
  externalRotation: "Warm-up & mobility",
  controlledShoulderWork: "Warm-up & mobility",
  // cardio
  easyWalk: "Cardio",
  battleRopeFinisher: "Cardio",
  lightPunches: "Cardio",
  // core
  deadBug: "Core",
  gluteBridge: "Core",
  farmerMarch: "Core",
  // push
  shoulderPress: "Push",
  lateralRaise: "Push",
  benchPress: "Push",
  inclineDumbbellPress: "Push",
  chestPress: "Push",
  medBallChestPass: "Push",
  // pull
  rearDeltFly: "Pull",
  chestSupportedRow: "Pull",
  latPulldown: "Pull",
  seatedRow: "Pull",
  reverseStepRow: "Pull",
  // legs
  squat: "Legs",
  romanianDeadlift: "Legs",
  trapBarDeadlift: "Legs",
  legPress: "Legs",
  bulgarianSplitSquat: "Legs",
  hamstringCurl: "Legs",
  // biceps
  dumbbellCurl: "Biceps",
  hammerCurl: "Biceps",
  // triceps
  tricepsPressdown: "Triceps",
  // boxing / kickboxing
  boxingStance: "Boxing",
  jab: "Boxing",
  cross: "Boxing",
  jabCross: "Boxing",
  defensiveReset: "Boxing",
  cablePunch: "Boxing",
  frontKick: "Boxing",
  roundKick: "Boxing",
  kneeChamber: "Boxing",
  guardReset: "Boxing",
  // carries & step combos
  suitcaseCarry: "Carry & combo",
  squatToCurl: "Carry & combo",
  stepAltCurl: "Carry & combo",
  stepShoulderPress: "Carry & combo",
};

const categoryOf = (move: MirrorMove): Category => CATEGORY_BY_ID[move.id] ?? "Carry & combo";

const CATEGORIES: Category[] = [
  "Warm-up & mobility",
  "Cardio",
  "Core",
  "Push",
  "Pull",
  "Legs",
  "Biceps",
  "Triceps",
  "Boxing",
  "Carry & combo",
];

function thumbFor(move: MirrorMove): string | undefined {
  // Every library row uses the verified frame for this exact movement.
  // There is deliberately no universal avatar or generic-image fallback.
  return coachStillFor(move.id);
}

export default function ExerciseLibraryModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [selected, setSelected] = useState<MirrorMove | null>(null);

  const moves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_MIRROR_MOVES.filter((m) => {
      if (cat !== "All" && categoryOf(m) !== cat) return false;
      if (!q) return true;
      // Media state is never part of the filter.
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.equipment.toLowerCase().includes(q) ||
        categoryOf(m).toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Exercise demo library"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold uppercase tracking-widest text-primary">
            Exercise library
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-lg bg-elevated"
          >
            <X className="size-5" />
          </button>
        </div>

        {!selected && (
          <>
            <label className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-elevated px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises…"
                aria-label="Search exercises"
                data-testid="library-search"
                className="tap-target w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {(["All", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                    cat === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-elevated text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3 pb-16">
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="tap-target mb-3 rounded-xl bg-elevated px-3 text-sm font-bold uppercase tracking-wide"
            >
              ← All exercises
            </button>
            <MirrorMeCard move={selected} />
          </>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground" data-testid="library-count">
              {moves.length} exercise{moves.length === 1 ? "" : "s"}
            </p>
            <ul className="grid w-full grid-cols-1 gap-2">
              {moves.map((m) => {
                const status = coachStatusFor(m.id);
                const thumb = thumbFor(m);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      data-testid="library-item"
                      data-exercise-id={m.id}
                      onClick={() => setSelected(m)}
                      className="surface-card flex w-full items-center gap-3 rounded-2xl border border-border p-2 text-left active:bg-elevated"
                    >
                      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-elevated">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <Eye className="size-5 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold leading-tight">{m.name}</span>
                        <span className="block truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                          {categoryOf(m)} · {m.equipment}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          status === "coach"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status === "coach" ? "Coach motion" : "Motion pending"}
                      </span>
                    </button>
                  </li>
                );
              })}
              {moves.length === 0 && (
                <li className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  No exercises match that search.
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}