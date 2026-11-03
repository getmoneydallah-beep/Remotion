import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AR, MONO } from "../capital/fonts";
import {
  BEAD_BIRTHS,
  BEAD_FLIGHT,
  DOT_LAND,
  FUSE_END,
  FUSE_START,
  GRAIN_FLIGHT,
  grainLand,
  N_GRAINS,
  SMALL_BEAD_BIRTH,
  SMALL_IN,
  SMALL_OUT,
  SPIRAL_FLIGHT,
  SPIRAL_N,
  spiralBirth,
  TO_SPIRAL,
  VO,
  VO_LEN,
} from "./timeline";

// ───────────── tokens ─────────────
const W = 1080;
const H = 1920;
const BG = "#101216";
const INK = "#F3F0E9";
const SILVER = "#A6ADB8";
const COBALT = "#5278F7";
const MARGIN = 96;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const SINE = Easing.bezier(0.37, 0, 0.63, 1);
const CRANE = Easing.bezier(0.55, 0, 0.12, 1);
const IN = Easing.bezier(0.7, 0, 0.84, 0);
const ARC = Easing.bezier(0.33, 0, 0.2, 1);

// ───────────── geometry of the story ─────────────
const G = 0.12; // grain radius
const PEARL_FUSED = 0.4;
const PEARL_R = 0.62;
const BEAD_R = 0.085;
const SMALL_R = 0.29;
const SMALL_POS = new THREE.Vector3(0.62, SMALL_R, 1.5);
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// pile of 20 grains: hex bottom layer, then grains resting in pockets above
const PILE: THREE.Vector3[] = (() => {
  const pts: THREE.Vector3[] = [new THREE.Vector3(0, G, 0)];
  for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(Math.cos((k * Math.PI) / 3) * 2 * G, G, Math.sin((k * Math.PI) / 3) * 2 * G));
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    pts.push(new THREE.Vector3(Math.cos(a) * 2 * G * Math.sqrt(3), G, Math.sin(a) * 2 * G * Math.sqrt(3)));
  }
  const layer = (base: THREE.Vector3[], want: number) => {
    const cands: THREE.Vector3[] = [];
    for (let a = 0; a < base.length; a++)
      for (let b = a + 1; b < base.length; b++)
        for (let c = b + 1; c < base.length; c++) {
          const A = base[a], B = base[b], C = base[c];
          if (A.distanceTo(B) > 2.05 * G || B.distanceTo(C) > 2.05 * G || A.distanceTo(C) > 2.05 * G) continue;
          const cx = (A.x + B.x + C.x) / 3, cz = (A.z + B.z + C.z) / 3;
          cands.push(new THREE.Vector3(cx, A.y + 2 * G * Math.sqrt(2 / 3), cz));
        }
    cands.sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
    const out: THREE.Vector3[] = [];
    for (const c of cands) {
      if (out.every((o) => o.distanceTo(c) >= 2 * G * 0.98)) out.push(c);
      if (out.length >= want) break;
    }
    return out;
  };
  const l2 = layer(pts, 6);
  const l3 = layer(l2, 1);
  return [...pts, ...l2, ...l3].slice(0, N_GRAINS);
})();

const GRID = new Array(10).fill(0).map((_, c) => new THREE.Vector3(-0.9 + (c % 5) * 0.19, BEAD_R, 0.86 + Math.floor(c / 5) * 0.2));
const SMALL_BEAD_POS = new THREE.Vector3(SMALL_POS.x, BEAD_R, SMALL_POS.z + 0.52);

type SB = { x: number; z: number; parent: number; birth: number; land: number };
const SPIRAL: SB[] = (() => {
  const arr: SB[] = [];
  for (let i = 1; i <= SPIRAL_N; i++) {
    const r = PEARL_R + 0.2 + 0.165 * Math.sqrt(i);
    const a = i * GOLDEN + 0.6;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (i <= 10) {
      arr.push({ x, z, parent: -1, birth: TO_SPIRAL[0], land: TO_SPIRAL[1] });
      continue;
    }
    const birth = spiralBirth(i) + 0.05 * Math.sin(i * 7.1);
    let parent = 0;
    let best = Infinity;
    for (let j = 1; j < i; j++) {
      const p = arr[j - 1];
      if (p.land > birth) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < best) {
        best = d;
        parent = j;
      }
    }
    if (best > r - PEARL_R) parent = 0;
    arr.push({ x, z, parent, birth, land: birth + SPIRAL_FLIGHT });
  }
  return arr;
})();

