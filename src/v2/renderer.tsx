import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sceneContractFor } from "./scene";
import { CoachRigSlot } from "./coach-rig";
import type { V2Session } from "./types";

function CameraController({
  position,
  target,
  fov,
}: {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}) {
  const { camera } = useThree();
  const goal = useMemo(() => new THREE.Vector3(...position), [position]);
  const look = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame((_state, delta) => {
    const t = 1 - Math.exp(-4.5 * delta);
    camera.position.lerp(goal, t);
    camera.lookAt(look);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, t);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function PlaceholderHuman({
  position,
  facing = 0,
  visible = true,
  athlete = false,
}: {
  position: [number, number, number];
  facing?: number;
  visible?: boolean;
  athlete?: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.008;
  });

  if (!visible) return null;

  const body = athlete ? "#7dd3fc" : "#d1d5db";
  const dark = athlete ? "#155e75" : "#4b5563";

  return (
    <group ref={group} position={position} rotation={[0, facing, 0]}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.58, 8, 18]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh position={[-0.33, 1.3, 0]} rotation={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 6, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0.33, 1.3, 0]} rotation={[0, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 6, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[-0.13, 0.57, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 6, 12]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[0.13, 0.57, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 6, 12]} />
        <meshStandardMaterial color={dark} />
      </mesh>
    </group>
  );
}

function BenchStation() {
  return (
    <group position={[-2.2, 0, -1.25]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.12, 1.9]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.83, -0.78]} rotation={[-0.42, 0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.12, 1.15]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.23, 0]} castShadow>
          <boxGeometry args={[0.07, 0.48, 0.07]} />
          <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function CableStation() {
  return (
    <group position={[2.5, 0, -1.6]}>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 1.3, 0]} castShadow>
          <boxGeometry args={[0.18, 2.6, 0.35]} />
          <meshStandardMaterial color="#374151" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, 0]} castShadow>
        <boxGeometry args={[1.5, 0.16, 0.35]} />
        <meshStandardMaterial color="#4b5563" metalness={0.65} roughness={0.35} />
      </mesh>
    </group>
  );
}

function DumbbellRack() {
  return (
    <group position={[-3.3, 0, 1.8]}>
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, -0.08]} receiveShadow>
        <boxGeometry args={[1.8, 0.12, 0.5]} />
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <group key={x} position={[x, 0.83, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.38, 16]} />
            <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GymScene({ session }: { session: V2Session }) {
  const scene = sceneContractFor(session);
  const manual = scene.showAthleteCamera;

  return (
    <>
      <color attach="background" args={["#080b0f"]} />
      <fog attach="fog" args={["#080b0f", 8, 18]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[4, 7, 3]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 3, -2]} intensity={8} color="#67e8f9" distance={8} />

      <CameraController
        position={scene.camera.position}
        target={scene.camera.target}
        fov={scene.camera.fov}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#0d1117" roughness={0.95} />
      </mesh>
      <Grid
        args={[18, 18]}
        position={[0, 0.002, 0]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#1f2937"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#164e63"
        fadeDistance={12}
        fadeStrength={1}
        infiniteGrid
      />

      <BenchStation />
      <CableStation />
      <DumbbellRack />

      {scene.showCoach && (
        <CoachRigSlot
          motionKey={scene.motionKey}
          position={scene.coachAnchor}
          fallback={
            <PlaceholderHuman
              position={scene.coachAnchor}
              facing={0}
              visible
            />
          }
        />
      )}
      <PlaceholderHuman
        position={scene.athleteAnchor}
        facing={Math.PI}
        visible={manual}
        athlete
      />

      <mesh position={[0, 2.65, -3.7]} receiveShadow>
        <boxGeometry args={[8, 0.08, 0.08]} />
        <meshStandardMaterial color="#22d3ee" emissive="#164e63" emissiveIntensity={0.45} />
      </mesh>
    </>
  );
}

export function M3GymRenderer({ session }: { session: V2Session }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [0, 1.65, 4.8], fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      className="absolute inset-0"
    >
      <GymScene session={session} />
    </Canvas>
  );
}
