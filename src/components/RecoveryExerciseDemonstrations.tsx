import { useEffect, useMemo, useRef, useState } from "react";
import approvedManifest from "@/data/recovery/m3-flex-approved-media-staging.json";

const MOVEMENT_NAMES: Record<string, string> = {
  "C09-PRE-BREATH-R2": "Preparation breathing",
  "C10-POST-BREATH-R1": "Cooldown breathing",
  "C01-R3": "Seated dumbbell shrugs",
  "C02": "Seated hammer curls",
  "C03": "Seated front raises",
  "C04-R2": "Seated alternating curls",
  "C08-PRESS-R3": "Seated INNSTAR chest press",
  "C12-LATERAL-R3": "Seated lateral raises",
  "NEW_SEATED-TRICEPS-PRESSDOWN": "Seated triceps pressdowns",
  "NEW_SEATED-BAND-PULL-APART": "Seated band pull-aparts",
  "NEW_ARM-BOXING": "Seated arm-only boxing",
};
const clipOrder = [
  "C08-PRESS-R3", "C02", "C04-R2", "C01-R3", "C03",
  "C12-LATERAL-R3", "NEW_SEATED-TRICEPS-PRESSDOWN",
  "NEW_SEATED-BAND-PULL-APART", "NEW_ARM-BOXING",
  "C09-PRE-BREATH-R2", "C10-POST-BREATH-R1",
];
const clips = approvedManifest.clips
  .filter((clip) => clip.ownerApproved === true && clip.previewAllowed === true)
  .sort((a, b) => clipOrder.indexOf(a.id) - clipOrder.indexOf(b.id));

/** Strictly separate preview-only media from the old canonical coach registry.
 * Nothing played here counts as a workout set or replaces a protected source.
 */
export function RecoveryExerciseDemonstrations() {
  const [selectedId, setSelectedId] = useState(clips[0]?.id ?? "");
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selected = useMemo(() => clips.find((x) => x.id === selectedId) ?? clips[0], [selectedId]);

  useEffect(() => {
    setFailed(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.playbackRate = speed;
    }
  }, [selectedId]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  if (!selected) return <p role="status">No owner-approved preview clips available.</p>;

  return (
    <section data-testid="recovery-demonstrations" aria-label="Owner-approved exercise demonstrations"
      className="mt-3 rounded-3xl border border-cyan-300/20 bg-[#111820] p-3 sm:p-5">
      <div className="mb-3">
        <h2 className="text-xl font-black text-white">Exercise Demonstrations</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          {clips.length} owner-approved previews. Watch and repeat an exercise without running
          a workout, logging sets or moving the rest timer. The left boot stays supported and unloaded.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <video
              key={selected.id}
              ref={videoRef}
              data-testid="recovery-demo-video"
              src={selected.videoUrl}
              controls
              muted
              playsInline
              loop={repeat}
              preload="metadata"
              autoPlay={false}
              onError={() => setFailed(true)}
              onLoadedMetadata={() => setFailed(false)}
              className="aspect-video w-full bg-black object-contain"
              aria-label={MOVEMENT_NAMES[selected.id] ?? selected.title}
            />
          </div>
          <h3 className="mt-3 text-base font-black text-white">
            {MOVEMENT_NAMES[selected.id] ?? selected.title}
          </h3>
          <p className="mt-1 text-xs text-white/60">
            {selected.originalProtected ? "Original source preserved" : "Owner preview"}
            {" · "}Preview only · No workout logging or automatic progression
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.currentTarget.checked)}
                className="size-5 accent-cyan-300" /> Repeat clip
            </label>
            <label className="flex items-center gap-2">
              Speed
              <select value={speed} onChange={(e) => setSpeed(Number(e.currentTarget.value))}
                className="min-h-11 rounded-lg bg-[#263746] px-3 text-white">
                <option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option>
              </select>
            </label>
          </div>
          {failed && <p role="alert" className="mt-2 text-sm text-amber-200">
            This video could not load. Try another demonstration; the original source has not been altered.
          </p>}
          <p className="mt-3 text-xs text-amber-100/85">
            Demonstration videos are muted intentionally. Full-length rep-by-rep Marcus
            narration and avatar identity reconciliation are still in production.
          </p>
        </div>
        <nav aria-label="Choose exercise demonstration" className="grid grid-cols-1 gap-2 self-start sm:grid-cols-2 lg:grid-cols-1">
          {clips.map((clip, index) => (
            <button type="button" key={clip.id}
              data-testid="recovery-demo-choice"
              aria-current={clip.id === selected.id ? "true" : undefined}
              onClick={() => setSelectedId(clip.id)}
              className={clip.id === selected.id
                ? "min-h-12 rounded-xl border border-cyan-300 bg-cyan-300/15 px-3 text-left text-xs font-bold text-cyan-100"
                : "min-h-12 rounded-xl border border-white/10 bg-black/30 px-3 text-left text-xs font-semibold text-white/75"}>
              {index + 1}. {MOVEMENT_NAMES[clip.id] ?? clip.title}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