// ───────────── camera choreography ─────────────
type Key = { t: number; pos: [number, number, number]; look: [number, number, number]; fov: number; ease?: (n: number) => number };
const KEYS: Key[] = [
  { t: 0.0, pos: [1.0, 0.3, 1.75], look: [0, 0.34, 0], fov: 24 },
  { t: 5.0, pos: [0.82, 0.26, 1.46], look: [0, 0.3, 0], fov: 24, ease: SINE }, // breathe in on the first riyal
  { t: 6.4, pos: [2.4, 2.1, 5.4], look: [0, 0.15, 0], fov: 26, ease: INOUT }, // pull back: room for effort
  { t: 10.7, pos: [-1.5, 2.0, 5.5], look: [0, 0.2, 0], fov: 26, ease: SINE }, // slow lateral orbit while grains arrive
  { t: 12.0, pos: [-2.0, 1.4, 5.6], look: [0, 0.45, 0], fov: 28, ease: INOUT }, // fusion
  { t: 15.8, pos: [-1.2, 1.1, 5.6], look: [-0.15, 0.45, 0.35], fov: 28, ease: SINE }, // creep toward the first beads
  { t: 17.6, pos: [0, 3.4, 8.4], look: [0, 0.25, 0.55], fov: 30, ease: INOUT }, // rise to compare
  { t: 21.9, pos: [-0.1, 3.5, 8.7], look: [-0.05, 0.25, 0.5], fov: 30, ease: SINE },
  { t: 23.0, pos: [1.6, 0.75, 4.4], look: [0, 0.55, 0], fov: 30, ease: INOUT }, // anticipation: swoop low to the pearl
  { t: 26.6, pos: [0.45, 13.0, 6.2], look: [0, 0, 0.25], fov: 38, ease: CRANE }, // THE crane
  { t: 28.4, pos: [0, 16, 0.02], look: [0, 0, 0], fov: 36, ease: INOUT }, // top-down
  { t: 31.5, pos: [0, 16.8, 0.02], look: [0, 0, 0], fov: 36, ease: SINE },
];
const camAt = (t: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const e = (b.ease ?? INOUT)(ip(t, [a.t, b.t], [0, 1]));
  const pos = new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), e);
  // crane: rise first, travel back later — reads as a real jib, not a straight dolly
  if (b.ease === CRANE) {
    pos.y = lerp(a.pos[1], b.pos[1], Math.pow(e, 0.8));
    pos.z = lerp(a.pos[2], b.pos[2], Math.pow(e, 1.3));
  }
  const look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), e);
  return { pos, look, fov: lerp(a.fov, b.fov, e) };
};

