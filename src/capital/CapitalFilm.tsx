import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AR, MONO } from "./fonts";
import {
  BEAD_FLIGHT,
  BEAD_SMALL_LAND,
  beadLargeLand,
  captureTime,
  DEPOSIT_FLIGHT,
  depositLand,
  DOT_LAND,
  LATE_DEPOSITS,
  M_FIELD,
  N_GRAINS,
  SPIRAL,
} from "./timeline";

// ───────────────────────── tokens ─────────────────────────
const W = 1080;
const H = 1920;
const BG = "#101216";
const INK = "#F3F0E9";
const SILVER = "#A6ADB8";
const COBALT = "#5278F7";
const MARGIN = 96;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const IN = Easing.bezier(0.7, 0, 0.84, 0);
const PLACE = Easing.bezier(0.3, 0.05, 0.15, 1);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

// ───────────────────────── 3D helpers ─────────────────────────
type V3 = { x: number; y: number; z: number };
const FOCAL = 1500;
const rotY = (p: V3, a: number): V3 => ({ x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a) });
const rotX = (p: V3, a: number): V3 => ({ x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) });
const project = (p: V3, cx: number, cy: number) => {
  const k = FOCAL / (FOCAL + p.z);
  return { x: cx + p.x * k, y: cy + p.y * k, k, z: p.z };
};
const depthBlur = (k: number) => (k > 1.18 ? Math.min(8, (k - 1.18) * 14) : k < 0.8 ? Math.min(3, (0.8 - k) * 8) : 0);

