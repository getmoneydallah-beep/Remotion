import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, MONO } from "../capital/fonts";

// Generic workout Reel template: hook still → N exercise clips → app-promo end card.
// A new Reel = a new ReelConfig (see legs.ts) + its assets in /public.
const W = 1080, H = 1920;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const WHIP_IN = Easing.bezier(0.1, 0.9, 0.2, 1);
const WHIP_OUT = Easing.bezier(0.8, 0, 0.9, 0.2);

export type Brand = { bg: string; ink: string; silver: string; accent: string; green: string; appName: string; appTagline: string; icon: string; screenshot: string };
export type ExerciseShot = { clip: string; start: number; end: number; title: string; cue: string; muscleAr: string; muscleEn: string; dot: [number, number]; zoom?: number; origin?: string; labelUp?: boolean };
export type ReelConfig = {
  duration: number;
  brand: Brand;
  hook: { image: string; end: number; small: string; big: string; sub: string };
  exercises: ExerciseShot[];
  cta: { start: number; image: string; question: string; line: string; trial: string };
  vo: { src: string; at: number; len: number }[];
  music: { src: string; volume: number; duck: number };
  sfx?: string;
};

const Reveal: React.FC<{ t: number; at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, out = 999, children, style }) => {
  const p = ip(t, [at, at + 0.6], [0, 1], EXPO), q = ip(t, [out, out + 0.3], [0, 1]);
  if (p <= 0 || q >= 1) return null;
  return (
    <div style={{ overflow: "hidden", padding: "0.15em 0.1em", margin: "-0.15em -0.1em" }}>
      <div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, ...style }}>{children}</div>
    </div>
  );
};

const whip = (lt: number, len: number, first: boolean, last: boolean) => {
  const inP = first ? 1 : WHIP_IN(ip(lt, [0, 0.38], [0, 1]));
  const outP = last ? 0 : WHIP_OUT(ip(lt, [len - 0.3, len], [0, 1]));
  return { transform: `translateY(${(1 - inP) * 1100 - outP * 1500}px)`, filter: (1 - inP) * 30 + outP * 36 > 0.5 ? `blur(${(1 - inP) * 30 + outP * 36}px)` : undefined };
};

const Scrim: React.FC<{ bg: string }> = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,12,14,0.88) 0%, rgba(10,12,14,0) 24%, rgba(10,12,14,0) 70%, rgba(10,12,14,0.92) 100%)" }} />
);

