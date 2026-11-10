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

const CANDIDATE_GLB =
  "https://v3b.fal.media/files/b/0ab1f374/vPQAs4jIWDuIQlXbUMvqb_rigged_character.glb";
const CANDIDATE_PREVIEW =
  "https://v3b.fal.media/files/b/0ab1f371/92yDx_4fsFwNXajsl1neI_preview.png";
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

function ReviewCharacter({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(CANDIDATE_GLB);
  const clone = useMemo(() => cloneSkeleton(scene), [scene]);
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
  const [modelLoaded, setModelLoaded] = useState(false);
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
          REVIEW ONLY — this rig is not an approved likeness, workout performer or medical-safe animation.
          None of the approved videos, voice or live workout controls have been replaced.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <section aria-label="Original approved coach reference" className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <p className="px-2 pt-2 text-center text-xs font-bold">Original reference</p>
            <img className="h-40 w-full object-contain sm:h-64" src={ORIGINAL_COACH}
              alt="Original approved coach photo, not a 3D model" />
          </section>
          <section aria-label="Generated model preview" className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <p className="px-2 pt-2 text-center text-xs font-bold">Generated draft</p>
            <img className="h-40 w-full object-contain sm:h-64" src={CANDIDATE_PREVIEW}
              alt="Generated draft of Marcus with approximate tattoos, beard and left-leg boot" />
          </section>
        </div>
        <section className="relative mt-3 overflow-hidden rounded-2xl border border-white/15 bg-[#0b1118]">
          <h2 className="absolute left-3 top-3 z-10 text-xs font-bold text-cyan-200">Touch and drag to rotate the actual 3D model</h2>
          {modelLoaded && <p data-testid="marcus-3d-ready" role="status" className="absolute right-3 top-3 z-10 text-xs text-emerald-300">3D loaded</p>}
          <ModelErrorBoundary>
            <div className="h-[52dvh] min-h-[340px] max-h-[580px] w-full" data-testid="marcus-review-3d">
              <Canvas camera={{ position: [0, 1.5, 5], fov: 39, near: 0.01, far: 80 }} gl={{ antialias: true }}>
                <color attach="background" args={["#0b1118"]} />
                <ambientLight intensity={1.4} />
                <directionalLight position={[3, 7, 6]} intensity={2.4} />
                <directionalLight position={[-3, 3, -5]} intensity={1.1} />
                <Suspense fallback={null}>
                  <ReviewCharacter onReady={() => setModelLoaded(true)} />
                </Suspense>
                <OrbitControls target={[0, 1.35, 0]} enablePan={false}
                  minDistance={2.5} maxDistance={9} />
                <gridHelper args={[8, 12, "#25313d", "#17232d"]} />
              </Canvas>
            </div>
          </ModelErrorBoundary>
        </section>
        <p className="mt-3 text-xs leading-relaxed text-white/65">
          This is the actual rigged GLB, not a still image masquerading as an avatar.
          The generator also returned separate rigged FBX and walking/running tests.
          Those motions are NOT enabled here or in your workouts.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a className="rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-3 text-center text-sm font-bold text-cyan-200"
            href={CANDIDATE_GLB} rel="noopener noreferrer" target="_blank">Original rigged GLB</a>
          <a className="rounded-xl border border-white/20 px-3 py-3 text-center text-sm font-bold"
            href={CANDIDATE_PREVIEW} rel="noopener noreferrer" target="_blank">Open model preview</a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Temporary hosted media may expire; original outputs are saved in the connected fal.ai library.
          3D identity, face, boot and tattoos require acceptance before production release.
        </p>
      </div>
    </main>
  );
}
