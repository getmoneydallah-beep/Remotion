// Generates an original ambient score + sound effects (no third-party assets).
const fs = require("fs");
const path = require("path");
const SR = 44100, DUR = 30, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const add = (i, v, pan = 0) => { if (i < 0 || i >= N) return; L[i] += v * (1 - pan) ; R[i] += v * (1 + pan); };
const TAU = Math.PI * 2;

// Pad chords
const chords = [
  [0, 8, [110, 164.81, 220, 261.63]],
  [7.5, 15.5, [87.31, 130.81, 174.61, 220]],
  [15, 23, [130.81, 196, 261.63, 329.63]],
  [22.5, 30, [98, 146.83, 196, 246.94, 293.66]],
];
for (const [s, e, notes] of chords) {
  for (let i = Math.floor(s * SR); i < Math.min(N, e * SR); i++) {
    const t = i / SR, lt = t - s, len = e - s;
    const env = Math.min(1, lt / 1.8) * Math.min(1, (len - lt) / 1.8);
    let v = 0;
    notes.forEach((f, k) => {
      v += Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 1.003 * t + k) * 0.35 + Math.sin(TAU * f * 2 * t) * 0.08;
    });
    const trem = 0.85 + 0.15 * Math.sin(TAU * 0.25 * t);
    v *= 0.045 * env * trem;
    add(i, v, 0.15 * Math.sin(TAU * 0.07 * t));
  }
}
// Pulse
const kick = (t0, amp) => {
  for (let j = 0; j < SR * 0.35; j++) {
    const lt = j / SR, f = 50 + 60 * Math.exp(-lt * 30);
    add(Math.floor(t0 * SR) + j, Math.sin(TAU * f * lt) * Math.exp(-lt * 9) * amp);
  }
};
for (let t = 4; t < 17; t += 1) kick(t, 0.28);
for (let t = 17; t < 24; t += 0.5) kick(t, 0.3);
// Booms
const boom = (t0, amp) => {
  let ph = 0;
  for (let j = 0; j < SR * 2.5; j++) {
    const lt = j / SR, f = 35 + 60 * Math.exp(-lt * 4);
    ph += TAU * f / SR;
    const v = Math.sin(ph) * Math.exp(-lt * 1.6) * amp + rnd() * Math.exp(-lt * 12) * amp * 0.25;
    add(Math.floor(t0 * SR) + j, v);
  }
};
boom(0.02, 0.8); boom(10.0, 0.55); boom(26.8, 0.85);
// Whooshes
const whoosh = (t0, len, amp) => {
  let lp = 0;
  for (let j = 0; j < SR * len; j++) {
    const p = j / (SR * len);
    const env = p < 0.7 ? Math.pow(p / 0.7, 2) : Math.pow((1 - p) / 0.3, 1.5);
    const cut = 0.01 + 0.25 * env;
    lp += cut * (rnd() - lp);
    add(Math.floor(t0 * SR) + j, lp * env * amp * 3, Math.sin(p * Math.PI - Math.PI / 2) * 0.7);
  }
};
whoosh(3.2, 0.9, 0.35); whoosh(9.4, 0.8, 0.3); whoosh(16.5, 0.8, 0.3); whoosh(23.5, 0.8, 0.3); whoosh(25.6, 1.2, 0.45);
// Counter ticks (accelerating)
for (let t = 4.6; t < 9.5;) {
  for (let j = 0; j < SR * 0.02; j++) add(Math.floor(t * SR) + j, Math.sin(TAU * 2800 * j / SR) * Math.exp(-j / SR * 250) * 0.06, 0.2);
  t += 0.22 - 0.16 * ((t - 4.6) / 4.9);
}
// Shimmer / bells
[[26.8, 880], [26.95, 1318.5], [27.1, 1108.7], [27.3, 1760], [27.6, 1318.5]].forEach(([t0, f]) => {
  for (let j = 0; j < SR * 3; j++) {
    const lt = j / SR;
    add(Math.floor(t0 * SR) + j, (Math.sin(TAU * f * lt) + 0.3 * Math.sin(TAU * f * 2.01 * lt)) * Math.exp(-lt * 1.5) * 0.06, rnd() * 0.0 + (f % 3 - 1) * 0.3);
  }
});
// Fade out + normalize
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, fo = t > 28.3 ? Math.max(0, (30 - t) / 1.7) : 1, fi = Math.min(1, t / 0.01);
  L[i] *= fo * fi; R[i] *= fo * fi;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, "..", "public", "finance-score.wav"), buf);
console.log("ok");