const Hook: React.FC<{ c: ReelConfig; t: number }> = ({ c, t }) => {
  const b = c.brand, len = c.hook.end;
  const glow = 1 + 0.12 * Math.sin(t * 4.2);
  return (
    <AbsoluteFill style={whip(t, len, true, false)}>
      <AbsoluteFill style={{ transform: `translateY(260px) scale(${1.0 + ip(t, [0, len], [0, 0.08])})`, transformOrigin: "50% 60%" }}>
        <Img src={staticFile(c.hook.image)} style={{ width: W, height: H, objectFit: "cover", filter: `brightness(${glow}) saturate(${glow})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c.brand.bg} 0px, ${c.brand.bg} 300px, rgba(14,16,18,0) 600px)` }} />
      <Scrim bg={b.bg} />
      <div style={{ position: "absolute", top: 140, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
        <Reveal t={t} at={0.15} style={{ fontFamily: AR, fontSize: 48, color: b.silver }}>{c.hook.small}</Reveal>
        <Reveal t={t} at={0.3} style={{ fontFamily: AR, fontSize: 150, fontWeight: 600, color: b.ink, lineHeight: 1.3 }}>
          {c.hook.big}<span style={{ color: b.accent }}>؟</span>
        </Reveal>
        <div style={{ height: 6, width: 220 * ip(t, [0.8, 1.4], [0, 1], EXPO), background: b.accent, borderRadius: 3, margin: "6px 0 18px" }} />
        <Reveal t={t} at={1.3} style={{ fontFamily: AR, fontSize: 46, fontWeight: 500, color: b.ink }}>{c.hook.sub}</Reveal>
      </div>
    </AbsoluteFill>
  );
};

const Exercise: React.FC<{ c: ReelConfig; s: ExerciseShot; idx: number; t: number }> = ({ c, s, idx, t }) => {
  const b = c.brand, lt = t - s.start, len = s.end - s.start, n = c.exercises.length;
  const call = ip(lt, [1.3, 1.9], [0, 1], EXPO) * (1 - ip(lt, [len - 0.7, len - 0.4], [0, 1]));
  const rate = 5.0 / Math.max(len, 0.1);
  return (
    <AbsoluteFill style={whip(lt, len, false, false)}>
      <AbsoluteFill style={{ transform: `scale(${(s.zoom ?? 1) + ip(lt, [0, len], [0, 0.05])})`, transformOrigin: s.origin ?? "50% 50%" }}>
        <OffthreadVideo src={staticFile(s.clip)} playbackRate={Math.min(1, rate)} muted style={{ width: W, height: H, objectFit: "cover" }} />
      </AbsoluteFill>
      <Scrim bg={b.bg} />
      <div style={{ position: "absolute", top: 140, right: 84, left: 84, display: "flex", flexDirection: "column", alignItems: "flex-start", direction: "rtl" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {Array.from({ length: n }, (_, k) => (
            <div key={k} style={{ width: 64, height: 5, borderRadius: 3, background: "rgba(166,173,184,0.25)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(k < idx ? 1 : k === idx ? ip(lt, [0, len], [0, 1]) : 0) * 100}%`, background: b.accent }} />
            </div>
          ))}
        </div>
        <Reveal t={lt} at={0.2} style={{ fontFamily: MONO, fontSize: 28, color: b.silver, letterSpacing: 2 }}><bdi dir="ltr">0{idx + 1} / 0{n}</bdi></Reveal>
        <Reveal t={lt} at={0.28} style={{ fontFamily: AR, fontSize: 80, fontWeight: 600, color: b.ink, lineHeight: 1.35 }}>{s.title}</Reveal>
        <div style={{ height: 6, width: 200 * ip(lt, [0.5, 1.0], [0, 1], EXPO), background: b.accent, marginTop: 6, borderRadius: 3 }} />
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={s.dot[0]} cy={s.dot[1]} r={10 * call} fill={b.accent} />
        <circle cx={s.dot[0]} cy={s.dot[1]} r={24 * call} fill="none" stroke={b.accent} strokeWidth={2} opacity={0.6} />
        <polyline points={`${s.dot[0]},${s.dot[1]} ${s.dot[0] - 150 * call},${s.dot[1] + (s.labelUp ? -140 : 140) * call} ${60 + (s.dot[0] - 210) * (1 - call)},${s.dot[1] + (s.labelUp ? -140 : 140) * call}`} fill="none" stroke={b.ink} strokeWidth={2} opacity={0.85 * call} />
      </svg>
      <div style={{ position: "absolute", left: 48, top: s.dot[1] + (s.labelUp ? -250 : 128), padding: "10px 18px 12px", borderRadius: 14, background: "rgba(10,12,14,0.8)", border: `1px solid ${b.accent}55`, direction: "rtl", textAlign: "left", opacity: ip(lt, [1.7, 2.1], [0, 1]) * (1 - ip(lt, [len - 0.7, len - 0.4], [0, 1])) }}>
        <div style={{ fontFamily: AR, fontSize: 34, fontWeight: 600, color: b.ink }}>{s.muscleAr}</div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: b.silver, direction: "ltr", textAlign: "left" }}>{s.muscleEn}</div>
      </div>
      <div style={{ position: "absolute", bottom: 200, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
        <Reveal t={lt} at={2.0} out={len - 0.55} style={{ fontFamily: AR, fontSize: 54, fontWeight: 500, color: b.ink }}>{s.cue}</Reveal>
      </div>
    </AbsoluteFill>
  );
};

const AppCTA: React.FC<{ c: ReelConfig; t: number }> = ({ c, t }) => {
  const b = c.brand, lt = t - c.cta.start;
  const inP = WHIP_IN(ip(lt, [0, 0.4], [0, 1]));
  const phone = ip(lt, [0.9, 1.7], [0, 1], EXPO);
  const icon = ip(lt, [0.3, 1.0], [0, 1], EXPO);
  const pill = ip(lt, [2.4, 3.0], [0, 1], EXPO);
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - inP) * 1100}px)`, filter: inP < 0.98 ? `blur(${(1 - inP) * 30}px)` : undefined, backgroundColor: b.bg }}>
      <Img src={staticFile(c.cta.image)} style={{ position: "absolute", width: W, height: H, objectFit: "cover", opacity: 0.32, filter: "blur(6px)", transform: `scale(${1.1 + lt * 0.01})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 35%, ${b.green}66 0%, transparent 70%), linear-gradient(180deg, rgba(10,12,14,0.6), rgba(10,12,14,0.9))` }} />
      <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
        <Reveal t={lt} at={0.25} style={{ fontFamily: AR, fontSize: 46, color: b.silver }}>{c.cta.question}</Reveal>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 18, opacity: icon, transform: `scale(${0.85 + 0.15 * icon})` }}>
          <Img src={staticFile(b.icon)} style={{ width: 132, height: 132, borderRadius: 30, boxShadow: `0 10px 40px ${b.green}88` }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: AR, fontSize: 74, fontWeight: 600, color: b.ink, lineHeight: 1.1 }}>{b.appName}</div>
            <div style={{ fontFamily: AR, fontSize: 34, color: b.accent, marginTop: 6 }}>{b.appTagline}</div>
          </div>
        </div>
      </div>
      {/* phone with the real app screen */}
      <div style={{ position: "absolute", left: W / 2 - 230, top: 610 + (1 - phone) * 120, width: 460, height: 960, borderRadius: 64, background: "#0B0C0E", padding: 16, boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 0 2px #2A2D33, 0 0 80px ${b.accent}22`, opacity: phone }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 50, overflow: "hidden", position: "relative" }}>
          <Img src={staticFile(b.screenshot)} style={{ width: "100%", height: "118%", objectFit: "cover", objectPosition: "top", transform: `translateY(${-ip(lt, [1.8, 6.5], [0, 15], Easing.inOut(Easing.cubic))}%)` }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 120, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", gap: 18 }}>
        <Reveal t={lt} at={1.9} style={{ fontFamily: AR, fontSize: 50, fontWeight: 600, color: b.ink }}>{c.cta.line}</Reveal>
        <div style={{ opacity: pill, transform: `scale(${0.9 + 0.1 * pill})`, display: "flex", alignItems: "center", gap: 16, padding: "16px 40px", borderRadius: 60, background: b.accent, color: "#14140F", fontFamily: AR, fontWeight: 600, fontSize: 40 }}>
          {c.cta.trial}
        </div>
        <div style={{ opacity: pill, fontFamily: AR, fontSize: 32, color: b.silver, direction: "rtl" }}>
          حمّله الحين من <span style={{ fontFamily: MONO, color: b.ink, direction: "ltr", unicodeBidi: "isolate" }}>App Store</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WorkoutReel: React.FC<{ config: ReelConfig }> = ({ config: c }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const voActive = (tt: number) => c.vo.some((v) => tt > v.at - 0.15 && tt < v.at + v.len + 0.1);
  return (
    <AbsoluteFill style={{ backgroundColor: c.brand.bg }}>
      <Audio src={staticFile(c.music.src)} volume={(fr) => { const tt = fr / fps; return (voActive(tt) ? c.music.duck : c.music.volume) * ip(tt, [0, 0.6], [0, 1]) * ip(tt, [c.duration - 1.5, c.duration], [1, 0]); }} />
      {c.sfx && <Audio src={staticFile(c.sfx)} volume={0.55} />}
      {c.vo.map((v, i) => (
        <Sequence key={i} from={Math.round(v.at * fps)}><Audio src={staticFile(v.src)} /></Sequence>
      ))}
      <Sequence durationInFrames={Math.round((c.hook.end + 0.4) * fps)}><Hook c={c} t={t} /></Sequence>
      {c.exercises.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.end - s.start + 0.4) * fps)}>
          <Exercise c={c} s={s} idx={i} t={t} />
        </Sequence>
      ))}
      <Sequence from={Math.round(c.cta.start * fps)}><AppCTA c={c} t={t} /></Sequence>
    </AbsoluteFill>
  );
};
