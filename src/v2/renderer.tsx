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
  motionKey = "idle",
  running = false,
}: {
  position: [number, number, number];
  facing?: number;
  visible?: boolean;
  athlete?: boolean;
  motionKey?: string;
  running?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const t = running ? clock.elapsedTime : 0;
    const ease = 1 - Math.exp(-10 * delta);
    const set = (ref: React.RefObject<THREE.Group | null>, x: number, y: number, z: number) => {
      if (!ref.current) return;
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, x, ease);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, y, ease);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, z, ease);
    };

    let la: [number, number, number] = [0, 0, -0.08];
    let ra: [number, number, number] = [0, 0, 0.08];
    let ll: [number, number, number] = [0, 0, 0];
    let rl: [number, number, number] = [0, 0, 0];
    let yaw = 0;
    let pitch = 0;
    let roll = 0;
    let rootLift = 0;

    if (motionKey === "boxingCombination") {
      const jab = Math.max(0, Math.sin(t * 3.4));
      const cross = Math.max(0, Math.sin(t * 3.4 + Math.PI));
      la = [-1.15 * jab - 0.35, 0.15, -0.3];
      ra = [-1.15 * cross - 0.35, -0.15, 0.3];
      yaw = 0.16 * (cross - jab);
      ll = [0, 0.05, -0.03];
      rl = [0, -0.05, 0.03];
    } else if (motionKey === "frontKick") {
      const kick = Math.max(0, Math.sin(t * 2.4));
      rl = [-1.25 * kick, 0, 0];
      la = [-0.5, 0, -0.2];
      ra = [-0.5, 0, 0.2];
    } else if (motionKey === "roundKick") {
      const kick = Math.max(0, Math.sin(t * 2.2));
      rl = [-0.7 * kick, 0.55 * kick, 0.15];
      yaw = -0.45 * kick;
      la = [-0.45, 0, -0.25];
      ra = [-0.45, 0, 0.25];
    } else if (motionKey === "shoulderPress") {
      const press = 0.5 + 0.5 * Math.sin(t * 2.0);
      la = [-0.7 - 0.9 * press, 0, -0.32];
      ra = [-0.7 - 0.9 * press, 0, 0.32];
    } else if (motionKey === "lateralRaise") {
      const lift = 0.5 + 0.5 * Math.sin(t * 2.2);
      la = [0, 0, -0.08 - 1.2 * lift];
      ra = [0, 0, 0.08 + 1.2 * lift];
    } else if (motionKey === "inclinePress" || motionKey === "chestPress") {
      const press = 0.5 + 0.5 * Math.sin(t * 2.0);
      la = [-0.8 - 0.65 * press, 0, -0.45];
      ra = [-0.8 - 0.65 * press, 0, 0.45];
      pitch = motionKey === "inclinePress" ? -0.12 : 0;
    } else if (motionKey === "tricepsPressdown") {
      const press = 0.5 + 0.5 * Math.sin(t * 2.4);
      la = [-0.35 + 0.45 * press, 0, -0.12];
      ra = [-0.35 + 0.45 * press, 0, 0.12];
    } else if (motionKey === "latPulldown") {
      const pull = 0.5 + 0.5 * Math.sin(t * 2.0);
      la = [-1.55 + 1.05 * pull, 0, -0.35];
      ra = [-1.55 + 1.05 * pull, 0, 0.35];
    } else if (motionKey === "seatedRow" || motionKey === "bentOverRow") {
      const row = 0.5 + 0.5 * Math.sin(t * 2.0);
      la = [-0.35 + 0.75 * row, 0, -0.2];
      ra = [-0.35 + 0.75 * row, 0, 0.2];
      pitch = motionKey === "bentOverRow" ? 0.42 : 0;
    } else if (motionKey === "facePull") {
      const pull = 0.5 + 0.5 * Math.sin(t * 2.2);
      la = [-0.85 + 0.55 * pull, 0, -0.7];
      ra = [-0.85 + 0.55 * pull, 0, 0.7];
    } else if (motionKey === "dumbbellCurl") {
      const curl = 0.5 + 0.5 * Math.sin(t * 2.4);
      la = [-0.15 - 0.9 * curl, 0, -0.08];
      ra = [-0.15 - 0.9 * curl, 0, 0.08];
    } else if (motionKey === "backSquat") {
      const squat = 0.5 + 0.5 * Math.sin(t * 1.8);
      ll = [0.55 * squat, 0, -0.08];
      rl = [0.55 * squat, 0, 0.08];
      pitch = 0.12 * squat;
      rootLift = -0.42 * squat;
    } else if (motionKey === "reverseLunge") {
      const lunge = 0.5 + 0.5 * Math.sin(t * 1.8);
      rl = [0.65 * lunge, 0, 0.14];
      ll = [-0.18 * lunge, 0, -0.05];
      rootLift = -0.24 * lunge;
    } else if (motionKey === "legPress") {
      const press = 0.5 + 0.5 * Math.sin(t * 1.8);
      ll = [-0.9 + 0.75 * press, 0, 0];
      rl = [-0.9 + 0.75 * press, 0, 0];
      pitch = -0.3;
    } else if (motionKey === "legExtension") {
      const extend = 0.5 + 0.5 * Math.sin(t * 2.0);
      ll = [-0.25 - 0.85 * extend, 0, 0];
      rl = [-0.25 - 0.85 * extend, 0, 0];
    } else if (motionKey === "calfRaise") {
      rootLift = 0.08 * (0.5 + 0.5 * Math.sin(t * 2.4));
    } else if (motionKey === "hangingKneeRaise") {
      const raise = 0.5 + 0.5 * Math.sin(t * 2.0);
      ll = [-1.0 * raise, 0, 0];
      rl = [-1.0 * raise, 0, 0];
      la = [-1.4, 0, -0.18];
      ra = [-1.4, 0, 0.18];
    } else if (motionKey === "vSitCrunch") {
      const crunch = 0.5 + 0.5 * Math.sin(t * 2.0);
      ll = [-0.8 * crunch, 0, 0];
      rl = [-0.8 * crunch, 0, 0];
      pitch = 0.45 * crunch;
      rootLift = -0.28;
    } else if (motionKey === "sidePlank") {
      roll = 1.25;
      la = [-1.2, 0, -0.2];
      ra = [0.2, 0, 0.15];
      rootLift = -0.35;
    } else if (motionKey === "treadmillWalk") {
      const stride = Math.sin(t * 3.0);
      ll = [0.38 * stride, 0, 0];
      rl = [-0.38 * stride, 0, 0];
      la = [-0.18 * stride, 0, -0.08];
      ra = [0.18 * stride, 0, 0.08];
      rootLift = Math.abs(Math.sin(t * 3.0)) * 0.018;
    } else {
      const breathe = Math.sin(t * 1.2) * 0.035;
      la = [breathe, 0, -0.08];
      ra = [-breathe, 0, 0.08];
    }

    set(leftArm, ...la);
    set(rightArm, ...ra);
    set(leftLeg, ...ll);
    set(rightLeg, ...rl);

    if (root.current) {
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, pitch, ease);
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, facing + yaw, ease);
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, roll, ease);
      root.current.position.y = THREE.MathUtils.lerp(
        root.current.position.y,
        rootLift + Math.sin(t * 1.2) * 0.006,
        ease,
      );
    }
  });

  if (!visible) return null;

  const skin = athlete ? "#7dd3fc" : "#d1d5db";
  const shirt = athlete ? "#155e75" : "#1f2937";
  const shorts = "#0f172a";

  return (
    <group ref={root} position={position} rotation={[0, facing, 0]}>
      <mesh position={[0, 1.76, 0]} castShadow>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.56, 8, 18]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>

      <group ref={leftArm} position={[-0.29, 1.5, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.48, 6, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.29, 1.5, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.48, 6, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>

      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.48, 0.22, 0.28]} />
        <meshStandardMaterial color={shorts} roughness={0.9} />
      </mesh>

      <group ref={leftLeg} position={[-0.13, 0.9, 0]}>
        <mesh position={[0, -0.43, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.68, 6, 12]} />
          <meshStandardMaterial color={shorts} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.13, 0.9, 0]}>
        <mesh position={[0, -0.43, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.68, 6, 12]} />
          <meshStandardMaterial color={shorts} />
        </mesh>
      </group>
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
              motionKey={scene.motionKey}
              running={session.running && session.phase === "work"}
            />
          }
        />
      )}
      <PlaceholderHuman
        position={scene.athleteAnchor}
        facing={Math.PI}
        visible={manual}
        athlete
        motionKey={scene.motionKey}
        running={session.running && session.phase === "work"}
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