// project a world point to screen pixels with the same camera as the 3D render
const projCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 80);
const toScreen = (p: THREE.Vector3, t: number) => {
  const c = camAt(t);
  projCam.position.copy(c.pos);
  projCam.fov = c.fov;
  projCam.lookAt(c.look);
  projCam.updateProjectionMatrix();
  projCam.updateMatrixWorld();
  const v = p.clone().project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

// ───────────── state of matter at time t ─────────────
const pearlRadius = (t: number) => {
  if (t < FUSE_START) return 0;
  if (t < FUSE_END) return PEARL_FUSED * EXPO(ip(t, [FUSE_START + 0.15, FUSE_END], [0, 1]));
  return lerp(PEARL_FUSED, PEARL_R, SINE(ip(t, [12.0, 16.6], [0, 1])));
};

const grainState = (k: number, t: number) => {
  const slot = PILE[k];
  const land = grainLand(k);
  if (k > 0 && t < land - GRAIN_FLIGHT) return null;
  let p = slot.clone();
  let s = 1;
  if (k > 0 && t < land) {
    const u = ip(t, [land - GRAIN_FLIGHT, land], [0, 1]);
    const e = ARC(u);
    const side = k % 2 ? -1 : 1;
    const from = new THREE.Vector3(side * 1.9, 0.9 + (k % 3) * 0.15, 0.4 + (k % 4) * 0.25);
    p = from.clone().lerp(slot, e);
    p.y = lerp(from.y, slot.y, e) + Math.sin(Math.PI * e) * 0.35;
  } else if (k > 0) {
    // weight: a short damped settle after touchdown
    const tau = t - land;
    p.y += Math.abs(Math.sin(tau * 24)) * Math.exp(-tau * 10) * 0.03;
  }
  // fusion: everything flows into the pearl's centre
  if (t > FUSE_START) {
    const f = INOUT(ip(t, [FUSE_START, FUSE_END], [0, 1]));
    p.lerp(new THREE.Vector3(0, PEARL_FUSED, 0), f);
    s = 1 - f;
  }
  return { p, s };
};

const arcBetween = (from: THREE.Vector3, to: THREE.Vector3, u: number, lift: number) => {
  const e = ARC(u);
  const p = from.clone().lerp(to, e);
  p.y = lerp(from.y, to.y, e) + Math.sin(Math.PI * e) * (0.06 + from.distanceTo(to) * lift);
  return p;
};

const settle = (tau: number) => Math.abs(Math.sin(tau * 22)) * Math.exp(-tau * 9) * 0.035;

// grid bead c (0..9): born from pearl, lands in grid, later rolls into spiral slot c+1
const gridBead = (c: number, t: number) => {
  const birth = BEAD_BIRTHS[c];
  if (t < birth) return null;
  const R = pearlRadius(birth);
  const slot = GRID[c];
  const dir = new THREE.Vector3(slot.x, 0, slot.z).normalize();
  const origin = new THREE.Vector3(dir.x * R * 0.8, R * 0.95, dir.z * R * 0.8);
  let p: THREE.Vector3;
  let s = 1;
  if (t < birth + BEAD_FLIGHT) {
    const u = ip(t, [birth, birth + BEAD_FLIGHT], [0, 1]);
    p = arcBetween(origin, slot, u, 0.25);
    s = ip(u, [0, 0.2], [0.25, 1], EXPO);
  } else {
    p = slot.clone();
    p.y += settle(t - birth - BEAD_FLIGHT);
  }
  if (t > TO_SPIRAL[0]) {
    const sp = SPIRAL[c];
    const u = ip(t, [TO_SPIRAL[0] + c * 0.03, TO_SPIRAL[1]], [0, 1]);
    p = arcBetween(slot, new THREE.Vector3(sp.x, BEAD_R, sp.z), u, 0.12);
    if (t > TO_SPIRAL[1]) p.y += settle(t - TO_SPIRAL[1]);
  }
  return { p, s };
};

const spiralBead = (i: number, t: number) => {
  const b = SPIRAL[i - 1];
  if (t < b.birth) return null;
  const to = new THREE.Vector3(b.x, BEAD_R, b.z);
  if (t >= b.land) {
    const p = to.clone();
    p.y += settle(t - b.land);
    return { p, s: 1 };
  }
  let from: THREE.Vector3;
  if (b.parent >= 1) {
    const q = SPIRAL[b.parent - 1];
    from = new THREE.Vector3(q.x, BEAD_R * 2, q.z);
  } else {
    const d = Math.hypot(b.x, b.z);
    from = new THREE.Vector3((b.x / d) * PEARL_R * 0.85, PEARL_R * 0.9, (b.z / d) * PEARL_R * 0.85);
  }
  const u = ip(t, [b.birth, b.land], [0, 1]);
  return { p: arcBetween(from, to, u, 0.22), s: ip(u, [0, 0.18], [0.2, 1], EXPO) };
};

const smallState = (t: number) => {
  if (t < SMALL_IN[0] || t > SMALL_OUT[1]) return null;
  const inE = Easing.bezier(0.2, 0.9, 0.3, 1.04)(ip(t, SMALL_IN, [0, 1])); // slight overshoot = mass
  const outE = Easing.bezier(0.55, 0, 0.9, 0.4)(ip(t, SMALL_OUT, [0, 1]));
  const x = lerp(4.2, SMALL_POS.x, inE) + outE * 5.5;
  return new THREE.Vector3(x, SMALL_R, SMALL_POS.z);
};

// ───────────── 3D scene ─────────────
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
    scene.fog = new THREE.Fog(BG, 6, 20);
  }, [gl, scene]);
  return null;
};

