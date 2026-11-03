// Original sound design for CapitalFilm. Mirrors src/capital/timeline.ts.
const fs = require("fs");
const path = require("path");
const SR = 48000, DUR = 30, N = SR * DUR, TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 99;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const put = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan * 0.6); R[i] += v * (1 + pan * 0.6); } };
const ip = (t, a, b, c, d) => (t <= a ? c : t >= b ? d : c + (d - c) * (t - a) / (b - a));

// timeline (mirror)
const depositLand = (k) => (k === 0 ? 4.8 : 5.3 + (k - 1) * 0.27 + 0.03 * Math.sin(k * 2.3));
const M = 90, captureTime = (j) => 12.0 + 4.7 * Math.pow((j + 1) / M, 0.45);
const LATE = [12.4, 13.6, 14.8, 16.0];
const beadSmall = 19.6, beadLarge = (i) => 19.75 + i * 0.13;
const DOT_LAND = 28.35;

// 1) Room tone + breathing drone, with a hole of near-silence before the end card
let b1 = 0, b2 = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const white = rnd();
  b1 += 0.02 * (white - b1); b2 += 0.003 * (b1 - b2);
  const silence = 1 - ip(t, 26.9, 27.5, 0, 0.92) + ip(t, 28.3, 28.6, 0, 0.6);
  const grow = 0.6 + ip(t, 10.5, 16.8, 0, 0.7) - ip(t, 17, 18, 0, 0.4);
  const breathe = 0.75 + 0.25 * Math.sin(TAU * 0.11 * t);
  const drone = (Math.sin(TAU * 55 * t) * 0.5 + Math.sin(TAU * 82.4 * t + 0.4) * 0.28 + Math.sin(TAU * 110.3 * t) * 0.12 * grow) * 0.05 * grow * breathe;
  const air = b2 * 1.6;
  const fade = ip(t, 0, 0.6, 0, 1) * ip(t, 29.2, 30, 1, 0);
  const v = (drone + air) * silence * fade;
  L[i] += v; R[i] += v * 0.97 + air * 0.02;
}

// 2) Tactile tick: dry, woody click for each hand-carried grain
const tick = (t0, amp, pitch, pan) => {
  let lp = 0;
  for (let j = 0; j < SR * 0.09; j++) {
    const lt = j / SR;
    lp += 0.35 * (rnd() - lp);
    const v = (lp * Math.exp(-lt * 160) * 0.9 + Math.sin(TAU * pitch * lt) * Math.exp(-lt * 55) * 0.6 + Math.sin(TAU * pitch * 0.5 * lt) * Math.exp(-lt * 30) * 0.5) * amp;
    put(Math.floor(t0 * SR) + j, v, pan);
  }
};
for (let k = 0; k < 20; k++) tick(depositLand(k), 0.22, 760 + (k % 3) * 40, k % 2 ? -0.4 : 0.4);
LATE.forEach((t, i) => tick(t, 0.13, 800, i % 2 ? -0.3 : 0.3));

// 3) Soft sub impacts at shot changes (controlled)
const sub = (t0, amp, f0 = 46) => {
  let ph = 0;
  for (let j = 0; j < SR * 2; j++) {
    const lt = j / SR, f = f0 + 30 * Math.exp(-lt * 9);
    ph += TAU * f / SR;
    const env = Math.min(1, lt / 0.012) * Math.exp(-lt * 2.3);
    put(Math.floor(t0 * SR) + j, Math.sin(ph) * env * amp);
  }
};
sub(0.3, 0.35); sub(4.85, 0.3); sub(10.9, 0.45); sub(17.3, 0.3); sub(24.1, 0.25, 40);

// 4) Low swells (camera moves): filtered noise rising into the cut
const swell = (t0, len, amp) => {
  let lp = 0;
  for (let j = 0; j < SR * len; j++) {
    const p = j / (SR * len);
    const env = Math.pow(p, 2.2) * (p > 0.92 ? (1 - p) / 0.08 : 1);
    lp += (0.004 + 0.05 * p) * (rnd() - lp);
    put(Math.floor(t0 * SR) + j, lp * env * amp * 6, Math.sin(p * 3) * 0.2);
  }
};
swell(3.85, 1.0, 0.18); swell(10.2, 0.75, 0.2); swell(16.6, 0.8, 0.14); swell(23.7, 0.9, 0.14);

// 5) Gravity: glassy micro-taps on every capture, density rises by itself
for (let j = 0; j < M; j++) {
  const t0 = captureTime(j), f = 2400 + ((j * 97) % 900);
  const pan = ((j * 37) % 100) / 50 - 1;
  for (let i = 0; i < SR * 0.12; i++) {
    const lt = i / SR;
    put(Math.floor(t0 * SR) + i, Math.sin(TAU * f * lt) * Math.exp(-lt * 45) * 0.045, pan);
  }
}

// 6) Beads in the diagram: pitched glass notes (1 vs 10)
const note = (t0, f, amp, decay, pan = 0) => {
  for (let i = 0; i < SR * decay * 1.5; i++) {
    const lt = i / SR;
    put(Math.floor(t0 * SR) + i, (Math.sin(TAU * f * lt) + 0.25 * Math.sin(TAU * f * 2.0 * lt)) * Math.exp(-lt * (4 / decay)) * Math.min(1, lt / 0.004) * amp, pan);
  }
};
note(beadSmall, 1046.5, 0.09, 0.5, 0.4);
[0, 2, 4, 7, 9, 12, 14, 16, 19, 21].forEach((s, i) => note(beadLarge(i), 523.25 * Math.pow(2, s / 12), 0.06, 0.45, -0.4 + i * 0.05));

// 7) The full stop: one clean tone + sub when the dot lands
note(DOT_LAND, 587.33, 0.16, 2.6);
note(DOT_LAND, 880, 0.05, 2.0);
sub(DOT_LAND, 0.3, 38);
note(1.85, 1174.7, 0.035, 1.2); // the first riyal appears

// normalize
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.85 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, "..", "public", "capital-score.wav"), buf);
console.log("ok peak", peak.toFixed(3));
