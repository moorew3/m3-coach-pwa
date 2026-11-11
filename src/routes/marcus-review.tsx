/**
 * M3 FLEX: isolated owner-review-only 3D candidate.
 * This screen never modifies V2 workout scenes, approved Marcus assets, voice or rig gates.
 * Generated hosted URLs can expire. Preserve original model in fal asset library.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, Component, useEffect, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useMemo } from "react";

export const Route = createFileRoute("/marcus-review")({ component: MarcusReview });

const CANDIDATES = [
  {
    id: "approved-photo-detail", label: "Original photo detail · working 3D rig",
    glb: "/marcus-candidates/marcus-photo-projected-review.glb",
    preview: null,
    rigged: true,
    note: "Original approved gym-photo facial and chest tattoo details have been projected onto the moving 24-joint GLB. Still a candidate: geometry and likeness require approval.",
  },
  {
    id: "texture-rig", label: "Retextured · original moving rig",
    glb: "/marcus-candidates/marcus-retattoo-rigged.glb",
    preview: "https://v3b.fal.media/files/b/0ab204f0/bovokJ965J4CvdAvTHagl_preview.png",
    rigged: true,
    note: "New 2K tattoo and muscle-surface detail transferred to the original 24-joint skinned rig. The face and tattoos remain approximate — NOT approved.",
  },
  {
    id: "boot-rig", label: "Rigged · boot retained",
    glb: "https://v3b.fal.media/files/b/0ab1f374/vPQAs4jIWDuIQlXbUMvqb_rigged_character.glb",
    preview: "https://v3b.fal.media/files/b/0ab1f371/92yDx_4fsFwNXajsl1neI_preview.png",
    rigged: true, note: "Original 3D rig, boot retained; facial likeness is approximate.",
  },
  {
    id: "tattoo-pass", label: "4K textures · boot retained",
    glb: "https://v3b.fal.media/files/b/0ab204d8/AgRw7EN0XgucQDEkntBea_model.glb",
    preview: "https://v3b.fal.media/files/b/0ab204f0/bovokJ965J4CvdAvTHagl_preview.png",
    rigged: false, note: "Re-textured 3D mesh; not yet rigged for motion. Tattoos still approximate.",
  },
  {
    id: "detailed-rig", label: "Higher-detail rig · boot missing",
    glb: "https://v3b.fal.media/files/b/0ab204a8/tRlXImMgp-unvjOBotywY_rigged_character.glb",
    preview: "https://v3b.fal.media/files/b/0ab204a3/gTJy02e1LDX1bP6fQff4b_preview.png",
    rigged: true, note: "Higher-resolution shape, but the left medical boot is missing; reject for recovery.",
  },
] as const;
type Candidate = (typeof CANDIDATES)[number];
const APPROVED_FULL_REFERENCE = "/coach-source/coach-primary-standing.png";
const ORIGINAL_COACH = "/coach-source/coach-primary-standing.png";

class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { failure: boolean }
> {
  state = { failure: false };
  static getDerivedStateFromError() { return { failure: true }; }
  render() {
    return this.state.failure
      ? <div role="alert" className="mx-4 rounded-xl border border-amber-300/40 bg-black/80 p-4 text-center text-sm text-white">
          The interactive 3D file could not load. Use the static preview or the original model link below.
        </div>
      : this.props.children;
  }
}

function ReviewCharacter({ candidate, onReady }: { candidate: Candidate; onReady: () => void }) {
  const { scene } = useGLTF(candidate.glb);
  const clone = useMemo(() => cloneSkeleton(scene), [scene]);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const height = size.y > 0 ? size.y : 1;
  const scale = 2.8 / height;
  useEffect(() => { onReady(); }, [onReady]);
  return (
    <group position={[-center.x * scale, -bounds.min.y * scale, -center.z * scale]} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

type ReviewFocus = "full" | "face";
function MarcusReview() {
  const [selected, setSelected] = useState<string>("approved-photo-detail");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [view, setView] = useState<ReviewFocus>("full");
  const candidate = CANDIDATES.find((m) => m.id === selected) ?? CANDIDATES[0];
  return (
    <main className="min-h-dvh bg-[#080b0f] px-3 py-4 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">M3 Flex Coach</p>
            <h1 className="mt-1 text-xl font-extrabold">Marcus 3D Candidate</h1>
          </div>
          <Link to="/v2" className="rounded-xl border border-white/25 px-3 py-3 text-xs font-bold">
            Back to workout
          </Link>
        </div>
        <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
          REVIEW ONLY — REAL 3D — none of these candidates passes the required face, anatomy, tattoo, and orthopedic-boot acceptance checks.
          This page cannot enable the models in your actual workouts. Your approved videos, trainer voice and workout controls are untouched.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <section aria-label="Original approved coach reference" className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <p className="px-2 pt-2 text-center text-xs font-bold">Original reference</p>
            <img className="h-40 w-full object-contain sm:h-64" src={APPROVED_FULL_REFERENCE}
              alt="Original approved coach photo, not a 3D model" />
          </section>
          <section aria-label="Generated model preview" className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <p className="px-2 pt-2 text-center text-xs font-bold">Generated draft</p>
            {candidate.preview ? <img className="h-40 w-full object-contain sm:h-64" src={candidate.preview}
              alt="Previous generation's static draft (not the interactive 3D file)" /> : (
              <div className="flex h-40 items-center justify-center px-3 text-center text-xs text-white/75 sm:h-64">
                This updated model has no substitute still image. Rotate and inspect the real 3D character below.
              </div>
            )}
          </section>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Select 3D model version">
          {CANDIDATES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelected(item.id); setModelLoaded(false); }}
              aria-pressed={selected === item.id}
              className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-bold ${selected === item.id ? "border-cyan-300 bg-cyan-300/15 text-cyan-200" : "border-white/25 bg-black/30 text-white"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/70" data-testid="marcus-model-caveat">
          {candidate.note} {candidate.rigged ? "Rigged GLB." : "Static 3D GLB; no skeleton."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="3D camera view">
          <button type="button" onClick={() => { setView("full"); setModelLoaded(false); }} aria-pressed={view === "full"}
            className={`min-h-12 rounded-xl border px-2 text-sm font-semibold ${view === "full" ? "border-cyan-300 bg-cyan-300/15 text-cyan-200" : "border-white/25"}`}>
            Full body · 360°
          </button>
          <button type="button" onClick={() => { setView("face"); setModelLoaded(false); }} aria-pressed={view === "face"}
            className={`min-h-12 rounded-xl border px-2 text-sm font-semibold ${view === "face" ? "border-cyan-300 bg-cyan-300/15 text-cyan-200" : "border-white/25"}`}>
            Face & tattoos · close-up
          </button>
        </div>
        <section className="relative mt-3 overflow-hidden rounded-2xl border border-white/15 bg-[#0b1118]">
          <h2 className="absolute left-3 top-3 z-10 text-xs font-bold text-cyan-200">Touch and drag to rotate the actual 3D model</h2>
          {modelLoaded && <p data-testid="marcus-3d-ready" role="status" className="absolute right-3 top-3 z-10 text-xs text-emerald-300">3D loaded</p>}
          <ModelErrorBoundary>
            <div className="h-[60dvh] min-h-[420px] max-h-[720px] w-full" data-testid="marcus-review-3d">
              <Canvas key={view} camera={{ position: view === "face" ? [0, 2.43, 1.12] : [0, 1.5, 4.2], fov: 36, near: 0.01, far: 80 }} gl={{ antialias: true }}>
                <color attach="background" args={["#0b1118"]} />
                <ambientLight intensity={1.4} />
                <directionalLight position={[3, 7, 6]} intensity={2.4} />
                <directionalLight position={[-3, 3, -5]} intensity={1.1} />
                <Suspense fallback={null}>
                  <ReviewCharacter key={candidate.id} candidate={candidate} onReady={() => setModelLoaded(true)} />
                </Suspense>
                <OrbitControls target={[0, view === "face" ? 2.43 : 1.35, 0]} enablePan={false}
                  minDistance={view === "face" ? 0.8 : 2.8} maxDistance={view === "face" ? 3.2 : 9} />
                <gridHelper args={[8, 12, "#25313d", "#17232d"]} />
              </Canvas>
            </div>
          </ModelErrorBoundary>
        </section>
        <p className="mt-3 text-xs leading-relaxed text-white/65">
          This is the actual rigged GLB, not a still image masquerading as an avatar.
          Choose among the actual generated GLB models above and rotate them by touch.
          None is approved for motion. The static retextured version is not an animated character.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a className="rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-3 text-center text-sm font-bold text-cyan-200"
            href={candidate.glb} rel="noopener noreferrer" target="_blank">Original rigged GLB</a>
          {candidate.preview ? <a className="rounded-xl border border-white/20 px-3 py-3 text-center text-sm font-bold"
            href={candidate.preview} rel="noopener noreferrer" target="_blank">Open model preview</a>
            : <div className="rounded-xl border border-white/20 px-3 py-3 text-center text-sm text-white/65">Live 3D review only</div>}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          The updated original-photo-detail GLB is stored in this owner-controlled repository. Earlier fal.ai previews may expire.
          The face, tattoos, anatomy and boot are not faithful enough for release. The generated files are prototypes only.
          Production workout and injury-release gates remain closed.
        </p>
      </div>
    </main>
  );
}
