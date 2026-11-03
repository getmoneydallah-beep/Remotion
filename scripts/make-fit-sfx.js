// Whooshes + low drone bed for the fitness pilot (original, synthesized)
const fs = require("fs"), path = require("path");
const SR = 48000, DUR = 9.2, N = Math.round(SR * DUR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 3; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const put = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan * 0.7); R[i] += v * (1 + pan * 0.7); } };
const whoosh = (t0, len, amp, dir) => { let lp = 0, lp2 = 0;
  for (let j = 0; j < SR * len; j++) { const p = j / (SR * len), env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.7)), 2.2);
    const cut = 0.02 + 0.3 * env; lp += cut * (rnd() - lp); lp2 += cut * (lp - lp2);
    put(Math.floor(t0 * SR) + j, lp2 * env * amp * 5, dir * (p * 2 - 1)); } };
for (let i = 0; i < N; i++) { const t = i / SR, f = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 0.6);
  const v = (Math.sin(TAU * 55 * t) * 0.5 + Math.sin(TAU * 82.4 * t) * 0.25 + Math.sin(TAU * 110 * t + 1) * 0.1) * 0.06 * f * (0.8 + 0.2 * Math.sin(TAU * 0.3 * t));
  L[i] += v; R[i] += v; }
whoosh(0.0, 0.5, 0.5, 1); whoosh(7.2, 0.6, 0.55, -1);
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.8 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, "..", "public", "fit", "sfx.wav"), buf); console.log("ok");