const Rig: React.FC<{ t: number }> = ({ t }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const c = camAt(t);
  cam.position.copy(c.pos);
  cam.fov = c.fov;
  cam.near = 0.03;
  cam.far = 80;
  cam.lookAt(c.look);
  cam.updateProjectionMatrix();
  const dist = c.pos.distanceTo(c.look);
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.near = dist * 0.8;
    scene.fog.far = dist * 2.2;
  }
  return null;
};

const World: React.FC<{ t: number }> = ({ t }) => {
  const geo = useMemo(
    () => ({
      grain: new THREE.SphereGeometry(G, 56, 40),
      bead: new THREE.SphereGeometry(BEAD_R, 40, 28),
      pearl: new THREE.SphereGeometry(1, 128, 96),
    }),
    [],
  );
  const mat = useMemo(
    () => ({
      ceramic: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#CFCAC1"),
        roughness: 0.36,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        sheen: 0.35,
        sheenColor: new THREE.Color("#ffffff"),
      }),
      pearl: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#D2CDC4"),
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        sheen: 0.5,
        sheenColor: new THREE.Color("#ffffff"),
        iridescence: 0.12,
        iridescenceIOR: 1.3,
      }),
      cobalt: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(COBALT), roughness: 0.24, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
      floor: new THREE.MeshStandardMaterial({ color: new THREE.Color("#0F1115"), roughness: 0.88, envMapIntensity: 0.12 }),
    }),
    [],
  );

  const R = t > 28.8 ? 0 : pearlRadius(t); // after 28.8 the 2D full stop *is* the pearl
  // recoil whenever the pearl gives birth
  let recoil = 0;
  [...BEAD_BIRTHS, ...SPIRAL.filter((b) => b.parent === 0 && b.birth > 23).map((b) => b.birth)].forEach((bt) => {
    const d = t - bt;
    if (d > 0 && d < 0.4) recoil += Math.sin(d * 30) * Math.exp(-d * 12) * 0.018;
  });
  const meshes: React.ReactNode[] = [];

  if (t < FUSE_END + 0.05) {
    for (let k = 0; k < N_GRAINS; k++) {
      const g = grainState(k, t);
      if (!g || g.s <= 0.01) continue;
      meshes.push(<mesh key={`g${k}`} position={g.p} scale={g.s} castShadow receiveShadow geometry={geo.grain} material={mat.ceramic} />);
    }
  }
  if (R > 0.001) {
    meshes.push(
      <mesh
        key="pearl"
        position={[0, R * (1 - recoil * 0.5), 0]}
        scale={[R * (1 + recoil), R * (1 - recoil), R * (1 + recoil)]}
        castShadow
        receiveShadow
        geometry={geo.pearl}
        material={mat.pearl}
      />,
    );
  }
  for (let c = 0; c < 10; c++) {
    const b = gridBead(c, t);
    if (b) meshes.push(<mesh key={`b${c}`} position={b.p} scale={b.s} castShadow receiveShadow geometry={geo.bead} material={mat.cobalt} />);
  }
  const sp = smallState(t);
  if (sp) {
    meshes.push(<mesh key="small" position={sp} scale={SMALL_R} castShadow receiveShadow geometry={geo.pearl} material={mat.ceramic} />);
    if (t > SMALL_BEAD_BIRTH) {
      const origin = new THREE.Vector3(sp.x, SMALL_R * 1.7, sp.z + SMALL_R * 0.5);
      const u = ip(t, [SMALL_BEAD_BIRTH, SMALL_BEAD_BIRTH + BEAD_FLIGHT], [0, 1]);
      let p = arcBetween(origin, SMALL_BEAD_POS, u, 0.25);
      if (u >= 1) p = new THREE.Vector3(sp.x, BEAD_R + settle(t - SMALL_BEAD_BIRTH - BEAD_FLIGHT), SMALL_BEAD_POS.z);
      meshes.push(<mesh key="sb" position={p} scale={ip(u, [0, 0.2], [0.25, 1])} castShadow receiveShadow geometry={geo.bead} material={mat.cobalt} />);
    }
  }
  if (t > 23.0) {
    for (let i = 11; i <= SPIRAL_N; i++) {
      const b = spiralBead(i, t);
      if (b) meshes.push(<mesh key={`s${i}`} position={b.p} scale={b.s} castShadow receiveShadow geometry={geo.bead} material={mat.cobalt} />);
    }
  }

  return (
    <>
      <Studio />
      <Rig t={t} />
      <directionalLight
        position={[6, 6.5, 1.5]}
        intensity={2.1}
        color={INK}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-5, 3.5, -6]} intensity={0.55} color={"#9DB3FF"} />
      <hemisphereLight args={["#1c2130", "#050608", 0.25]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat.floor}>
        <planeGeometry args={[90, 90]} />
      </mesh>
      {meshes}
    </>
  );
};

