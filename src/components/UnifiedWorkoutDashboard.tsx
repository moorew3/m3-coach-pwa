import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Dumbbell, Film, Play, ShieldCheck } from "lucide-react";
import ownerMedia from "../../approved-recovery-media.json";

/** One compact view of original M3 FLEX media.
 * Original approved URLs are read from the locked manifest; all other renders
 * come from the project's existing scene-library.js. Nothing is re-approved.
 */
type Scene = {
  id: string; name: string; status: string;
  video?: string | null; audio?: string | null; external?: string | null;
  source?: string; group?: string; ownerSetup?: string;
};
type Item = {
  key: string; id: string; name: string;
  status: "approved" | "rendered" | "held" | "archive";
  video: string | null; audio: string | null; external: string | null;
  source: string; setup?: string;
};
type Filter = "approved" | "rendered" | "archive" | "held" | "all";
type Workout = "recovery" | "A" | "B" | "v2";
declare global { interface Window { M3_FLEX_SCENE_LIBRARY?: Scene[] } }

const LABELS: Record<string, string> = {
  "C09-PRE-BREATH-R2": "Warm-up breathing",
  "C01-R3": "Seated shrugs",
  C02: "Hammer curls",
  C03: "Front raises",
  "C04-R2": "Alternating curls",
  "C08-PRESS-R3": "INNSTAR chest press (not bench press)",
  "C10-POST-BREATH-R1": "Cooldown breathing",
};
const AUDIO_IDS: Record<string, string> = {
  "C09-PRE-BREATH-R2": "C09-MARCUS", C02: "C02-MARCUS",
  C03: "C03-MARCUS", "C10-POST-BREATH-R1": "C10-MARCUS",
};
const approved: Item[] = ownerMedia.items
  .filter(item => item.type === "video" && item.approvedSource && !!item.url)
  .map(item => ({
    key: "approved:" + item.id, id: item.id, name: LABELS[item.id] ?? item.id,
    status: "approved", video: item.url, external: null,
    audio: ownerMedia.items.find(x => x.id === AUDIO_IDS[item.id])?.url ?? null,
    source: "Original approved Flex video",
  }));
const FILTERS: { value: Filter; label: string }[] = [
  { value: "approved", label: "Approved videos" },
  { value: "rendered", label: "Saved videos — including past approvals to reconcile" },
  { value: "archive", label: "Archived scene links" },
  { value: "held", label: "Held / incorrect versions" },
  { value: "all", label: "Show entire library" },
];
const WORKOUTS: { value: Workout; label: string }[] = [
  { value: "recovery", label: "Seated Recovery" },
  { value: "A", label: "Workout A" },
  { value: "B", label: "Workout B" },
  { value: "v2", label: "Flex V2 visual coach" },
];
const validMedia = (url: string | null) => !!url && /^https:\/\//i.test(url);
const getInventory = (): Scene[] =>
  Array.isArray(window.M3_FLEX_SCENE_LIBRARY) ? window.M3_FLEX_SCENE_LIBRARY : [];
const mappedScene = (s: Scene): Item => ({
  key: "scene:" + s.id,
  id: s.id,
  name: s.name || s.id,
  status: s.status === "hold" ? "held" :
    s.status.startsWith("archived") || !s.video ? "archive" : "rendered",
  video: s.video ?? null, audio: s.audio ?? null,
  external: s.external ?? null, source: s.source || s.group || "Saved original render",
  setup: s.ownerSetup,
});
const labels: Record<Item["status"], string> = {
  approved: "Previously approved — original video",
  rendered: "Saved render — approval needs matching",
  held: "On hold — not for a workout",
  archive: "Archived record — may have no playable video",
};

