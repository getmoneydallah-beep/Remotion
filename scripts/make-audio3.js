// Tactile SFX layer for Film3D (sits under Lyria music + Gemini VO). Mirrors src/capital3d/timeline.ts.
const fs = require("fs"), path = require("path");
const SR = 48000, DUR = 31.5, N = Math.round(SR * DUR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const put = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan * 0.6); R[i] += v * (1 + pan * 0.6); } };

const grainLand = (k) => 6.1 + (k - 1) * 0.235;
const BEADS = [13.1, 14.3, 14.55, 19.25, 19.42, 19.59, 19.76, 19.93, 20.1, 20.27].map((b) => b + 0.5);
const SMALL_BEAD = 18.75 + 0.5;
const spiralLand = (i) => 23.0 + Math.log2(i / 10) * 0.58 + 0.05 * Math.sin(i * 7.1) + 0.46;
const DOT = 29.3;

// ceramic-on-floor knock: short noise + low body
const knock = (t0, amp, body, pan) => {
  let lp = 0;
  for (let j = 0; j < SR * 0.12; j++) {
    const lt = j / SR; lp += 0.3 * (rnd() - lp);
    const v = (lp * Math.exp(-lt * 140) * 0.8 + Math.sin(TAU * body * lt) * Math.exp(-lt * 38) * 0.7 + Math.sin(TAU * body * 2.7 * lt) * Math.exp(-lt * 70) * 0.25) * amp;
    put(Math.floor(t0 * SR) + j, v, pan);
    // tiny secondary bounce
    put(Math.floor((t0 + 0.07) * SR) + j, v * 0.25, pan);
  }
};
const glass = (t0, f, amp, decay, pan = 0) => {
  for (let j = 0; j < SR * decay * 1.6; j++) {
    const lt = j / SR;
    put(Math.floor(t0 * SR) + j, (Math.sin(TAU * f * lt) + 0.3 * Math.sin(TAU * f * 2.76 * lt) * Math.exp(-lt * 6)) * Math.exp(-lt * (4 / decay)) * Math.min(1, lt / 0.003) * amp, pan);
  }
};
const sub = (t0, amp, f0 = 44) => {
  let ph = 0;
  for (let j = 0; j < SR * 2.2; j++) {
    const lt = j / SR, f = f0 + 26 * Math.exp(-lt * 8); ph += TAU * f / SR;
    put(Math.floor(t0 * SR) + j, Math.sin(ph) * Math.min(1, lt / 0.015) * Math.exp(-lt * 2.2) * amp);
  }
};
const air = (t0, len, amp) => { // soft rising air for camera moves
  let lp = 0;
  for (let j = 0; j < SR * len; j++) {
    const p = j / (SR * len), env = Math.pow(Math.sin(Math.PI * p), 2);
    lp += (0.004 + 0.03 * p) * (rnd() - lp);
    put(Math.floor(t0 * SR) + j, lp * env * amp * 6, Math.sin(p * 3 - 1.5) * 0.3);
  }
};

knock(0.0 + 0.05, 0.0, 300, 0); // placeholder (silent)
for (let k = 1; k < 20; k++) knock(grainLand(k), 0.32, 210 + (k % 4) * 18, k % 2 ? -0.35 : 0.35);
sub(10.95, 0.35); air(10.6, 1.4, 0.12);           // fusion
BEADS.forEach((b, i) => glass(b, 1318.5 * Math.pow(2, (i % 5) / 12), 0.07, 0.5, -0.3));
glass(SMALL_BEAD, 1046.5, 0.08, 0.5, 0.4);
air(16.9, 1.2, 0.08); air(21.8, 1.4, 0.1);         // camera moves
sub(23.0, 0.3, 40);                                 // the swell / crane begins
for (let i = 11; i <= 255; i += 3) glass(spiralLand(i), 1760 + ((i * 53) % 1400), 0.022, 0.25, ((i * 37) % 100) / 50 - 1);
glass(DOT, 587.33, 0.14, 2.6); glass(DOT, 880, 0.05, 2.0); sub(DOT, 0.22, 38);

let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.8 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, "..", "public", "capital3d-sfx.wav"), buf);
console.log("ok");
