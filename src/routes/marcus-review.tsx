/**
 * M3 FLEX: isolated owner-review-only 3D candidate.
 * This screen never modifies V2 workout scenes, approved Marcus assets, voice or rig gates.
 * Generated hosted URLs can expire. Preserve original model in fal asset library.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
  // Rig providers can wrap meter-scale vertices in an armature scaled by 0.01.
  // On this inspection-only screen render the authentic textured mesh in bind pose
  // without its armature parent, preventing double scale and invisible geometry.
  // The download remains the untouched, animation-bearing rigged GLB.
  const clone = useMemo(() => {
    let originalSkin: THREE.SkinnedMesh | undefined;
    scene.traverse((part) => {
      const skin = part as THREE.SkinnedMesh;
      if (!originalSkin && skin.isSkinnedMesh && skin.geometry?.getAttribute("position")) {
        originalSkin = skin;
      }
    });
    if (originalSkin && candidate.rigged) {
      const reviewMesh = new THREE.Mesh(originalSkin.geometry, originalSkin.material);
      reviewMesh.name = "Marcus original geometry — inspection pose";
      reviewMesh.frustumCulled = false;
      return reviewMesh;
    }
    return cloneSkeleton(scene);
  }, [scene, candidate.rigged]);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const height = size.y > 0 ? size.y : 1;
  const scale = 2.8 / height;
  const { camera } = useThree();
  useEffect(() => { camera.lookAt(0, 1.3, 0); onReady(); }, [camera, onReady]);
  return (
    <group position={[-center.x * scale, -bounds.min.y * scale, -center.z * scale]} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

function MarcusReview() {
  const [selected, setSelected] = useState<string>("approved-photo-detail");
  const [modelLoaded, setModelLoaded] = useState(false);
  const candidate = CANDIDATES.find((m) => m.id === selected) ?? CANDIDATES[0];

  return (
    <main data-testid="marcus-review-page" className="min-h-dvh bg-[#080b0f] text-white">
      <div className="mx-auto max-w-3xl px-3 pb-10 pt-3">
        <header className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-cyan-300">M3 Flex Coach</p>
            <h1 className="text-lg font-extrabold">Marcus · 3D Review</h1>
          </div>
          <Link to="/v2" className="shrink-0 rounded-xl border border-white/25 px-3 py-2.5 text-xs font-semibold">
            Back to workout
          </Link>
        </header>

        <p data-testid="marcus-review-warning" className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-snug text-amber-100">
          REVIEW ONLY — This 3D likeness and its movements are not approved for workouts.
        </p>

        <section aria-label="Interactive Marcus 3D model" className="relative mt-2 overflow-hidden rounded-2xl border border-white/20 bg-[#0b1118]">
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 text-[11px]">
            <span className="rounded-md bg-black/75 px-2 py-1 font-semibold text-cyan-200">Rotate · pinch to zoom</span>
            {modelLoaded && <span data-testid="marcus-3d-ready" role="status" className="rounded-md bg-black/75 px-2 py-1 text-emerald-300">3D loaded</span>}
          </div>
          <ModelErrorBoundary>
            <div data-testid="marcus-review-3d" className="h-[min(64dvh,640px)] min-h-[380px] w-full">
              <Canvas camera={{ position: [0, 1.5, 5], fov: 39, near: 0.01, far: 80 }} gl={{ antialias: true }}>
                <color attach="background" args={["#0b1118"]} />
                <ambientLight intensity={1.4} />
                <directionalLight position={[3, 7, 6]} intensity={2.4} />
                <directionalLight position={[-3, 3, -5]} intensity={1.1} />
                <Suspense fallback={null}>
                  <ReviewCharacter key={candidate.id} candidate={candidate} onReady={() => setModelLoaded(true)} />
                </Suspense>
                <OrbitControls target={[0, 1.35, 0]} enablePan={false}
                  minDistance={2.5} maxDistance={9} />
                <gridHelper args={[8, 12, "#25313d", "#17232d"]} />
              </Canvas>
            </div>
          </ModelErrorBoundary>
        </section>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p data-testid="marcus-selected-version" className="text-sm font-semibold text-cyan-200">{candidate.label}</p>
            <p className="mt-0.5 text-xs leading-snug text-white/65">Actual 3D mesh in inspection pose, not a photograph. The original rigged GLB remains unchanged. Face, tattoos and boot still require approval.</p>
          </div>
          <a href={candidate.glb} target="_blank" rel="noopener noreferrer"
            className="shrink-0 rounded-xl border border-cyan-300/40 px-3 py-2 text-xs font-bold text-cyan-200">
            GLB file
          </a>
        </div>

        <details data-testid="marcus-review-compare" className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white/[.035]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            Reference photo & other 3D versions
          </summary>
          <div className="space-y-4 border-t border-white/10 px-3 pb-4 pt-3">
            <section aria-label="Original approved coach reference">
              <p className="mb-2 text-xs font-semibold text-white/80">Original approved photo — reference only</p>
              <img src={APPROVED_FULL_REFERENCE} alt="Original approved coach photo, not a 3D model"
                className="mx-auto h-56 w-full rounded-lg bg-black object-contain" />
            </section>
            <div>
              <label htmlFor="marcus-candidate-select" className="mb-1.5 block text-xs font-semibold text-white/80">Compare a different real 3D file</label>
              <select id="marcus-candidate-select" data-testid="marcus-model-select"
                value={selected} onChange={(event) => { setSelected(event.target.value); setModelLoaded(false); }}
                className="min-h-12 w-full rounded-lg border border-white/30 bg-[#151d27] px-3 text-sm text-white">
                {CANDIDATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <p data-testid="marcus-model-caveat" className="mt-2 text-xs leading-relaxed text-white/70">
                {candidate.note} {candidate.rigged ? "Rigged GLB." : "Static 3D GLB; no skeleton."}
              </p>
              {candidate.preview && <a href={candidate.preview} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-cyan-200 underline">Older static preview (not the 3D model)</a>}
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              Approved training videos, trainer voice and release gates are untouched. The owner-controlled 3D candidate is not permitted to replace the coach.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
