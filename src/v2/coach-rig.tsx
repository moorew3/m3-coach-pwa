import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type * as THREE from "three";

export const V2_COACH_MODEL_URL = "/v2/coach.glb";

function LoadedCoach({
  motionKey,
  position,
  running,
}: {
  motionKey: string;
  position: [number, number, number];
  running: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(V2_COACH_MODEL_URL);
  // Skinned meshes must be cloned per mount. Sharing a GLTF scene across
  // coach instances can make pose updates conflict or freeze the visible rig.
  const coachScene = useMemo(() => cloneSkeleton(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const exact = actions[motionKey];
    const idle = actions.Idle ?? actions.idle;
    // CRITICAL: Never substitute Idle for an exercise while the timer runs.
    // A missing exact motion must fail visibly during QA, not masquerade as a
    // full-body animated coach standing still.
    const action = running ? exact : idle;
    if (!action) {
      if (running) console.warn(`LIVE FLEX rig: missing exact animation "${motionKey}"`);
      return;
    }

    action.reset().fadeIn(0.25).play();
    return () => {
      action.fadeOut(0.25);
    };
  }, [actions, motionKey, running]);

  return (
    <primitive
      ref={group}
      object={coachScene}
      position={position}
      dispose={null}
      castShadow
      receiveShadow
    />
  );
}

export function CoachRigSlot({
  motionKey,
  position,
  fallback,
  running,
}: {
  motionKey: string;
  position: [number, number, number];
  running: boolean;
  fallback: React.ReactNode;
}) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(V2_COACH_MODEL_URL, { method: "HEAD" })
      .then((r) => {
        if (alive) setAvailable(r.ok);
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return <>{fallback}</>;

  return <LoadedCoach motionKey={motionKey} position={position} running={running} />;
}