// ───────────────────────── typography ─────────────────────────
const Line: React.FC<{
  t: number;
  at: number;
  out?: number;
  size: number;
  weight?: number;
  color?: string;
  children: React.ReactNode;
  font?: string;
}> = ({ t, at, out, size, weight = 300, color = INK, children, font = AR }) => {
  const p = ip(t, [at, at + 1.0], [0, 1], EXPO);
  const q = out === undefined ? 0 : ip(t, [out, out + 0.55], [0, 1], IN);
  return (
    <div style={{ overflow: "hidden", padding: "0.18em 0.1em", margin: "-0.18em -0.1em" }}>
      <div
        style={{
          transform: `translateY(${(1 - p) * 115 - q * 115}%)`,
          fontFamily: font,
          fontSize: size,
          fontWeight: weight,
          color,
          lineHeight: 1.42,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Em: React.FC<{ children: React.ReactNode; color?: string; weight?: number }> = ({ children, color = INK, weight = 500 }) => (
  <span style={{ fontWeight: weight, color }}>{children}</span>
);

const CHAPTERS = [
  { at: 0.25, num: "01", label: "السؤال" },
  { at: 4.7, num: "02", label: "الجهد" },
  { at: 10.9, num: "03", label: "الجاذبية" },
  { at: 17.3, num: "04", label: "الأثر" },
  { at: 24.6, num: "05", label: "البداية" },
];

const Chapter: React.FC<{ t: number }> = ({ t }) => {
  const idx = CHAPTERS.reduce((a, c, i) => (t >= c.at ? i : a), -1);
  if (idx < 0) return null;
  const c = CHAPTERS[idx];
  const next = CHAPTERS[idx + 1];
  const out = next ? next.at - 0.5 : 27.0;
  const rule = ip(t, [c.at + 0.1, c.at + 0.9], [0, 1], EXPO) * (1 - ip(t, [out, out + 0.4], [0, 1], IN));
  return (
    <div style={{ position: "absolute", top: 170, right: MARGIN, display: "flex", alignItems: "center", gap: 22, direction: "rtl" }}>
      <Line t={t} at={c.at} out={out} size={30} weight={400} color={SILVER} font={MONO}>
        {c.num}
      </Line>
      <div style={{ width: 56 * rule, height: 1, background: SILVER, opacity: 0.6 }} />
      <Line t={t} at={c.at + 0.08} out={out} size={32} weight={400} color={SILVER}>
        {c.label}
      </Line>
    </div>
  );
};

// ───────────────────────── atmosphere ─────────────────────────
const Atmosphere: React.FC<{ t: number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const energy = ip(t, [11, 16.5], [0, 1]) * (1 - ip(t, [23.5, 25.5], [0, 1]));
  const lx = lerp(78, 60, ip(t, [0, 30], [0, 1]));
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 55% at ${lx}% 12%, rgba(243,240,233,0.075) 0%, rgba(243,240,233,0.02) 45%, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 58%, rgba(82,120,247,${0.07 * energy}) 0%, transparent 70%)`,
        }}
      />
      <Img
        src={staticFile(`grain${frame % 4}.png`)}
        style={{ position: "absolute", width: W, height: H, opacity: 0.055, mixBlendMode: "screen" }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// ───────────────────────── sphere primitives ─────────────────────────
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ceramic" cx="38%" cy="30%" r="78%" fx="34%" fy="26%">
      <stop offset="0%" stopColor="#FBFAF6" />
      <stop offset="22%" stopColor="#E4E2DD" />
      <stop offset="55%" stopColor="#9A9FA8" />
      <stop offset="82%" stopColor="#40454E" />
      <stop offset="100%" stopColor="#1F2228" />
    </radialGradient>
    <radialGradient id="cobalt" cx="36%" cy="30%" r="78%" fx="32%" fy="26%">
      <stop offset="0%" stopColor="#E3E9FF" />
      <stop offset="25%" stopColor="#8EA7FC" />
      <stop offset="60%" stopColor={COBALT} />
      <stop offset="100%" stopColor="#1A2560" />
    </radialGradient>
    <radialGradient id="rim" cx="42%" cy="36%" r="66%">
      <stop offset="78%" stopColor={COBALT} stopOpacity={0} />
      <stop offset="96%" stopColor={COBALT} stopOpacity={0.55} />
      <stop offset="100%" stopColor="#9DB3FF" stopOpacity={0.9} />
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={INK} stopOpacity={0.22} />
      <stop offset="100%" stopColor={INK} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="haloCobalt" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={COBALT} stopOpacity={0.28} />
      <stop offset="100%" stopColor={COBALT} stopOpacity={0} />
    </radialGradient>
  </defs>
);

type Drawable = { z: number; el: React.ReactNode };

const ball = (key: string, x: number, y: number, r: number, fill: "ceramic" | "cobalt", opacity = 1, blur = 0): React.ReactNode => (
  <circle key={key} cx={x} cy={y} r={Math.max(0.01, r)} fill={`url(#${fill})`} opacity={opacity} style={blur > 0.3 ? { filter: `blur(${blur}px)` } : undefined} />
);

// ───────────────────────── the world (all 3D matter) ─────────────────────────
const G = 54; // grain radius in world units at close-up
const SLOTS: V3[] = new Array(N_GRAINS).fill(0).map((_, k) => {
  if (k === 0) return { x: 0, y: 0, z: 0 };
  const phi = Math.acos(1 - (2 * (k + 0.5)) / N_GRAINS);
  const th = Math.PI * (1 + Math.sqrt(5)) * k;
  const d = G * 1.62 * Math.cbrt(k);
  return { x: d * Math.sin(phi) * Math.cos(th), y: d * Math.cos(phi) * 0.92, z: d * Math.sin(phi) * Math.sin(th) };
});
const CLUSTER_R = G * 1.62 * Math.cbrt(N_GRAINS - 1) + G;

const FIELD = new Array(M_FIELD).fill(0).map((_, j) => {
  const a = random(`na${j}`) * Math.PI * 2;
  const b = (random(`nb${j}`) - 0.5) * 1.3;
  const n: V3 = { x: Math.sin(b) * Math.cos(a), y: Math.cos(b), z: Math.sin(b) * Math.sin(a) };
  // orthonormal basis of the orbit plane
  const ref: V3 = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u0 = { x: n.y * ref.z - n.z * ref.y, y: n.z * ref.x - n.x * ref.z, z: n.x * ref.y - n.y * ref.x };
  const ul = Math.hypot(u0.x, u0.y, u0.z);
  const u = { x: u0.x / ul, y: u0.y / ul, z: u0.z / ul };
  const v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
  return {
    u,
    v,
    r0: 300 + random(`nr${j}`) * 480,
    th0: random(`nt${j}`) * Math.PI * 2,
    spin: 0.18 + random(`ns${j}`) * 0.2,
    size: 5 + random(`nz${j}`) * 5,
    appear: 11.3 + random(`np${j}`) * 1.2,
    c: captureTime(j),
  };
});

const sphereRadiusAt = (t: number) => {
  const absorbed = FIELD.filter((f) => f.c <= t).length + LATE_DEPOSITS.filter((d) => d <= t).length;
  const base = CLUSTER_R * 0.36 * 0.86;
  return { r: base * Math.sqrt(1 + absorbed * 0.072), frac: absorbed / (M_FIELD + LATE_DEPOSITS.length) };
};

const World: React.FC<{ t: number }> = ({ t }) => {
  const items: Drawable[] = [];
  const flat: React.ReactNode[] = [];

  // Camera / framing timeline for the cluster
  const push = ip(t, [3.9, 4.95], [0, 1], INOUT); // dot → close-up
  const pull = ip(t, [10.35, 11.5], [0, 1], INOUT); // close-up → wide
  const sc = lerp(lerp(7 / G, 1, push), 0.36, pull);
  const cx = W / 2;
  const cy = lerp(lerp(1300, 1190, push), 1060, pull);
  const fuse = ip(t, [10.75, 11.55], [0, 1], INOUT);
  const ry = t * 0.32;
  const rx = 0.38;

  // Squash on each landing (tactile)
  let squash = 0;
  for (let k = 1; k < N_GRAINS; k++) {
    const dt = t - depositLand(k);
    if (dt > 0 && dt < 0.5) squash += 0.022 * Math.exp(-dt * 11) * Math.sin(dt * 40 + 1.2);
  }

  // shot-4 / shot-5 sphere path
  const toDiagram = ip(t, [16.85, 17.95], [0, 1], INOUT);
  const toDot = ip(t, [24.0, 25.3], [0, 1], INOUT);
  const { r: rGrow, frac } = sphereRadiusAt(Math.min(t, 16.85));

  // ── phase A/B: grains (until fused)
  if (t < 11.6) {
    for (let k = 0; k < N_GRAINS; k++) {
      const land = depositLand(k);
      const start = land - DEPOSIT_FLIGHT;
      if (k > 0 && t < start) continue;
      const slot = rotX(rotY(SLOTS[k], ry), rx);
      const conv = 1 - fuse * 0.55;
      const target: V3 = { x: slot.x * conv * sc * (1 + squash), y: slot.y * conv * sc * (1 - squash), z: slot.z * conv * sc };
      let p = target;
      if (k > 0 && t < land) {
        const e = PLACE(ip(t, [start, land], [0, 1]));
        const side = k % 2 === 0 ? 1 : -1;
        const from: V3 = { x: side * (380 + 120 * Math.abs(Math.sin(k * 1.7))), y: 520, z: -620 };
        const mid: V3 = { x: lerp(from.x, target.x, 0.55), y: target.y + 140, z: lerp(from.z, target.z, 0.6) };
        // quadratic bezier for an arc
        const a = 1 - e;
        p = {
          x: a * a * from.x + 2 * a * e * mid.x + e * e * target.x,
          y: a * a * from.y + 2 * a * e * mid.y + e * e * target.y,
          z: a * a * from.z + 2 * a * e * mid.z + e * e * target.z,
        };
      }
      const pr = project(p, cx, cy);
      const r = G * sc * pr.k;
      const op = (1 - ip(t, [11.15, 11.4], [0, 1])) * (k > 0 ? ip(t, [start, start + 0.15], [0, 1]) : 1);
      items.push({ z: pr.z, el: ball(`g${k}`, pr.x, pr.y, r, "ceramic", op, depthBlur(pr.k)) });
      if (k === 0 && t < 4.4) {
        // the first riyal gets a quiet halo while alone
        const h = ip(t, [1.8, 2.6], [0, 1], EXPO) * (1 - push);
        flat.push(<circle key="halo0" cx={pr.x} cy={pr.y} r={60} fill="url(#halo)" opacity={h} />);
      }
    }
  }

  // ── the fused sphere (phase C → E)
  if (t >= 10.9 && t < 25.25) {
    const appear = ip(t, [10.95, 11.3], [0, 1], INOUT);
    let sx = cx;
    let sy = cy;
    let R = lerp(CLUSTER_R * sc * 0.86, rGrow, ip(t, [11.5, 12.0], [0, 1]));
    if (t < 11.5) R = CLUSTER_R * sc * 0.86;
    // to diagram
    sx = lerp(sx, 350, toDiagram);
    sy = lerp(sy, 1082, toDiagram);
    R = lerp(R, 190, toDiagram);
    // to dot
    sx = lerp(sx, W / 2, toDot);
    sy = lerp(sy, 1180, toDot);
    R = lerp(R, 9, Easing.in(Easing.quad)(toDot));
    const rimOp = Math.min(1, frac * 1.1) * (1 - toDot);
    const solidDot = ip(t, [24.9, 25.3], [0, 1]);
    // gentle absorption pulse
    let pulse = 0;
    FIELD.forEach((f) => {
      const dt = t - f.c;
      if (dt > 0 && dt < 0.3) pulse += 0.006 * Math.exp(-dt * 14);
    });
    R *= 1 + pulse;
    items.push({
      z: 0,
      el: (
        <g key="sphere" opacity={appear}>
          {t > 11.5 && t < 24.5 && <circle cx={sx} cy={sy} r={R * 1.9} fill="url(#haloCobalt)" opacity={rimOp * 0.8} />}
          {ball("core", sx, sy, R, "ceramic", 1 - solidDot)}
          <circle cx={sx} cy={sy} r={R} fill="url(#rim)" opacity={rimOp} />
          {solidDot > 0 && <circle cx={sx} cy={sy} r={R} fill={INK} opacity={solidDot} />}
        </g>
      ),
    });
  }

  // ── gravity field (phase C)
  if (t > 11.2 && t < 17.2) {
    const R = sphereRadiusAt(t).r;
    const center = { x: cx, y: cy };
    const fieldFade = 1 - ip(t, [16.75, 17.1], [0, 1]);
    FIELD.forEach((f, j) => {
      if (t >= f.c) return;
      const s = f.c - SPIRAL;
      const p = ip(t, [s, f.c], [0, 1], Easing.in(Easing.quad));
      const r = lerp(f.r0, R * 0.95, p);
      const th = f.th0 + t * f.spin + p * p * 7.5;
      const pos: V3 = {
        x: (f.u.x * Math.cos(th) + f.v.x * Math.sin(th)) * r,
        y: (f.u.y * Math.cos(th) + f.v.y * Math.sin(th)) * r * 0.9,
        z: (f.u.z * Math.cos(th) + f.v.z * Math.sin(th)) * r,
      };
      const pr = project(pos, center.x, center.y);
      const op = ip(t, [f.appear, f.appear + 0.8], [0, 1]) * fieldFade * (0.55 + 0.45 * p);
      items.push({ z: pr.z, el: ball(`f${j}`, pr.x, pr.y, f.size * pr.k * (1 - p * 0.35), "cobalt", op, depthBlur(pr.k)) });
    });
    // you keep saving — off-white grains still arrive from below, slowly
    LATE_DEPOSITS.forEach((land, i) => {
      const st = land - 1.1;
      if (t < st || t >= land) return;
      const e = PLACE(ip(t, [st, land], [0, 1]));
      const from = { x: (i % 2 ? -1 : 1) * 520, y: 700, z: -300 };
      const pos: V3 = { x: lerp(from.x, 0, e), y: lerp(from.y, R * 0.6, e), z: lerp(from.z, -R * 0.4, e) };
      const pr = project(pos, center.x, center.y);
      items.push({ z: pr.z, el: ball(`l${i}`, pr.x, pr.y, 14 * pr.k, "ceramic", ip(t, [st, st + 0.2], [0, 1]), depthBlur(pr.k)) });
    });
    // orbit hairlines
    const ringIn = ip(t, [11.6, 12.9], [0, 1], INOUT);
    [
      { r: 430, n: rotX({ x: 0, y: 1, z: 0 }, 1.25), tilt: 0.25 },
      { r: 600, n: rotX({ x: 0, y: 1, z: 0 }, 1.1), tilt: -0.35 },
    ].forEach((ring, ri) => {
      const pts: string[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2 + t * 0.05;
        let p: V3 = { x: Math.cos(a) * ring.r, y: 0, z: Math.sin(a) * ring.r };
        p = rotX(p, 1.25 + ri * 0.12);
        p = { x: p.x * Math.cos(ring.tilt) - p.y * Math.sin(ring.tilt), y: p.x * Math.sin(ring.tilt) + p.y * Math.cos(ring.tilt), z: p.z };
        const pr = project(p, center.x, center.y);
        pts.push(`${pr.x.toFixed(1)},${pr.y.toFixed(1)}`);
      }
      const len = ring.r * 2 * Math.PI * 1.05;
      flat.push(
        <polyline
          key={`ring${ri}`}
          points={pts.join(" ")}
          fill="none"
          stroke={SILVER}
          strokeWidth={1.4}
          opacity={0.22 * fieldFade}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - ringIn)}
        />,
      );
    });
  }

  // ── diagram: small mass + beads (phase D)
  if (t > 17.0 && t < 25) {
    const exit = ip(t, [23.85, 24.35], [0, 1], IN);
    const sIn = ip(t, [17.3, 18.3], [0, 1], EXPO);
    flat.push(ball("small", 790, 1212, 60 * sIn, "ceramic", 1 - exit));
    // beads
    const bead = (key: string, fromX: number, fromY: number, toX: number, toY: number, land: number) => {
      const st = land - BEAD_FLIGHT;
      if (t < st) return;
      const e = PLACE(ip(t, [st, land], [0, 1]));
      const a = 1 - e;
      const mx = lerp(fromX, toX, 0.2) + 40;
      const my = Math.min(fromY, toY) - 60;
      const x = a * a * fromX + 2 * a * e * mx + e * e * toX;
      const y = a * a * fromY + 2 * a * e * my + e * e * toY;
      const born = ip(t, [st, st + 0.2], [0, 1]);
      flat.push(ball(key, x, y, 13 * born, "cobalt", 1 - exit));
    };
    bead("bs", 790 + 44, 1212 - 40, 790, 1350, BEAD_SMALL_LAND);
    for (let i = 0; i < 10; i++) {
      const a = -0.6 - i * 0.12;
      bead(`bl${i}`, 350 + Math.cos(a) * 190, 1082 + Math.sin(a) * 190, 350 + (i - 4.5) * 33, 1350, beadLargeLand(i));
    }
    // baseline
    const base = ip(t, [17.5, 18.6], [0, 1], EXPO) * (1 - exit);
    flat.push(<line key="base" x1={W / 2 - 400 * base} x2={W / 2 + 400 * base} y1={1273} y2={1273} stroke={SILVER} strokeWidth={1.2} opacity={0.35} />);
  }

  items.sort((a, b) => b.z - a.z);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <Defs />
      {flat.filter((n) => (n as React.ReactElement)?.key?.toString().startsWith("ring"))}
      {flat.filter((n) => (n as React.ReactElement)?.key?.toString().startsWith("halo"))}
      {items.map((d) => d.el)}
      {flat.filter((n) => {
        const k = (n as React.ReactElement)?.key?.toString() ?? "";
        return !k.startsWith("ring") && !k.startsWith("halo");
      })}
    </svg>
  );
};

// ───────────────────────── copy for each shot ─────────────────────────
const RightBlock: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", top, right: MARGIN, left: MARGIN, direction: "rtl", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    {children}
  </div>
);

