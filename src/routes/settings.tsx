import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, UserRound } from "lucide-react";
import { exportData, importData, resetAll, setState, useApp } from "@/lib/store";
import { CastConnect } from "@/components/CastConnect";
import { SessionAudio } from "@/components/SessionAudio";
import { CloudSync } from "@/components/CloudSync";
import { HealthPanel } from "@/components/HealthPanel";
import { RELEASE, surfaceLabel } from "@/lib/build-info";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content: "Theme, units, timer feedback, backup and restore, and program reset.",
      },
      { property: "og:title", content: "Settings — 22-Day Arm Growth Tracker" },
      { property: "og:description", content: "Configure your 22-day arm growth tracker." },
    ],
  }),
  component: SettingsPage,
});

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-base font-semibold"
    >
      {label}
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
          value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {value ? "On" : "Off"}
      </span>
    </button>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`tap-target flex-1 rounded-xl text-sm font-bold uppercase ${
              o === value
                ? "bg-primary text-primary-foreground"
                : "bg-elevated text-muted-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const [surface, setSurface] = useState("");
  useEffect(() => setSurface(surfaceLabel()), []);
  const state = useApp();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const set = (patch: Partial<typeof s>) =>
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arm-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
  };

  return (
    <main className="px-4 pt-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <CloudSync />

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" />
          <h2 className="text-lg font-bold uppercase">Your avatar</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          The approved coach always demonstrates and coaches. Your avatar is a separate profile
          choice for your own progress views.
        </p>
        {state.userAvatar.kind === "uploaded" && state.userAvatar.image && (
          <img
            src={state.userAvatar.image}
            alt="Your selected avatar"
            className={`size-24 object-cover ${state.userAvatar.shape === "circle" ? "rounded-full" : "rounded-xl"} ${state.userAvatar.frame === "gold" ? "ring-4 ring-primary" : state.userAvatar.frame === "cyan" ? "ring-4 ring-accent" : ""}`}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="tap-target rounded-xl bg-elevated text-sm font-bold"
          >
            Upload my avatar
          </button>
          <button
            type="button"
            onClick={() => setState((p) => ({ ...p, userAvatar: { kind: "default" } }))}
            className="tap-target rounded-xl bg-elevated text-sm font-bold"
          >
            Use default
          </button>
        </div>
        <label className="block">
          <span className="text-[11px] uppercase text-muted-foreground">Display name</span>
          <input
            value={state.userAvatar.displayName ?? ""}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                userAvatar: { ...p.userAvatar, displayName: e.target.value },
              }))
            }
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3"
            aria-label="Display name"
          />
        </label>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Avatar shape">
          {(["square", "circle"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={(state.userAvatar.shape ?? "square") === s}
              onClick={() => setState((p) => ({ ...p, userAvatar: { ...p.userAvatar, shape: s } }))}
              className={`tap-target rounded-xl text-sm font-bold capitalize ${(state.userAvatar.shape ?? "square") === s ? "bg-primary text-primary-foreground" : "bg-elevated"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Avatar frame">
          {(["none", "gold", "cyan"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={(state.userAvatar.frame ?? "none") === f}
              onClick={() => setState((p) => ({ ...p, userAvatar: { ...p.userAvatar, frame: f } }))}
              className={`tap-target rounded-xl text-sm font-bold capitalize ${(state.userAvatar.frame ?? "none") === f ? "bg-primary text-primary-foreground" : "bg-elevated"}`}
            >
              {f === "none" ? "No frame" : `${f} frame`}
            </button>
          ))}
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Upload your avatar"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 6_000_000) {
              setMessage("Please choose a photo under 6 MB.");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") return;
              const img = new Image();
              img.onload = () => {
                const size = 320;
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                const side = Math.min(img.width, img.height);
                ctx.drawImage(
                  img,
                  (img.width - side) / 2,
                  (img.height - side) / 2,
                  side,
                  side,
                  0,
                  0,
                  size,
                  size,
                );
                setState((p) => ({
                  ...p,
                  userAvatar: {
                    ...p.userAvatar,
                    kind: "uploaded",
                    image: canvas.toDataURL("image/jpeg", 0.85),
                  },
                }));
                setMessage("Avatar saved.");
              };
              img.src = reader.result;
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </section>

      <HealthPanel />

      <div className="mt-5">
        <SessionAudio />
      </div>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Display mode</h2>
        <p className="text-sm text-muted-foreground">
          Optional. On a TV or touchscreen computer open the display page, then pair this phone.
          Only the current workout is shared — never history, measurements or nutrition.
        </p>
        <Link
          to="/display"
          className="tap-target flex items-center justify-center rounded-xl bg-elevated text-sm font-bold uppercase"
        >
          Open display mode on this device
        </Link>
        <CastConnect compact />
      </section>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Program</h2>
        <label className="block">
          <span className="text-sm text-muted-foreground">Start date (Day 1)</span>
          <input
            type="date"
            value={state.startDate}
            onChange={(e) => setState((p) => ({ ...p, startDate: e.target.value }))}
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-lg"
          />
        </label>
        <Choice
          label="Units"
          options={["lb", "kg"] as const}
          value={s.units}
          onChange={(v) => set({ units: v })}
        />
      </section>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Training</h2>
        <Toggle
          label="Use supersets by default"
          value={s.useSupersets}
          onChange={(v) => set({ useSupersets: v })}
        />
        <Toggle
          label="Auto-start working rest"
          value={s.autoRest}
          onChange={(v) => set({ autoRest: v })}
        />
        <Toggle
          label="Auto-advance warm-ups"
          value={s.autoAdvanceWarmups}
          onChange={(v) => set({ autoAdvanceWarmups: v })}
        />
        <Toggle
          label="Auto-advance after rest"
          value={s.autoAdvanceAfterRest}
          onChange={(v) => set({ autoAdvanceAfterRest: v })}
        />

        <Toggle
          label="Coach voice (spoken cues)"
          value={s.coachVoice !== false}
          onChange={(v) => set({ coachVoice: v })}
        />
        <Toggle
          label="Adaptive weight suggestions"
          value={s.adaptive}
          onChange={(v) => set({ adaptive: v })}
        />
        <p className="text-sm text-muted-foreground">
          Supersets pair the recommended exercises so you alternate A1 → A2 before resting. Each
          workout can override this. Adaptive suggestions compare your recent sets and recommend a
          weight — nothing changes until you accept it.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "incUpperIso" as const, label: "Upper iso" },
            { k: "incUpperComp" as const, label: "Upper comp" },
            { k: "incLower" as const, label: "Lower body" },
          ].map((f) => (
            <label key={f.k} className="block">
              <span className="text-[11px] uppercase text-muted-foreground">{f.label}</span>
              <input
                inputMode="decimal"
                value={s[f.k]}
                onChange={(e) => set({ [f.k]: Number(e.target.value) || 0 } as Partial<typeof s>)}
                className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-base"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Smallest practical increase per jump, in {s.units}.
        </p>
      </section>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Timer feedback</h2>
        <Toggle label="Sound" value={s.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Vibration" value={s.vibration} onChange={(v) => set({ vibration: v })} />
      </section>

      <section className="surface-card mt-5 space-y-4 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Theme</h2>
        <Choice
          label="Mode"
          options={["dark", "light", "system"] as const}
          value={s.theme}
          onChange={(v) => set({ theme: v })}
        />
        <Choice
          label="Accent"
          options={["gold", "cyan"] as const}
          value={s.accent}
          onChange={(v) => set({ accent: v })}
        />
        <Choice
          label="Background"
          options={["charcoal", "black"] as const}
          value={s.surface}
          onChange={(v) => set({ surface: v })}
        />
        <Choice
          label="Contrast"
          options={["normal", "high"] as const}
          value={s.contrast}
          onChange={(v) => set({ contrast: v })}
        />
      </section>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Backup</h2>
        <p className="text-sm text-muted-foreground">
          Export a JSON file of everything on this device, or restore from one.
        </p>
        <button
          type="button"
          onClick={download}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
        >
          <Download className="size-5" /> Export data
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
        >
          <Upload className="size-5" /> Import data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          aria-label="Import backup file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ok = importData(await file.text());
            setMessage(ok ? "Backup restored." : "That file could not be read.");
            e.target.value = "";
          }}
        />
        {message && <p className="text-sm text-accent">{message}</p>}
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase text-destructive">Reset</h2>
        <p className="text-sm text-muted-foreground">
          Erases all logged sets, measurements, nutrition and settings on this device.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Erase all saved data and restart the 22 days?")) resetAll();
          }}
          className="tap-target mt-3 w-full rounded-xl border-2 border-destructive text-base font-bold uppercase text-destructive"
        >
          Reset program
        </button>
      </section>

      <Link
        to="/safety"
        className="tap-target mt-5 flex w-full items-center justify-center rounded-xl bg-elevated text-sm font-bold uppercase"
      >
        Safety rules
      </Link>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Add to Home Screen to install the app. With sync off, data stays only on this device.
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground" data-testid="release-marker">
        Version {RELEASE}
        {surface ? ` · ${surface}` : ""}
      </p>
    </main>
  );
}