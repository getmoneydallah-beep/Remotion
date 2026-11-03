import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// ─────────────────────────────────────────────────────────────
// CLIMAX — "capital becomes a self-sustaining system"
// One pearl on a dark studio floor. It releases a cobalt bead.
// That bead releases another… every generation doubles (binary tree),
// each child born from its parent and placed on a golden-angle spiral.
// The camera begins as a low macro and cranes up to reveal the order
// that emerged by itself: a phyllotaxis galaxy around the original pearl.
// ─────────────────────────────────────────────────────────────

const BG = "#101216";
const INK = "#F3F0E9";
const COBALT = "#5278F7";

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const CRANE = Easing.bezier(0.55, 0, 0.15, 1); // slow lift-off, long graceful settle
const ARC = Easing.bezier(0.33, 0, 0.2, 1);

const CORE_R = 0.62;
const BEAD_R = 0.085;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const GENS = 8; // 1 → 255 beads
const N = 2 ** GENS - 1;
const T0 = 0.9; // first bead
const GEN_STEP = 0.42; // one doubling per beat

type Bead = { x: number; z: number; parent: number; birth: number; land: number; gen: number };

const BEADS: Bead[] = (() => {
  const arr: Bead[] = [];
  for (let i = 1; i <= N; i++) {
    const gen = Math.floor(Math.log2(i));
    const idxInGen = i - 2 ** gen;
    const genSize = 2 ** gen;
    const r = CORE_R + 0.2 + 0.165 * Math.sqrt(i);
    const a = i * GOLDEN;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // parent = nearest bead from an earlier generation → growth propagates outward like a crystal
    let parent = 0;
    let best = Infinity;
    for (let j = 1; j < 2 ** gen; j++) {
      const p = arr[j - 1];
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < best) {
        best = d;
        parent = j;
      }
    }
    if (gen === 0 || best > r - CORE_R) parent = 0;
    const birth = T0 + gen * GEN_STEP + (idxInGen / genSize) * 0.16;
    arr.push({ x, z, parent, birth, land: birth + 0.46, gen });
  }
  return arr;
})();

// position of bead i (1-based) at time t; returns null if unborn
const beadState = (i: number, t: number): { x: number; y: number; z: number; s: number } | null => {
  const b = BEADS[i - 1];
  if (t < b.birth) return null;
  // origin: top/side of parent at the moment of birth
  const dl = Math.hypot(b.x, b.z);
  let ox = (b.x / dl) * CORE_R * 0.85;
  let oy = CORE_R * 0.9;
  let oz = (b.z / dl) * CORE_R * 0.85;
  if (b.parent >= 1) {
    const p = BEADS[b.parent - 1];
    ox = p.x;
    oz = p.z;
    oy = BEAD_R * 2;
  }
  if (t < b.land) {
    const u = ip(t, [b.birth, b.land], [0, 1]);
    const e = ARC(u);
    const dx = b.x - ox;
    const dz = b.z - oz;
    const d = Math.hypot(dx, dz);
    const h = 0.05 + d * 0.22;
    const y = lerp(oy, BEAD_R, e) + Math.sin(Math.PI * e) * h;
    return { x: ox + dx * e, y, z: oz + dz * e, s: ip(u, [0, 0.18], [0.2, 1], Easing.out(Easing.cubic)) };
  }
  // landed: two small damped bounces (weight)
  const tau = t - b.land;
  const bounce = Math.abs(Math.sin(tau * 22)) * Math.exp(-tau * 9) * 0.045;
  return { x: b.x, y: BEAD_R + bounce, z: b.z, s: 1 };
};

const Studio: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.2;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 9, 26);
  }, [gl, scene]);
  return null;
};

const Rig: React.FC<{ t: number }> = ({ t }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  // macro: low, close, slowly orbiting the pearl
  const orbit = 0.55 + t * 0.07;
  const macro = new THREE.Vector3(Math.sin(orbit) * 4.6, 0.3, Math.cos(orbit) * 4.6);
  const macroLook = new THREE.Vector3(0, 0.58, 0);
  // crane: high, tilted overview of the emerged system
  const wide = new THREE.Vector3(0.6, 12.5, 6.2);
  const wideLook = new THREE.Vector3(0, 0, 0.2);
  const c = CRANE(ip(t, [1.75, 4.75], [0, 1]));
  // lift on a curve (rise first, then pull back) for a real crane feel
  const pos = new THREE.Vector3(
    lerp(macro.x, wide.x, c),
    lerp(macro.y, wide.y, Math.pow(c, 0.8)),
    lerp(macro.z, wide.z, Math.pow(c, 1.25)),
  );
  const look = macroLook.clone().lerp(wideLook, Math.pow(c, 0.7));
  cam.position.copy(pos);
  cam.fov = lerp(30, 38, c);
  cam.near = 0.05;
  cam.far = 60;
  cam.lookAt(look);
  cam.updateProjectionMatrix();
  // fog follows the lens: the floor always dissolves into the void, no horizon line
  const dist = pos.distanceTo(look);
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.near = dist * 0.75;
    scene.fog.far = dist * 2.1;
  }
  return null;
};

const World: React.FC<{ t: number }> = ({ t }) => {
  const geoBead = useMemo(() => new THREE.SphereGeometry(BEAD_R, 40, 28), []);
  const geoCore = useMemo(() => new THREE.SphereGeometry(CORE_R, 96, 64), []);
  const matCore = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#CFCAC1"),
        roughness: 0.36,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffffff"),
      }),
    [],
  );
  const matBead = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COBALT),
        roughness: 0.24,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    [],
  );
  const matFloor = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#0F1115"), roughness: 0.88, metalness: 0, envMapIntensity: 0.12 }), []);

  // the pearl "breathes" when it gives birth (recoil)
  let recoil = 0;
  BEADS.forEach((b) => {
    if (b.parent === 0) {
      const d = t - b.birth;
      if (d > 0 && d < 0.4) recoil += Math.sin(d * 30) * Math.exp(-d * 12) * 0.02;
    }
  });

  return (
    <>
      <Studio />
      <Rig t={t} />
      {/* key: soft, warm-white, from upper right */}
      <directionalLight
        position={[6, 6.5, 1.5]}
        intensity={2.1}
        color={INK}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-radius={6}
        shadow-bias={-0.0004}
      />
      {/* cool rim from behind to carve silhouettes */}
      <directionalLight position={[-5, 3.5, -6]} intensity={0.55} color={"#9DB3FF"} />
      <hemisphereLight args={["#1c2130", "#050608", 0.25]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={matFloor}>
        <planeGeometry args={[80, 80]} />
      </mesh>

      <mesh position={[0, CORE_R + recoil * 0.5, 0]} scale={[1 + recoil, 1 - recoil, 1 + recoil]} castShadow receiveShadow geometry={geoCore} material={matCore} />

      {BEADS.map((_, k) => {
        const s = beadState(k + 1, t);
        if (!s) return null;
        return <mesh key={k} position={[s.x, s.y, s.z]} scale={s.s} castShadow receiveShadow geometry={geoBead} material={matBead} />;
      })}
    </>
  );
};

export const ClimaxProto: React.FC<{ offset?: number }> = ({ offset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps + offset;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 1, 3] }}>
        <World t={t} />
      </ThreeCanvas>
      {/* lens vignette — no glow, just falloff */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
