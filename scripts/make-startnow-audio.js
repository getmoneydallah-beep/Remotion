// Original synthesized score + SFX for the «ابدأ الآن» Reel.
// Reads scene timing and cues from src/startnow/timeline.json → public/startnow/score.wav
const fs = require("fs"), path = require("path");
const TL = require("../src/startnow/timeline.json");
const SR = 48000, TAU = Math.PI * 2;
const last = TL.scenes[TL.scenes.length - 1];
const DUR = (last.start + last.dur) / TL.fps + 0.2;
const N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const FX = new Float32Array(N); // sfx bus (gets a little reverb)
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const at = (s, f) => (TL.scenes.find((x) => x.id === s).start + f) / TL.fps;
const T = (id) => TL.scenes.find((x) => x.id === id).start / TL.fps;
const put = (buf, t, v) => { const i = Math.floor(t * SR); if (i >= 0 && i < N) buf[i] += v; };

// ---------- music bed ----------
// Am – F – C – G, slow, dark; drum pulse in the "push" sections.
const chords = [[110, 130.81, 164.81], [87.31, 130.81, 174.61], [98, 130.81, 164.81], [98, 123.47, 146.83]];
const BAR = 60 / 84 * 4; // 84 bpm
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const c = chords[Math.floor(t / BAR) % 4];
  const fadeIn = Math.min(1, t / 2.5), fadeOut = Math.min(1, (DUR - t) / 3);
  // pad dips under the two "reflective" moments
  const duck = 1 - 0.55 * bump(t, T("failing"), T("failing") + 1.3, T("failStairs") - 0.4, T("failStairs"))
    - 0.6 * bump(t, T("notTrying") + 1.4, T("notTrying") + 1.7, T("outro") - 0.2, T("outro") + 0.3);
  let v = 0;
  for (const fr of c) {
    v += Math.sin(TAU * fr * t) * 0.32 + Math.sin(TAU * fr * 1.004 * t + 1.3) * 0.22 + Math.sin(TAU * fr * 2.001 * t) * 0.06;
  }
  v += Math.sin(TAU * c[0] / 2 * t) * 0.35; // sub root
  const lfo = 0.75 + 0.25 * Math.sin(TAU * 0.11 * t);
  v *= 0.05 * lfo * fadeIn * fadeOut * duck;
  L[i] += v; R[i] += v * 0.96;
}
function bump(t, a, b, c, d) { if (t < a || t > d) return 0; if (t < b) return (t - a) / (b - a); if (t < c) return 1; return (d - t) / (d - c); }

// drums
const beat = 60 / 84;
const kick = (t0, amp = 1) => { for (let j = 0; j < SR * 0.45; j++) { const tt = j / SR; const f = 45 + 90 * Math.exp(-tt * 28); const e = Math.exp(-tt * 9);
  const v = Math.sin(TAU * f * tt) * e * 0.55 * amp; put(L, t0 + tt, v); put(R, t0 + tt, v); } };
const hat = (t0, amp = 1) => { let hp = 0, prev = 0; for (let j = 0; j < SR * 0.06; j++) { const n = rnd(); hp = 0.85 * (hp + n - prev); prev = n;
  const v = hp * Math.exp(-j / SR * 70) * 0.05 * amp; put(L, t0 + j / SR, v); put(R, t0 + j / SR, v * 0.8); } };
const drumSection = (a, b, dense) => { for (let t = a; t < b - 0.05; t += beat) { kick(t, 0.9); hat(t + beat / 2, 1); if (dense) { hat(t + beat / 4, 0.5); hat(t + 3 * beat / 4, 0.5); } } };
drumSection(T("loop"), T("failing"), false);
drumSection(T("bars") + 5.2, T("failing") - 0.1, true);
drumSection(T("failStairs"), T("notTrying") + 1.6, true);

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
for (const c of TL.cues) sfx[c.k](at(c.s, c.f));
// fail-counter steps (matches FailStairs stepAt(i)+4) and outro climb hops
for (let i = 0; i < 8; i++) { sfx.cross(at("failStairs", 8 + i * 10 + 4)); sfx.tick(at("failStairs", 8 + i * 10 + 4), 0.8 + i * 0.06); }
for (let i = 0; i < 7; i++) sfx.step(at("outro", 6 + i * 8 + 8), 1 + i * 0.09);

// simple reverb on the sfx bus (three combs)
const out = Float32Array.from(FX);
for (const [dl, g] of [[0.031, 0.5], [0.047, 0.45], [0.073, 0.4]]) { const d = Math.round(dl * SR); const buf = Float32Array.from(FX);
  for (let i = d; i < N; i++) buf[i] += buf[i - d] * g; for (let i = 0; i < N; i++) out[i] += (buf[i] - FX[i]) * 0.25; }
for (let i = 0; i < N; i++) { L[i] += out[i]; R[i] += out[i]; }

// normalize + soft clip, write 16-bit stereo WAV
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.92 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
const sc = (x) => Math.tanh(x * 1.2) / Math.tanh(1.2);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(sc(L[i] * g) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(sc(R[i] * g) * 32767), 46 + i * 4); }
const dir = path.join(__dirname, "..", "public", "startnow"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "score.wav"), buf); console.log("ok", DUR.toFixed(1) + "s");