export function UnifiedWorkoutDashboard() {
  const [workout, setWorkout] = useState<Workout>("recovery");
  const [filter, setFilter] = useState<Filter>("approved");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [selectedKey, setSelectedKey] = useState("approved:C02");
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const existing = getInventory();
    if (existing.length) { setScenes(existing); return; }
    const script = document.createElement("script");
    script.src = "/recovery-coach/scene-library.js";
    script.async = true;
    script.onload = () => {
      const data = getInventory();
      setScenes(data);
      setLoadError(!data.length);
    };
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
    return () => {
      script.onload = null; script.onerror = null;
      if (script.parentNode) script.remove();
    };
  }, []);

  const all = useMemo(() => [...approved, ...scenes.map(mappedScene)], [scenes]);
  const filtered = useMemo(() => all.filter(x => filter === "all" || x.status === filter), [all, filter]);
  const current = filtered.find(x => x.key === selectedKey) ?? filtered[0] ?? null;
  const count = (f: Filter) => f === "all" ? all.length : all.filter(x => x.status === f).length;
  const pickFilter = (next: Filter) => {
    setFilter(next);
    setSelectedKey(all.find(x => next === "all" || x.status === next)?.key ?? "");
    setVideoError(false);
  };
  const pickScene = (next: string) => { setSelectedKey(next); setVideoError(false); };
  const selectCss = "mt-1 block h-12 w-full rounded-xl border border-border bg-elevated px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <section data-testid="m3-primary-workout-menu" className="rounded-3xl border border-primary/30 bg-card p-3 shadow-xl sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary">M3 FLEX</p>
          <h2 className="mt-1 text-2xl font-black">Train with Flex</h2>
          <p className="text-xs text-muted-foreground">One workout screen. All the videos in one place.</p>
        </div>
        <div className="rounded-xl bg-primary/15 p-3 text-primary"><Dumbbell className="size-6" aria-hidden /></div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <label className="text-sm font-bold" htmlFor="m3-workout-select">1. Choose workout
          <select id="m3-workout-select" data-testid="m3-workout-select"
            className={selectCss} value={workout} onChange={e => setWorkout(e.target.value as Workout)}>
            {WORKOUTS.map(w => <option value={w.value} key={w.value}>{w.label}</option>)}
          </select>
        </label>
        {workout === "v2" ? (
          <Link to="/v2" data-testid="m3-start-selected"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-base font-black text-primary-foreground">
            <Play className="size-5" aria-hidden /> Start with Flex V2
          </Link>
        ) : (
          <Link to="/recovery" search={{program:workout}} data-testid="m3-start-selected"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-base font-black text-primary-foreground">
            <Play className="size-5" aria-hidden /> Start selected workout
          </Link>
        )}
        <div className="border-t border-border pt-3">
          <p className="flex items-center gap-2 text-sm font-black"><Film className="size-4" /> Video library</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <CheckCircle2 className="mr-1 inline size-3 text-primary" />{approved.length} locked approved videos
            {" · "}{scenes.filter(s => !!s.video).length} other recorded renders
          </p>
          <label className="mt-3 block text-sm font-bold" htmlFor="m3-video-category">2. Choose video group
            <select id="m3-video-category" className={selectCss} value={filter}
              data-testid="m3-video-category" onChange={e => pickFilter(e.target.value as Filter)}>
              {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label} ({count(f.value)})</option>)}
            </select>
          </label>
          <label className="mt-3 block text-sm font-bold" htmlFor="m3-video-select">3. Choose exercise/video
            <select id="m3-video-select" data-testid="m3-video-select" className={selectCss}
              value={current?.key ?? ""} onChange={e => pickScene(e.target.value)}>
              {filtered.length ? filtered.map(item => (
                <option key={item.key} value={item.key}>{item.id} · {item.name}</option>
              )) : <option value="">No videos in this group</option>}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-[#090f16]" data-testid="m3-flex-player">
        <div className="flex flex-wrap items-start justify-between gap-2 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{current?.name ?? "Choose a video"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{current ? labels[current.status] : "No video selected"}</p>
          </div>
          {current?.status === "approved" ? <CheckCircle2 className="size-5 text-primary"/> :
            <CircleAlert className="size-5 text-amber-300"/>}
        </div>
        {current?.video && validMedia(current.video) && !videoError ? (
          <video key={current.key} controls playsInline preload="metadata" data-testid="m3-flex-video"
            className="aspect-video max-h-[42vh] w-full bg-black object-contain"
            src={current.video} onError={() => setVideoError(true)}
            aria-label={"Flex video: "+current.name}/>
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center px-4 py-4 text-center" role="status">
            <CircleAlert className="mb-2 size-6 text-amber-300"/>
            <p className="text-sm font-semibold">{videoError ? "This file could not play" :
              "No direct playable video is saved in this record"}</p>
            <p className="mt-1 text-xs text-muted-foreground">This is a saved record, not a substitute demonstration.</p>
          </div>
        )}
        <div className="space-y-2 px-3 pb-3 text-xs">
          {current?.source && <p className="text-muted-foreground">{current.source}</p>}
          {current?.setup && <p className="rounded-lg border border-border bg-elevated p-2">{current.setup}</p>}
          {current?.video && <a href={current.video} target="_blank" rel="noopener noreferrer"
            className="inline-block font-bold text-primary">Open this original video file</a>}
          {!current?.video && current?.external && <a href={current.external} target="_blank" rel="noopener noreferrer"
            className="inline-block font-bold text-primary">Open archived original link</a>}
          {current?.audio && validMedia(current.audio) && (
            <p><a href={current.audio} target="_blank" rel="noopener noreferrer"
              className="font-semibold text-primary">Listen to the original approved voice file</a></p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-elevated p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/>
        <p>Flex's previously approved clips stay unchanged. Saved renders are visible for reconciling earlier approvals, but not inserted into timed workouts until their correct movement and audio are confirmed. Keep the injured left leg supported and unloaded during seated Recovery.</p>
      </div>
      {loadError && <p className="mt-2 text-xs text-amber-300" role="status">
        The extended video library did not load. The seven approved clips are still shown above.
      </p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/recovery" search={{program:"recovery"}} className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-elevated px-2 text-center text-xs font-bold">Recovery videos</Link>
        <a href="/recovery-coach/programs/index.html" className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-elevated px-2 text-center text-xs font-bold">Detailed scene review</a>
      </div>
    </section>
  );
}