const Hook: React.FC<{ t: number }> = ({ t }) => {
  const out = 3.75;
  return (
    <RightBlock top={360}>
      <Line t={t} at={0.35} out={out} size={92} color={SILVER}>
        ليش أول
      </Line>
      <Line t={t} at={0.55} out={out + 0.04} size={150} weight={500}>
        100 ألف ريال
      </Line>
      <Line t={t} at={0.95} out={out + 0.08} size={92} color={SILVER}>
        أصعب من
      </Line>
      <Line t={t} at={1.15} out={out + 0.12} size={150} weight={500}>
        أول مليون؟
      </Line>
    </RightBlock>
  );
};

const RollNumber: React.FC<{ value: number; t: number; changedAt: number; size: number; color?: string }> = ({ value, t, changedAt, size, color = INK }) => {
  const p = ip(t, [changedAt, changedAt + 0.22], [0, 1], EXPO);
  return (
    <div style={{ overflow: "hidden", height: size * 1.3 }}>
      <div dir="ltr" style={{ fontFamily: MONO, fontWeight: 300, fontSize: size, color, lineHeight: 1.3, transform: `translateY(${(1 - p) * 40}%)`, opacity: 0.4 + 0.6 * p, fontVariantNumeric: "tabular-nums" }}>
        {value.toLocaleString("en-US")}
      </div>
    </div>
  );
};

