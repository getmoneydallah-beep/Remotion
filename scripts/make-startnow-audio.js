// Synthesized SFX layer for the «ابدأ الآن» Reel (music = public/startnow/music.mp3, VO = public/startnow/vo/*).
// Reads scene timing, VO marks and cues from src/startnow/timeline.json → public/startnow/sfx.wav
const fs = require("fs"), path = require("path");
const TL = require("../src/startnow/timeline.json");
const SR = 48000, TAU = Math.PI * 2;
let acc = 0; for (const sc of TL.scenes) { sc.start = acc; acc += sc.dur; }
const DUR = acc / TL.fps + 0.2;
const N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const FX = new Float32Array(N); // sfx bus (gets a little reverb)
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const sc = (id) => TL.scenes.find((x) => x.id === id);
const mk = (id, key, o = 0) => Math.round(sc(id).voAt + sc(id).marks[key] * TL.fps) + o;
const at = (s, f) => (sc(s).start + f) / TL.fps;
const T = (id) => TL.scenes.find((x) => x.id === id).start / TL.fps;
const put = (buf, t, v) => { const i = Math.floor(t * SR); if (i >= 0 && i < N) buf[i] += v; };

const kick = (t0, amp = 1) => { for (let j = 0; j < SR * 0.45; j++) { const tt = j / SR; const f = 45 + 90 * Math.exp(-tt * 28); const e = Math.exp(-tt * 9);
  const v = Math.sin(TAU * f * tt) * e * 0.55 * amp; put(L, t0 + tt, v); put(R, t0 + tt, v); } };

// ---------- sfx ----------
const sfx = {
  pop: (t0) => { for (let j = 0; j < SR * 0.09; j++) { const tt = j / SR; const f = 1500 - 700 * (tt / 0.09); put(FX, t0 + tt, Math.sin(TAU * f * tt) * Math.exp(-tt * 45) * 0.32); } },
  tick: (t0, pitch = 1) => { for (let j = 0; j < SR * 0.04; j++) { const tt = j / SR; put(FX, t0 + tt, Math.sin(TAU * 2400 * pitch * tt) * Math.exp(-tt * 110) * 0.25); } },
  click: (t0) => { kick(t0, 0.6); for (let j = 0; j < SR * 0.02; j++) put(FX, t0 + j / SR, rnd() * Math.exp(-j / SR * 300) * 0.5); },
  cross: (t0) => { let lp = 0; for (let j = 0; j < SR * 0.16; j++) { const tt = j / SR; lp += 0.35 * (rnd() - lp); put(FX, t0 + tt, lp * Math.sin(Math.PI * tt / 0.16) * 0.55); } },
  thud: (t0) => { for (let j = 0; j < SR * 0.4; j++) { const tt = j / SR; put(FX, t0 + tt, Math.sin(TAU * (70 + 40 * Math.exp(-tt * 20)) * tt) * Math.exp(-tt * 10) * 0.5); } },
  step: (t0, pitch = 1) => { for (let j = 0; j < SR * 0.12; j++) { const tt = j / SR; put(FX, t0 + tt, (Math.sin(TAU * 660 * pitch * tt) * 0.6 + Math.sin(TAU * 1320 * pitch * tt) * 0.2) * Math.exp(-tt * 30) * 0.3); } },
  whoosh: (t0) => { let lp = 0, lp2 = 0; const len = 0.55; for (let j = 0; j < SR * len; j++) { const p = j / (SR * len), env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.6)), 2);
    const cut = 0.02 + 0.25 * env; lp += cut * (rnd() - lp); lp2 += cut * (lp - lp2); put(FX, t0 - len * 0.6 + j / SR, lp2 * env * 1.6); } },
  rise: (t0) => { let lp = 0; const len = 0.9; for (let j = 0; j < SR * len; j++) { const p = j / (SR * len); lp += (0.01 + 0.2 * p) * (rnd() - lp); put(FX, t0 + j / SR, lp * p * p * 0.7); } },
  shine: (t0) => { for (const [fr, a] of [[1760, 0.12], [2637, 0.09], [3520, 0.06], [2217, 0.07]]) for (let j = 0; j < SR * 1.6; j++) { const tt = j / SR;
    put(FX, t0 + tt, Math.sin(TAU * fr * tt) * Math.exp(-tt * 3) * Math.min(1, tt * 60) * a); } },
  hit: (t0) => {
    for (let j = 0; j < SR * 1.6; j++) { const tt = j / SR; const v = Math.sin(TAU * (38 + 70 * Math.exp(-tt * 14)) * tt) * Math.exp(-tt * 2.6) * 0.75; put(L, t0 + tt, v); put(R, t0 + tt, v); }
    let lp = 0; for (let j = 0; j < SR * 0.5; j++) { const tt = j / SR; lp += 0.3 * (rnd() - lp); put(FX, t0 + tt, lp * Math.exp(-tt * 9) * 0.8); }
  },
};
for (const c of TL.cues) sfx[c.k](at(c.s, c.m ? mk(c.s, c.m, c.o || 0) : c.f));
// fail-counter steps (matches FailStairs stepAt(i)+4) and outro climb hops
for (let i = 0; i < 8; i++) { sfx.cross(at("failStairs", 8 + i * 9 + 4)); sfx.tick(at("failStairs", 8 + i * 9 + 4), 0.8 + i * 0.06); }
for (let i = 0; i < 7; i++) sfx.step(at("outro", 6 + i * 8 + 8), 1 + i * 0.09);

// simple reverb on the sfx bus (three combs)
const out = Float32Array.from(FX);
for (const [dl, g] of [[0.031, 0.5], [0.047, 0.45], [0.073, 0.4]]) { const d = Math.round(dl * SR); const buf = Float32Array.from(FX);
  for (let i = d; i < N; i++) buf[i] += buf[i - d] * g; for (let i = 0; i < N; i++) out[i] += (buf[i] - FX[i]) * 0.25; }
for (let i = 0; i < N; i++) { L[i] += out[i]; R[i] += out[i]; }

// normalize + soft clip, write 16-bit stereo WAV
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.8 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
const softClip = (x) => Math.tanh(x * 1.2) / Math.tanh(1.2);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(softClip(L[i] * g) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(softClip(R[i] * g) * 32767), 46 + i * 4); }
const dir = path.join(__dirname, "..", "public", "startnow"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "sfx.wav"), buf); console.log("ok", DUR.toFixed(1) + "s");