// ───────────── typography ─────────────
const Line: React.FC<{ t: number; at: number; out?: number; size: number; weight?: number; color?: string; font?: string; children: React.ReactNode }> = ({
  t,
  at,
  out,
  size,
  weight = 300,
  color = INK,
  font = AR,
  children,
}) => {
  const p = ip(t, [at, at + 1.0], [0, 1], EXPO);
  const q = out === undefined ? 0 : ip(t, [out, out + 0.55], [0, 1], IN);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{ overflow: "hidden", padding: "0.18em 0.1em", margin: "-0.18em -0.1em" }}>
      <div style={{ transform: `translateY(${(1 - p) * 115 - q * 115}%)`, fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1.42, whiteSpace: "nowrap", textShadow: "0 2px 24px rgba(16,18,22,0.6)" }}>
        {children}
      </div>
    </div>
  );
};

const RightBlock: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", top, right: MARGIN, left: MARGIN, direction: "rtl", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>{children}</div>
);

const Scrim: React.FC<{ t: number }> = ({ t }) => {
  // top falloff only while copy is on screen — the image stays clean otherwise
  const on = Math.max(ip(t, [0, 0.6], [1, 1]) * (1 - ip(t, [5.2, 6.0], [0, 1])), ip(t, [5.8, 6.4], [0, 1]) * (1 - ip(t, [15.3, 16.0], [0, 1])), ip(t, [26.2, 26.8], [0, 1]));
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(16,18,22,${0.85 * on}) 0%, rgba(16,18,22,${0.55 * on}) 30%, transparent 48%)` }} />;
};

const Counter: React.FC<{ t: number }> = ({ t }) => {
  let landed = 0;
  let last = 0;
  for (let k = 0; k < N_GRAINS; k++) {
    if (t >= grainLand(k) && (k === 0 ? t > 6.0 : true)) {
      landed++;
      last = grainLand(k);
    }
  }
  const vis = ip(t, [6.0, 6.8], [0, 1], EXPO) * (1 - ip(t, [10.6, 11.1], [0, 1], IN));
  if (vis <= 0) return null;
  const roll = ip(t, [last, last + 0.22], [0, 1], EXPO);
  return (
    <div style={{ position: "absolute", top: 1590, right: MARGIN, left: MARGIN, direction: "rtl", opacity: vis }}>
      <div style={{ height: 1, background: SILVER, opacity: 0.3, transform: `scaleX(${vis})`, transformOrigin: "right", marginBottom: 26 }} />
      <div style={{ fontFamily: AR, fontSize: 28, color: SILVER }}>رأس المال · ريال</div>
      <div style={{ overflow: "hidden", height: 92 }}>
        <div dir="ltr" style={{ fontFamily: MONO, fontWeight: 300, fontSize: 72, color: INK, lineHeight: 1.28, textAlign: "right", transform: `translateY(${(1 - roll) * 40}%)`, opacity: 0.4 + 0.6 * roll }}>
          {(landed * 5000).toLocaleString("en-US")}
        </div>
      </div>
    </div>
  );
};

const Tag: React.FC<{ t: number; at: number; out: number; world: THREE.Vector3; dy: number; children: React.ReactNode }> = ({ t, at, out, world, dy, children }) => {
  const s = toScreen(world, t);
  return (
    <div style={{ position: "absolute", left: s.x - 250, top: s.y + dy, width: 500, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>{React.Children.map(children, (c) => c)}</div>
    </div>
  );
};

const Proof: React.FC<{ t: number }> = ({ t }) => {
  const out = 21.75;
  return (
    <>
      <Tag t={t} at={17.7} out={out} world={new THREE.Vector3(0, PEARL_R * 2, 0)} dy={-150}>
        <Line t={t} at={17.7} out={out} size={48} font={MONO}>100,000</Line>
        <Line t={t} at={17.8} out={out} size={28} color={SILVER} weight={400}>ريال</Line>
      </Tag>
      <Tag t={t} at={18.1} out={out} world={new THREE.Vector3(SMALL_POS.x, SMALL_R * 2, SMALL_POS.z)} dy={-140}>
        <Line t={t} at={18.1} out={out} size={48} font={MONO}>10,000</Line>
        <Line t={t} at={18.2} out={out} size={28} color={SILVER} weight={400}>ريال</Line>
      </Tag>
      <Tag t={t} at={20.6} out={out} world={new THREE.Vector3(-0.52, 0, 1.12)} dy={22}>
        <Line t={t} at={20.6} out={out} size={52} color={COBALT} font={MONO} weight={400}><bdi dir="ltr">+10,000</bdi></Line>
      </Tag>
      <Tag t={t} at={19.3} out={out} world={new THREE.Vector3(SMALL_POS.x, 0, SMALL_BEAD_POS.z)} dy={26}>
        <Line t={t} at={19.3} out={out} size={52} color={COBALT} font={MONO} weight={400}><bdi dir="ltr">+1,000</bdi></Line>
      </Tag>
      <div style={{ position: "absolute", top: 1590, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={17.9} out={out} size={44} color={INK}>
          نفس نسبة النمو <bdi dir="ltr" style={{ fontFamily: MONO, fontWeight: 400 }}>10%</bdi>
        </Line>
      </div>
      <div style={{ position: "absolute", top: 1730, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={18.4} out={out} size={26} color={SILVER} weight={400}>* مثال توضيحي للفكرة، وليس عائدًا مضمونًا</Line>
      </div>
    </>
  );
};

const CTA_SIZE = 150;
const Ending: React.FC<{ t: number }> = ({ t }) => {
  const [w, setW] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("measure CTA"));
  useEffect(() => {
    document.fonts.load(`500 ${CTA_SIZE}px PlexArabic`, "ابدأ اليوم").then(() => {
      const c = document.createElement("canvas").getContext("2d")!;
      c.font = `500 ${CTA_SIZE}px PlexArabic`;
      setW(c.measureText("ابدأ اليوم").width);
      continueRender(handle);
    });
  }, [handle]);
  const textW = w ?? 600;
  const dotR = 11;
  const total = textW + 10 + dotR * 2;
  const dotX = W / 2 - total / 2 + dotR;
  const textRight = W / 2 + total / 2;
  const ctaY = 930;
  const baseline = ctaY + CTA_SIZE * 0.3;

  // the pearl, seen from above, becomes the full stop
  const pearlScr = toScreen(new THREE.Vector3(0, PEARL_R, 0), t);
  const edge = toScreen(new THREE.Vector3(PEARL_R, PEARL_R, 0), t);
  const pearlPx = Math.abs(edge.x - pearlScr.x);
  const take = ip(t, [28.55, 28.8], [0, 1]);
  const travel = ip(t, [28.8, DOT_LAND], [0, 1], INOUT);
  const dx = lerp(pearlScr.x, dotX, travel);
  const dy = lerp(pearlScr.y, baseline - dotR, travel);
  const dr = lerp(pearlPx, dotR, Easing.in(Easing.quad)(travel));
  const reveal = ip(t, [DOT_LAND - 0.1, DOT_LAND + 0.9], [0, 1], EXPO);
  const toCobalt = ip(t, [DOT_LAND, DOT_LAND + 0.6], [0, 1]);
  const dim = ip(t, [28.5, 29.4], [0, 0.78], INOUT);
  const col = toCobalt > 0 ? `rgb(${Math.round(lerp(243, 82, toCobalt))},${Math.round(lerp(240, 120, toCobalt))},${Math.round(lerp(233, 247, toCobalt))})` : INK;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: BG, opacity: dim }} />
      <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
        <Line t={t} at={26.5} out={28.45} size={84}>المليون يبدأ</Line>
        <Line t={t} at={26.75} out={28.5} size={84} weight={500}>من أول ريال.</Line>
      </div>
      {take > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={dx} cy={dy} r={dr} fill={col} opacity={take} />
        </svg>
      )}
      {t > DOT_LAND - 0.15 && (
        <div
          style={{
            position: "absolute",
            top: ctaY - CTA_SIZE * 0.71,
            right: W - textRight,
            fontFamily: AR,
            fontSize: CTA_SIZE,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.42,
            whiteSpace: "nowrap",
            direction: "rtl",
            clipPath: `inset(0 0 0 ${(1 - reveal) * 100}%)`,
            transform: `translateX(${(1 - reveal) * -24}px)`,
          }}
        >
          ابدأ اليوم
        </div>
      )}
      <div style={{ position: "absolute", top: 1730, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={DOT_LAND + 0.8} size={26} color={SILVER} weight={400}>محتوى تعليمي، وليس نصيحة استثمارية</Line>
      </div>
    </AbsoluteFill>
  );
};

// ───────────── sound mix ─────────────
const voiceActive = (t: number) => VO.some((v, i) => t > v.at - 0.25 && t < v.at + VO_LEN[i] + 0.2);
const Mix: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Audio
        src={staticFile("music/clip2.mp3")}
        volume={(f) => {
          const t = f / fps;
          const swell = ip(t, [22.6, 23.2], [0, 1]) * (1 - ip(t, [26.0, 27.0], [0, 1]));
          const duck = voiceActive(t) ? 0.42 : 0.62;
          return (duck + swell * 0.25) * ip(t, [0, 0.4], [0, 1]) * ip(t, [30.6, 31.4], [1, 0]);
        }}
      />
      <Audio src={staticFile("capital3d-sfx.wav")} volume={0.55} />
      {VO.map((v) => (
        <Sequence key={v.src} from={Math.round(v.at * fps)}>
          <Audio src={staticFile(v.src)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

// ───────────── film ─────────────
export const Film3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, direction: "rtl" }}>
      <Mix />
      <ThreeCanvas width={W} height={H} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 1, 3] }}>
        <World t={t} />
      </ThreeCanvas>
      <Scrim t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
      <Img src={staticFile(`grain${frame % 4}.png`)} style={{ position: "absolute", width: W, height: H, opacity: 0.045, mixBlendMode: "screen" }} />

      {t < 5.6 && (
        <RightBlock top={300}>
          <Line t={t} at={0.6} out={4.95} size={84} color={SILVER}>ليش أول</Line>
          <Line t={t} at={0.8} out={5.0} size={136} weight={500}>100 ألف ريال</Line>
          <Line t={t} at={2.0} out={5.05} size={84} color={SILVER}>أصعب من</Line>
          <Line t={t} at={2.25} out={5.1} size={136} weight={500}>أول مليون؟</Line>
        </RightBlock>
      )}
      {t > 5.8 && t < 11.2 && (
        <RightBlock top={300}>
          <Line t={t} at={5.95} out={10.55} size={52} color={SILVER}>في البداية…</Line>
          <div style={{ height: 14 }} />
          <Line t={t} at={6.6} out={10.6} size={76}>كل ريال تجمعه</Line>
          <Line t={t} at={6.75} out={10.65} size={76}>
            من <span style={{ fontWeight: 500 }}>تعبك</span> و<span style={{ fontWeight: 500 }}>ادخارك</span>.
          </Line>
        </RightBlock>
      )}
      <Counter t={t} />
      {t > 11.6 && t < 16.2 && (
        <RightBlock top={300}>
          <Line t={t} at={11.75} out={15.4} size={52} color={SILVER}>لكن مع الوقت…</Line>
          <div style={{ height: 14 }} />
          <Line t={t} at={12.6} out={15.45} size={76}>رأس مالك يبدأ</Line>
          <Line t={t} at={12.75} out={15.5} size={76} weight={500} color={COBALT}>يشتغل معك.</Line>
        </RightBlock>
      )}
      {t > 17.5 && t < 22.5 && <Proof t={t} />}
      {t > 26.3 && <Ending t={t} />}
    </AbsoluteFill>
  );
};