const Effort: React.FC<{ t: number }> = ({ t }) => {
  const out = 10.15;
  let landed = 0;
  let last = 0;
  for (let k = 0; k < N_GRAINS; k++) {
    if (t >= depositLand(k)) {
      landed++;
      last = depositLand(k);
    }
  }
  const meterIn = ip(t, [5.0, 5.8], [0, 1], EXPO) * (1 - ip(t, [out, out + 0.5], [0, 1], IN));
  return (
    <>
      <RightBlock top={330}>
        <Line t={t} at={4.9} out={out} size={54} color={SILVER}>
          في البداية…
        </Line>
        <div style={{ height: 18 }} />
        <Line t={t} at={5.15} out={out + 0.04} size={80}>
          كل ريال تجمعه
        </Line>
        <Line t={t} at={5.3} out={out + 0.08} size={80}>
          يعتمد على <Em>تعبك</Em> و<Em>ادخارك</Em>.
        </Line>
      </RightBlock>
      <div style={{ position: "absolute", top: 1560, right: MARGIN, left: MARGIN, direction: "rtl", display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: meterIn }}>
        <div>
          <div style={{ fontFamily: AR, fontSize: 28, color: SILVER, fontWeight: 400, marginBottom: 6 }}>رأس المال · ريال</div>
          <RollNumber value={landed * 5000} t={t} changedAt={last} size={72} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: AR, fontSize: 28, color: SILVER, fontWeight: 400, marginBottom: 6 }}>إيداع</div>
          <RollNumber value={landed} t={t} changedAt={last} size={72} color={SILVER} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 1530, right: MARGIN, left: MARGIN, height: 1, background: SILVER, opacity: 0.3 * meterIn, transform: `scaleX(${meterIn})`, transformOrigin: "right" }} />
    </>
  );
};

