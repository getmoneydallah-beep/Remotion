// Whooshes on every whip-pan cut for the back Reel (original, synthesized)
const fs = require("fs"), path = require("path");
const CUTS = JSON.parse(process.argv[2]); const DUR = parseFloat(process.argv[3]);
const SR = 48000, N = Math.round(SR * DUR); const L = new Float32Array(N), R = new Float32Array(N);
let seed = 5; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const put = (i, v, pan) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan * 0.7); R[i] += v * (1 + pan * 0.7); } };
const whoosh = (t0, len, amp, dir) => { let a = 0, b = 0;
  for (let j = 0; j < SR * len; j++) { const p = j / (SR * len), env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.65)), 2.4), c = 0.02 + 0.32 * env;
    a += c * (rnd() - a); b += c * (a - b); put(Math.floor(t0 * SR) + j, b * env * amp * 5, dir * (p * 2 - 1)); } };
const thump = (t0, amp) => { let ph = 0; for (let j = 0; j < SR * 0.4; j++) { const lt = j / SR, f = 48 + 40 * Math.exp(-lt * 20); ph += 2 * Math.PI * f / SR;
  put(Math.floor(t0 * SR) + j, Math.sin(ph) * Math.exp(-lt * 9) * amp, 0); } };
CUTS.forEach((c, i) => { whoosh(c - 0.28, 0.55, 0.5, i % 2 ? 1 : -1); thump(c + 0.02, 0.35); });
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.8 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, "..", "public", "fit", "reel_sfx.wav"), buf); console.log("ok");
