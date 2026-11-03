import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, MONO } from "../capital/fonts";

// Five-exercise back Reel. Clips: Nano Banana keyframes → Kling (Higgsfield). VO: Gemini TTS. Music: Lyria.
const W = 1080, H = 1920;
const BG = "#101216", INK = "#F3F0E9", SILVER = "#A6ADB8", COBALT = "#5278F7";
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const WHIP_IN = Easing.bezier(0.1, 0.9, 0.2, 1);
const WHIP_OUT = Easing.bezier(0.8, 0, 0.9, 0.2);

type Exercise = {
  clip: string; start: number; end: number; rate: number;
  title?: string; cue?: string; muscleAr?: string; muscleEn?: string;
  dot?: [number, number]; // callout anchor on the muscle (px, 1080×1920)
  kind: "hook" | "exercise" | "cta";
};

export const DURATION = 37;
export const SHOTS: Exercise[] = [
  { kind: "hook", clip: "fit/c_hook.mp4", start: 0, end: 4.0, rate: 1 },
  { kind: "exercise", clip: "fit/c_wide.mp4", start: 4.0, end: 10.2, rate: 0.82, title: "السحب العالي الواسع", cue: "اسحب البار لأعلى صدرك", muscleAr: "العضلة الظهرية العريضة", muscleEn: "LATISSIMUS DORSI", dot: [430, 1000] },
  { kind: "exercise", clip: "fit/c_close.mp4", start: 10.2, end: 16.0, rate: 0.87, title: "السحب بقبضة ضيقة", cue: "أكواعك قريبة من جسمك", muscleAr: "أسفل الظهرية العريضة", muscleEn: "LOWER LATS", dot: [470, 1020] },
  { kind: "exercise", clip: "fit/c_straight.mp4", start: 16.0, end: 22.0, rate: 0.84, title: "السحب بذراع مستقيمة", cue: "يدينك مفرودة لين فخوذك", muscleAr: "العضلة الظهرية العريضة", muscleEn: "LATS", dot: [450, 880] },
  { kind: "exercise", clip: "fit/c_face.mp4", start: 22.0, end: 27.0, rate: 1, title: "سحب الوجه", cue: "اسحب لوجهك وافتح أكواعك", muscleAr: "الكتف الخلفي وأعلى الظهر", muscleEn: "REAR DELTS · TRAPS", dot: [380, 760] },
  { kind: "exercise", clip: "fit/c_onearm.mp4", start: 27.0, end: 32.4, rate: 0.93, title: "التجديف بيد وحدة", cue: "اسحب لخصرك وجسمك ثابت", muscleAr: "الظهرية العريضة ومنتصف الظهر", muscleEn: "LATS · MID-BACK", dot: [410, 915] },
  { kind: "cta", clip: "fit/c_cta.mp4", start: 32.4, end: 37.0, rate: 1 },
];
const VO_STARTS = SHOTS.map((s, i) => s.start + (i === 0 ? 0.25 : 0.3));
const VO_LENS = [3.79, 5.41, 4.49, 4.95, 3.38, 3.73, 3.04];

const Reveal: React.FC<{ t: number; at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, out = 999, children, style }) => {
  const p = ip(t, [at, at + 0.6], [0, 1], EXPO);
  const q = ip(t, [out, out + 0.3], [0, 1]);
  if (p <= 0) return null;
  return (
    <div style={{ overflow: "hidden", padding: "0.15em 0.1em", margin: "-0.15em -0.1em" }}>
      <div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, ...style }}>{children}</div>
    </div>
  );
};