const Gravity: React.FC<{ t: number }> = ({ t }) => {
  const out = 16.6;
  const legend = ip(t, [12.6, 13.4], [0, 1], EXPO) * (1 - ip(t, [out, out + 0.4], [0, 1], IN));
  const dot = (c: string) => <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 7, background: c, margin: "0 0 0 14px", verticalAlign: "middle" }} />;
  return (
    <>
      <RightBlock top={330}>
        <Line t={t} at={11.2} out={out} size={54} color={SILVER}>
          لكن مع الوقت…
        </Line>
        <div style={{ height: 18 }} />
        <Line t={t} at={11.45} out={out + 0.04} size={80}>
          رأس مالك يبدأ
        </Line>
        <Line t={t} at={11.6} out={out + 0.08} size={80} weight={500} color={COBALT}>
          يساعدك.
        </Line>
      </RightBlock>
      <div
        style={{
          position: "absolute",
          top: 1650,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 64,
          direction: "rtl",
          fontFamily: AR,
          fontSize: 32,
          fontWeight: 400,
          color: SILVER,
          opacity: legend,
          transform: `translateY(${(1 - legend) * 20}px)`,
        }}
      >
        <span>
          {dot("#DCDAD4")}جهدك
        </span>
        <span>
          {dot(COBALT)}نموّ رأس المال
        </span>
      </div>
    </>
  );
};

