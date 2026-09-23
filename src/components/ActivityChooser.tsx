import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from "lucide-react";
import {
  ACTIVITY_LABELS,
  ACTIVITY_OPTIONS,
  allLibraryExercises,
  quickActivityPlan,
  savedWorkoutPlan,
  toSessionExercise,
} from "@/lib/activities";
import {
  setState,
  updateDay,
  useApp,
  type ActivityFields,
  type ActivityType,
  type ExerciseCategory,
  type SavedWorkout,
  type SessionExercise,
  type SessionPlan,
} from "@/lib/store";

const emptyFields: ActivityFields = {
  durationMin: "30",
  distance: "",
  steps: "",
  vestLoad: "",
  incline: "",
  speed: "",
  calories: "",
  heartRate: "",
  notes: "",
};
const categories: ExerciseCategory[] = [
  "press",
  "pull",
  "curl",
  "triceps",
  "delts",
  "squat",
  "hinge",
  "carry",
  "boxing",
  "kick",
  "core",
  "mobility",
  "cardio",
];

function Field({
  label,
  value,
  onChange,
  mode = "decimal",
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  mode?: "decimal" | "numeric" | "text";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase text-muted-foreground">{label}</span>
      <input
        value={value ?? ""}
        inputMode={mode === "text" ? undefined : mode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3"
      />
    </label>
  );
}

export function ActivityChooser({
  day,
  open,
  onClose,
  onSelect,
}: {
  day: number;
  open: boolean;
  onClose: () => void;
  onSelect?: (plan: SessionPlan | null) => void;
}) {
  const library = useMemo(allLibraryExercises, []);
  const state = useApp();
  const [type, setType] = useState<ActivityType>("programmed");
  const [fields, setFields] = useState<ActivityFields>(emptyFields);
  const [custom, setCustom] = useState<Partial<SessionExercise>>({
    name: "",
    target: "Custom",
    sets: 3,
    reps: "10",
    rest: 60,
    load: "",
    category: "press",
  });
  const [builder, setBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState("My workout");
  const [items, setItems] = useState<SessionExercise[]>([]);
  const workouts: SavedWorkout[] = state.savedWorkouts;

  if (!open) return null;
  const patchField = (key: keyof ActivityFields, value: string) =>
    setFields((p) => ({ ...p, [key]: value }));
  const choose = (plan: SessionPlan | null) => {
    updateDay(day, (d) => ({
      ...d,
      sessionPlan: plan ?? undefined,
      health: plan
        ? {
            source: "manual",
            steps: Number(plan.fields.steps) || undefined,
            heartRate: Number(plan.fields.heartRate) || undefined,
            calories: Number(plan.fields.calories) || undefined,
            distance: Number(plan.fields.distance) || undefined,
            durationMin: Number(plan.fields.durationMin) || undefined,
            recordedAt: new Date().toISOString(),
          }
        : d.health,
      exercises: {},
      completed: false,
      completedAt: undefined,
      cursor: 0,
    }));
    onSelect?.(plan);
    onClose();
  };
  const saveWorkout = () => {
    if (!workoutName.trim() || !items.length) return;
    const now = new Date().toISOString();
    const workout: SavedWorkout = {
      id: editingId ?? crypto.randomUUID(),
      name: workoutName.trim(),
      exercises: items,
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({
      ...s,
      savedWorkouts: editingId
        ? s.savedWorkouts.map((w) =>
            w.id === editingId ? { ...workout, createdAt: w.createdAt } : w,
          )
        : [...s.savedWorkouts, workout],
    }));
    setEditingId(null);
    setWorkoutName("My workout");
    setItems([]);
    setBuilder(false);
  };
  const updateItem = (index: number, patch: Partial<SessionExercise>) =>
    setItems((p) => p.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  const move = (index: number, delta: number) =>
    setItems((p) => {
      const next = [...p];
      const to = index + delta;
      if (to < 0 || to >= next.length) return p;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Change today's workout"
    >
      <div className="mx-auto flex h-full w-full max-w-lg flex-col">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Coach session</p>
            <h2 className="text-2xl font-black">How are we training today?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-12 place-items-center rounded-xl bg-elevated"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 pb-28">
          {!builder ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Pick the plan. I’ll adapt the coaching and track the right numbers.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    aria-pressed={type === k}
                    className={`min-h-16 rounded-xl border px-3 text-sm font-bold ${type === k ? "border-primary bg-primary/20 text-primary" : "border-border bg-elevated"}`}
                  >
                    {ACTIVITY_LABELS[k]}
                  </button>
                ))}
              </div>
              {type !== "programmed" && type !== "custom-workout" && (
                <section className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-card p-3">
                  {type !== "custom-exercise" && (
                    <Field
                      label="Duration (min)"
                      value={fields.durationMin}
                      onChange={(v) => patchField("durationMin", v)}
                      mode="numeric"
                    />
                  )}
                  {type !== "custom-exercise" && (
                    <Field
                      label="Distance"
                      value={fields.distance}
                      onChange={(v) => patchField("distance", v)}
                      placeholder="miles or km"
                    />
                  )}
                  {type !== "custom-exercise" && (
                    <Field
                      label="Steps"
                      value={fields.steps}
                      onChange={(v) => patchField("steps", v)}
                      mode="numeric"
                    />
                  )}
                  {type === "weighted-vest-walk" && (
                    <Field
                      label="Vest load"
                      value={fields.vestLoad}
                      onChange={(v) => patchField("vestLoad", v)}
                      placeholder="20 lb"
                    />
                  )}
                  {(type === "treadmill" || type === "weighted-vest-walk") && (
                    <>
                      <Field
                        label="Incline"
                        value={fields.incline}
                        onChange={(v) => patchField("incline", v)}
                        placeholder="3%"
                      />
                      <Field
                        label="Speed"
                        value={fields.speed}
                        onChange={(v) => patchField("speed", v)}
                        placeholder="3.0 mph"
                      />
                    </>
                  )}
                  <Field
                    label="Calories (optional)"
                    value={fields.calories}
                    onChange={(v) => patchField("calories", v)}
                    mode="numeric"
                  />
                  <Field
                    label="Heart rate (optional)"
                    value={fields.heartRate}
                    onChange={(v) => patchField("heartRate", v)}
                    mode="numeric"
                  />
                  {type === "custom-exercise" && (
                    <>
                      <Field
                        label="Exercise name"
                        value={custom.name}
                        onChange={(v) => setCustom((p) => ({ ...p, name: v }))}
                        mode="text"
                      />
                      <Field
                        label="Target"
                        value={custom.target}
                        onChange={(v) => setCustom((p) => ({ ...p, target: v }))}
                        mode="text"
                      />
                      <Field
                        label="Sets"
                        value={String(custom.sets ?? "")}
                        onChange={(v) => setCustom((p) => ({ ...p, sets: Number(v) || 1 }))}
                        mode="numeric"
                      />
                      <Field
                        label="Reps / time"
                        value={custom.reps}
                        onChange={(v) => setCustom((p) => ({ ...p, reps: v }))}
                        mode="text"
                      />
                      <Field
                        label="Load"
                        value={custom.load}
                        onChange={(v) => setCustom((p) => ({ ...p, load: v }))}
                        placeholder="20 lb"
                      />
                      <Field
                        label="Rest (sec)"
                        value={String(custom.rest ?? "")}
                        onChange={(v) => setCustom((p) => ({ ...p, rest: Number(v) || 0 }))}
                        mode="numeric"
                      />
                    </>
                  )}
                  <label className="col-span-2 block">
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">
                      Notes
                    </span>
                    <textarea
                      value={fields.notes ?? ""}
                      onChange={(e) => patchField("notes", e.target.value)}
                      className="mt-1 min-h-20 w-full rounded-xl border border-input bg-elevated p-3"
                    />
                  </label>
                </section>
              )}
              {type === "custom-workout" && (
                <div className="mt-4 space-y-2">
                  {workouts.map((w) => (
                    <div key={w.id} className="rounded-xl bg-elevated p-3">
                      <p className="font-bold">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.exercises.length} movements
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => choose(savedWorkoutPlan(w))}
                          className="min-h-11 rounded-lg bg-primary text-xs font-bold text-primary-foreground"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(w.id);
                            setWorkoutName(w.name);
                            setItems(w.exercises.map((e) => ({ ...e })));
                            setBuilder(true);
                          }}
                          className="min-h-11 rounded-lg bg-card text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Duplicate ${w.name}`}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              savedWorkouts: [
                                ...s.savedWorkouts,
                                {
                                  ...w,
                                  id: crypto.randomUUID(),
                                  name: `${w.name} copy`,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                },
                              ],
                            }))
                          }
                          className="grid min-h-11 place-items-center rounded-lg bg-card"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${w.name}`}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              savedWorkouts: s.savedWorkouts.filter((x) => x.id !== w.id),
                            }))
                          }
                          className="grid min-h-11 place-items-center rounded-lg bg-destructive/15 text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!workouts.length && (
                    <p className="rounded-xl bg-elevated p-4 text-sm text-muted-foreground">
                      No saved workouts yet.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setBuilder(true)}
                    className="tap-target w-full rounded-xl bg-elevated font-bold"
                  >
                    Build a workout
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  type === "programmed"
                    ? choose(null)
                    : type === "custom-workout"
                      ? setBuilder(true)
                      : choose(quickActivityPlan(type, fields, custom))
                }
                className="tap-target mt-5 w-full rounded-xl bg-primary text-base font-black uppercase text-primary-foreground"
              >
                {type === "programmed"
                  ? "Use today's program"
                  : type === "custom-workout"
                    ? "Build a workout"
                    : `Use ${ACTIVITY_LABELS[type]}`}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">Workout builder</p>
                  <h3 className="text-xl font-black">Build your sequence</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBuilder(false)}
                  className="min-h-11 rounded-xl bg-elevated px-3 text-xs font-bold uppercase"
                >
                  Back
                </button>
              </div>
              <div className="mt-3">
                <Field
                  label="Workout name"
                  value={workoutName}
                  onChange={setWorkoutName}
                  mode="text"
                />
              </div>
              <label className="mt-3 block">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">
                  Add from exercise library
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const found = library.find((x) => x.id === e.target.value);
                    if (found)
                      setItems((p) => [
                        ...p,
                        { ...toSessionExercise(found), id: `${found.id}-${crypto.randomUUID()}` },
                      ]);
                    e.target.value = "";
                  }}
                  className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3"
                >
                  <option value="">Choose an exercise…</option>
                  {library.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  setItems((p) => [
                    ...p,
                    {
                      id: `custom-${crypto.randomUUID()}`,
                      name: "Custom exercise",
                      target: "Custom",
                      sets: 3,
                      reps: "10",
                      rest: 60,
                      diagram: "custom",
                      tracked: true,
                      category: "press",
                    },
                  ])
                }
                className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold"
              >
                <Plus className="size-4" /> Add custom exercise
              </button>
              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex gap-1">
                      <input
                        aria-label={`Exercise ${index + 1} name`}
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        className="min-w-0 flex-1 rounded-lg bg-elevated px-3 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        aria-label="Move up"
                        className="grid size-11 place-items-center rounded-lg bg-elevated"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        aria-label="Move down"
                        className="grid size-11 place-items-center rounded-lg bg-elevated"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItems((p) => p.filter((_, i) => i !== index))}
                        aria-label="Remove"
                        className="grid size-11 place-items-center rounded-lg bg-destructive/15 text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <Field
                        label="Sets"
                        value={String(item.sets)}
                        onChange={(v) => updateItem(index, { sets: Number(v) || 1 })}
                        mode="numeric"
                      />
                      <Field
                        label="Reps/time"
                        value={item.reps}
                        onChange={(v) => updateItem(index, { reps: v })}
                        mode="text"
                      />
                      <Field
                        label="Rest"
                        value={String(item.rest)}
                        onChange={(v) => updateItem(index, { rest: Number(v) || 0 })}
                        mode="numeric"
                      />
                      <Field
                        label="Load"
                        value={item.load}
                        onChange={(v) => updateItem(index, { load: v })}
                      />
                    </div>
                    <label className="mt-2 block">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Coach category
                      </span>
                      <select
                        value={item.category ?? "press"}
                        onChange={(e) =>
                          updateItem(index, { category: e.target.value as ExerciseCategory })
                        }
                        className="mt-1 h-10 w-full rounded-lg bg-elevated px-2 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    {!item.mirror && (
                      <p className="mt-2 text-[11px] text-accent">
                        Coach will lead with spoken cues; an approved motion demo is not available
                        for this custom movement.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!items.length || !workoutName.trim()}
                onClick={saveWorkout}
                className="tap-target mt-4 w-full rounded-xl bg-primary text-base font-black uppercase text-primary-foreground disabled:opacity-40"
              >
                Save reusable workout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}