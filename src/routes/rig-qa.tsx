import { createFileRoute } from "@tanstack/react-router";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState, type ChangeEvent } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

// This is intentionally separate from the approved trainer and seven-day plan.
// Models are loaded only from a file chosen on this device; no upload or paid
// avatar service is involved. This view is for motion/mesh QA only.
export const Route = createFileRoute("/rig-qa")({
  head: () => ({ meta: [{ title: "LIVE FLEX — Full-body rig QA" }] }),
  component: FlexRigQa,
});

type LoadedRig = { gltf: GLTF; fileName: string };

function MovingRig({ rig, clipName, paused }: { rig: LoadedRig; clipName: string; paused: boolean }) {
  const [mixer] = useState(() => new THREE.AnimationMixer(rig.gltf.scene));

  useEffect(() => {
    const clip = rig.gltf.animations.find((motion) => motion.name === clipName);
    mixer.stopAllAction();
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.enabled = true;
    action.play();
    action.paused = paused;
    return () => {
      action.stop();
    };
  }, [clipName, mixer, rig]);

  useEffect(() => {
    mixer.timeScale = paused ? 0 : 1;
  }, [mixer, paused]);

  useFrame((_, delta) => {
    mixer.update(Math.min(delta, 0.08));
  });

  return <primitive object={rig.gltf.scene} dispose={null} />;
}

function RigScene({ rig, clipName, paused }: { rig: LoadedRig; clipName: string; paused: boolean }) {
  return (
    <Canvas camera={{ position: [1.25, 1.4, 3.2], fov: 36 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
      <color attach="background" args={["#0b1118"]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-3, 3, -2]} intensity={1.2} />
      <gridHelper args={[8, 24, "#37516b", "#1b2936"]} position={[0, -0.01, 0]} />
      <MovingRig key={rig.fileName} rig={rig} clipName={clipName} paused={paused} />
      <OrbitControls target={[0, 0.85, 0]} enableDamping minDistance={1.5} maxDistance={8} />
    </Canvas>
  );
}

function FlexRigQa() {
  const [mounted, setMounted] = useState(false);
  const [rig, setRig] = useState<LoadedRig | null>(null);
  const [clipName, setClipName] = useState("");
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  async function loadModel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    setRig(null);
    setClipName("");
    try {
      if (!file.name.toLowerCase().endsWith(".glb")) {
        throw new Error("Choose a .glb model file.");
      }
      if (file.size > 45 * 1024 * 1024) {
        throw new Error("For this phone-friendly test, choose a GLB under 45 MB.");
      }
      const bytes = await file.arrayBuffer();
      const model = await new GLTFLoader().parseAsync(bytes, "");
      if (!model.scene || !model.animations.length) {
        throw new Error("This GLB has no playable skeletal animation clips.");
      }
      setRig({ gltf: model, fileName: file.name });
      setClipName(model.animations.find((clip) => clip.name === "cablePunch")?.name ?? model.animations[0].name);
      setPaused(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open this GLB.");
    } finally {
      setLoading(false);
    }
  }

  const names = rig?.gltf.animations.map((clip) => clip.name) ?? [];
  return (
    <main className="min-h-screen bg-[#080d14] px-3 py-5 text-white sm:px-7">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">LIVE FLEX V2 · Engineering QA</p>
            <h1 className="mt-1 text-2xl font-black">Full-body animation test</h1>
          </div>
          <a href="/v2" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-cyan-200">
            Back to regular workout
          </a>
        </div>

        <p className="rounded-xl border border-amber-300/25 bg-amber-100/5 px-4 py-3 text-sm leading-relaxed text-amber-100">
          TEST ONLY — This is not the approved Flex coach. The file stays on your device. Do not judge exercise
          technique or start a workout from this prototype.
        </p>

        <div className="rounded-2xl border border-white/15 bg-[#121c29] p-4">
          <label htmlFor="flex-qa-model" className="block text-sm font-semibold">
            Select the experimental Flex GLB from Downloads
          </label>
          <input
            id="flex-qa-model"
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={(event) => void loadModel(event)}
            className="mt-3 block w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:font-bold file:text-black"
          />
          {loading && <p className="mt-3 text-sm text-cyan-200">Reading the model on this device…</p>}
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          {rig && <p className="mt-3 break-all text-sm text-cyan-100">Loaded: {rig.fileName} — {names.length} animation clips</p>}
        </div>

        <div className="relative h-[min(65vh,650px)] min-h-80 overflow-hidden rounded-2xl border border-white/15 bg-[#0b1118]">
          {mounted && rig ? (
            <RigScene rig={rig} clipName={clipName} paused={paused} />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-sm text-white/65">
              Choose a rigged GLB to preview its moving full-body character.
            </div>
          )}
        </div>

        {rig && (
          <div className="space-y-3 rounded-2xl border border-white/15 bg-[#121c29] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Exercise animation</p>
            <div className="flex flex-wrap gap-2">
              {names.map((name, i) => (
                <button
                  key={name + i}
                  type="button"
                  onClick={() => { setClipName(name); setPaused(false); }}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${clipName === name ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/20 bg-black/20 text-white"}`}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="min-h-11 rounded-xl border border-white/25 px-5 py-2 font-bold"
            >
              {paused ? "Resume animation" : "Pause animation"}
            </button>
            <p className="text-xs leading-relaxed text-white/60">
              Drag to rotate. Pinch or scroll to zoom. This only tests skeleton motion and visible skinning; clips
              and likeness must pass separate review before joining LIVE FLEX.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