const Proof: React.FC<{ t: number }> = ({ t }) => {
  const out = 23.8;
  const col = (x: number, top: number, value: string, at: number) => (
    <div style={{ position: "absolute", left: x - 200, width: 400, top, textAlign: "center" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <Line t={t} at={at} out={out} size={50} font={MONO}>
          {value}
        </Line>
        <Line t={t} at={at + 0.1} out={out} size={28} color={SILVER} weight={400}>
          ريال
        </Line>
      </div>
    </div>
  );
  const res = (x: number, value: string, at: number) => (
    <div style={{ position: "absolute", left: x - 200, width: 400, top: 1395, textAlign: "center" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <Line t={t} at={at} out={out} size={56} color={COBALT} font={MONO} weight={400}>
          <bdi dir="ltr">{value}</bdi>
        </Line>
      </div>
    </div>
  );
  return (
    <>
      <RightBlock top={330}>
        <Line t={t} at={17.4} out={out} size={66}>
          كل ما زاد رأس مالك،
        </Line>
        <Line t={t} at={17.55} out={out + 0.04} size={66}>
          صار أثر نفس نسبة النمو <Em color={COBALT}>أكبر.</Em>
        </Line>
      </RightBlock>
      {col(350, 780, "100,000", 18.0)}
      {col(790, 1020, "10,000", 18.15)}
      {res(350, "+10,000", 20.75)}
      {res(790, "+1,000", 19.75)}
      <div style={{ position: "absolute", top: 1535, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={21.2} out={out} size={36} color={SILVER} weight={400}>
          نفس نسبة النمو <bdi dir="ltr" style={{ fontFamily: MONO, color: INK }}>10%</bdi> — أثر أكبر بعشر مرات
        </Line>
      </div>
      <div style={{ position: "absolute", top: 1700, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={18.6} out={out} size={26} color={SILVER} weight={400}>
          * مثال توضيحي للفكرة، وليس عائدًا مضمونًا
        </Line>
      </div>
    </>
  );
};

// End card: the dot becomes the full stop of «ابدأ اليوم»
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

  const out = 27.15;
  const textW = w ?? 600;
  const gap = 10;
  const dotR = 11;
  const total = textW + gap + dotR * 2;
  const dotX = W / 2 - total / 2 + dotR;
  const textRight = W / 2 + total / 2;
  const ctaY = 920;
  const baseline = ctaY + CTA_SIZE * 0.3;

  const travel = ip(t, [27.55, DOT_LAND], [0, 1], INOUT);
  const reveal = ip(t, [DOT_LAND - 0.15, DOT_LAND + 0.85], [0, 1], EXPO);
  const ripple = ip(t, [DOT_LAND, DOT_LAND + 1.3], [0, 1], EXPO);
  const toCobalt = ip(t, [DOT_LAND, DOT_LAND + 0.5], [0, 1]);
  const dx = lerp(W / 2, dotX, travel);
  const dy = lerp(1180, baseline - dotR, travel);
  const dr = lerp(9, dotR, travel);
  const settle = ip(t, [DOT_LAND, 30], [0, 1]);

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + settle * 0.025})` }}>
      <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
        <Line t={t} at={25.15} out={out} size={96}>
          المليون يبدأ
        </Line>
        <Line t={t} at={25.35} out={out + 0.05} size={96} weight={500}>
          من أول ريال.
        </Line>
      </div>
      {t > 25.2 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {ripple > 0 && ripple < 1 && (
            <circle cx={dx} cy={dy} r={dr + ripple * 160} fill="none" stroke={COBALT} strokeWidth={1.5} opacity={(1 - ripple) * 0.6} />
          )}
          <circle cx={dx} cy={dy} r={dr} fill={toCobalt > 0 ? COBALT : INK} opacity={1} />
          {toCobalt > 0 && toCobalt < 1 && <circle cx={dx} cy={dy} r={dr} fill={INK} opacity={1 - toCobalt} />}
        </svg>
      )}
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
          transform: `translateX(${(1 - reveal) * -30}px)`,
          opacity: t > DOT_LAND - 0.2 ? 1 : 0,
        }}
      >
        ابدأ اليوم
      </div>
      <div style={{ position: "absolute", top: 1720, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Line t={t} at={DOT_LAND + 0.7} size={26} color={SILVER} weight={400}>
          محتوى تعليمي، وليس نصيحة استثمارية
        </Line>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── film ─────────────────────────
export const CapitalFilm: React.FC<{ from?: number }> = ({ from = 0 }) => {
  const tt = useT() + from;
  const drift = `translate(${Math.sin(tt * 0.31) * 4}px, ${Math.cos(tt * 0.23) * 5}px)`;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, direction: "rtl" }}>
      {from === 0 && <Audio src={staticFile("capital-score.wav")} />}
      <Atmosphere t={tt} />
      <AbsoluteFill style={{ transform: drift }}>
        <World t={tt} />
        {tt < 4.6 && <Hook t={tt} />}
        {tt > 4.5 && tt < 10.9 && <Effort t={tt} />}
        {tt > 11 && tt < 17.2 && <Gravity t={tt} />}
        {tt > 17.2 && tt < 24.6 && <Proof t={tt} />}
        {tt > 24.9 && <Ending t={tt} />}
      </AbsoluteFill>
      <Chapter t={tt} />
    </AbsoluteFill>
  );
};