const Progress: React.FC<{ idx: number; t: number; s: Exercise }> = ({ idx, t, s }) => (
  <div style={{ display: "flex", gap: 10, direction: "rtl", marginBottom: 18 }}>
    {[1, 2, 3, 4, 5].map((n) => {
      const fill = n < idx ? 1 : n === idx ? ip(t, [s.start, s.end], [0, 1]) : 0;
      return (
        <div key={n} style={{ width: 64, height: 5, borderRadius: 3, background: "rgba(166,173,184,0.25)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: n <= idx ? COBALT : "transparent" }} />
        </div>
      );
    })}
  </div>
);

const Shot: React.FC<{ s: Exercise; idx: number; t: number; fps: number }> = ({ s, idx, t, fps }) => {
  const lt = t - s.start;
  const len = s.end - s.start;
  const inP = s.start === 0 ? 1 : WHIP_IN(ip(lt, [0, 0.38], [0, 1]));
  const outP = s.kind === "cta" ? 0 : WHIP_OUT(ip(lt, [len - 0.3, len], [0, 1]));
  const y = (1 - inP) * 1100 - outP * 1500;
  const blur = (1 - inP) * 30 + outP * 36;
  const push = 1 + ip(lt, [0, len], [0, s.kind === "exercise" ? 0.05 : 0.02]);
  const calloutIn = ip(lt, [1.3, 1.9], [0, 1], EXPO) * (1 - ip(lt, [len - 0.7, len - 0.4], [0, 1]));
  const hookIn = s.kind === "hook" ? 1 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `translateY(${s.kind === "exercise" ? 0 : s.kind === "cta" ? 380 : 300}px) scale(${push})`, transformOrigin: "50% 45%" }}>
        <Sequence from={-Math.round(0) } layout="none">
          <OffthreadVideo src={staticFile(s.clip)} playbackRate={s.rate} muted startFrom={0} style={{ width: W, height: H, objectFit: "cover" }} />
        </Sequence>
      </AbsoluteFill>
      {s.kind !== "exercise" && (
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${BG} 0px, ${BG} ${(s.kind === "cta" ? 380 : 300) + 30}px, rgba(16,18,22,0) ${(s.kind === "cta" ? 380 : 300) + 320}px)` }} />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(16,18,22,0.88) 0%, rgba(16,18,22,0) 24%, rgba(16,18,22,0) 70%, rgba(16,18,22,0.92) 100%)" }} />

      {s.kind === "exercise" && (
        <>
          <div style={{ position: "absolute", top: 140, right: 84, left: 84, display: "flex", flexDirection: "column", alignItems: "flex-start", direction: "rtl" }}>
            <Progress idx={idx} t={t} s={s} />
            <Reveal t={lt} at={0.2} style={{ fontFamily: MONO, fontSize: 28, color: SILVER, letterSpacing: 2 }}>
              <bdi dir="ltr">0{idx} / 05</bdi>
            </Reveal>
            <Reveal t={lt} at={0.28} style={{ fontFamily: AR, fontSize: 80, fontWeight: 600, color: INK, lineHeight: 1.35 }}>
              {s.title}
            </Reveal>
            <div style={{ height: 6, width: 200 * ip(lt, [0.5, 1.0], [0, 1], EXPO), background: COBALT, marginTop: 6, borderRadius: 3 }} />
          </div>
          {s.dot && (
            <>
              <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
                <circle cx={s.dot[0]} cy={s.dot[1]} r={10 * calloutIn} fill={COBALT} />
                <circle cx={s.dot[0]} cy={s.dot[1]} r={24 * calloutIn} fill="none" stroke={COBALT} strokeWidth={2} opacity={0.6} />
                <polyline
                  points={`${s.dot[0]},${s.dot[1]} ${s.dot[0] - 170 * calloutIn},${s.dot[1] + 150 * calloutIn} ${60 + (s.dot[0] - 230) * (1 - calloutIn)},${s.dot[1] + 150 * calloutIn}`}
                  fill="none" stroke={INK} strokeWidth={2} opacity={0.85 * calloutIn}
                />
              </svg>
              <div style={{ position: "absolute", left: 48, top: s.dot[1] + 150, padding: "10px 18px 12px", borderRadius: 14, background: "rgba(16,18,22,0.78)", border: "1px solid rgba(82,120,247,0.35)", direction: "rtl", textAlign: "left", opacity: ip(lt, [1.7, 2.1], [0, 1]) * (1 - ip(lt, [len - 0.7, len - 0.4], [0, 1])) }}>
                <div style={{ fontFamily: AR, fontSize: 34, fontWeight: 600, color: INK }}>{s.muscleAr}</div>
                <div style={{ fontFamily: MONO, fontSize: 24, color: SILVER, direction: "ltr", textAlign: "left" }}>{s.muscleEn}</div>
              </div>
            </>
          )}
          <div style={{ position: "absolute", bottom: 200, width: "100%", display: "flex", justifyContent: "center", direction: "rtl" }}>
            <Reveal t={lt} at={2.0} out={len - 0.55} style={{ fontFamily: AR, fontSize: 56, fontWeight: 500, color: INK }}>
              {s.cue}
            </Reveal>
          </div>
        </>
      )}

      {s.kind === "hook" && (
        <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", opacity: hookIn }}>
          <Reveal t={lt} at={0.15} style={{ fontFamily: AR, fontSize: 46, fontWeight: 400, color: SILVER }}>تبي ظهر</Reveal>
          <Reveal t={lt} at={0.3} style={{ fontFamily: AR, fontSize: 150, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
            أعرض<span style={{ color: COBALT }}>؟</span>
          </Reveal>
          <div style={{ height: 6, width: 220 * ip(lt, [0.8, 1.4], [0, 1], EXPO), background: COBALT, borderRadius: 3, margin: "6px 0 18px" }} />
          <Reveal t={lt} at={1.4} style={{ fontFamily: AR, fontSize: 46, fontWeight: 500, color: INK }}>
            <bdi dir="rtl">٥ تمارين كيبل</bdi>
          </Reveal>
        </div>
      )}

      {s.kind === "cta" && (
        <div style={{ position: "absolute", top: 110, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
          <Reveal t={lt} at={0.45} style={{ fontFamily: AR, fontSize: 48, fontWeight: 400, color: SILVER }}>تبي الخطة كاملة؟</Reveal>
          <Reveal t={lt} at={0.7} style={{ fontFamily: AR, fontSize: 64, fontWeight: 500, color: INK, marginTop: 10 }}>اكتب</Reveal>
          <Reveal t={lt} at={0.85} style={{ fontFamily: AR, fontSize: 150, fontWeight: 600, color: COBALT, lineHeight: 1.25 }}>«خطة»</Reveal>
          <Reveal t={lt} at={1.1} style={{ fontFamily: AR, fontSize: 52, fontWeight: 500, color: INK }}>بالتعليقات</Reveal>
        </div>
      )}
    </AbsoluteFill>
  );
};

const voActive = (t: number) => VO_STARTS.some((s, i) => t > s - 0.15 && t < s + VO_LENS[i] + 0.1);

export const BackReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Audio
        src={staticFile("fit/music_cut.mp3")}
        volume={(fr) => {
          const tt = fr / fps;
          return (voActive(tt) ? 0.2 : 0.36) * ip(tt, [0, 0.6], [0, 1]) * ip(tt, [DURATION - 1.4, DURATION], [1, 0]);
        }}
      />
      <Audio src={staticFile("fit/reel_sfx.wav")} volume={0.55} />
      {VO_STARTS.map((s, i) => (
        <Sequence key={i} from={Math.round(s * fps)}>
          <Audio src={staticFile(`fit/vo_${i}.wav`)} />
        </Sequence>
      ))}
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.end - s.start + (i < SHOTS.length - 1 ? 0.4 : 0)) * fps)}>
          <Shot s={s} idx={i} t={t} fps={fps} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
