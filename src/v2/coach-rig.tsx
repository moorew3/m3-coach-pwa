import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
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
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const exact = actions[motionKey];
    const idle = actions.Idle ?? actions.idle;
    const action = running ? exact ?? idle : idle ?? exact;
    if (!action) return;

    action.reset().fadeIn(0.25).play();
    action.paused = !running && !idle;
    return () => {
      action.fadeOut(0.25);
    };
  }, [actions, motionKey, running]);

  return (
    <primitive
      ref={group}
      object={scene}
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
