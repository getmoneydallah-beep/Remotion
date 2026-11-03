import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, MONO } from "../capital/fonts";

// Pilot shot for an original fitness series: AI-generated exercise clip (Nano Banana keyframe → Kling)
// wrapped in a branded Remotion layer: title, muscle callout, Saudi-Arabic cue VO, captions, whip-pans.
const W = 1080, H = 1920;
const BG = "#101216", INK = "#F3F0E9", SILVER = "#A6ADB8", COBALT = "#5278F7";
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], e?: (n: number) => number) => interpolate(t, i, o, { ...CL, easing: e });
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const WHIP_IN = Easing.bezier(0.1, 0.9, 0.2, 1);
const WHIP_OUT = Easing.bezier(0.8, 0, 0.9, 0.2);

const Reveal: React.FC<{ t: number; at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, out = 99, children, style }) => {
  const p = ip(t, [at, at + 0.7], [0, 1], EXPO);
  const q = ip(t, [out, out + 0.35], [0, 1]);
  return (
    <div style={{ overflow: "hidden", padding: "0.15em 0.1em", margin: "-0.15em -0.1em" }}>
      <div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, ...style }}>{children}</div>
    </div>
  );
};

export const FitPilot: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  // whip-pan in / out (vertical, with directional motion blur)
  const inP = WHIP_IN(ip(t, [0, 0.45], [0, 1]));
  const outP = WHIP_OUT(ip(t, [7.15, 7.6], [0, 1]));
  const y = (1 - inP) * 900 - outP * 1500;
  const blur = (1 - inP) * 28 + outP * 34;
  const push = 1.0 + ip(t, [0, 7.4], [0, 0.07]);

  const lineIn = ip(t, [1.9, 2.6], [0, 1], EXPO) * (1 - ip(t, [6.6, 7.0], [0, 1]));
  const capA = t > 2.6 && t < 4.75;
  const capB = t >= 4.75 && t < 7.0;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, direction: "rtl" }}>
      <Audio src={staticFile("fit/sfx.wav")} volume={0.7} />
      <Sequence from={Math.round(0.5 * fps)}>
        <Audio src={staticFile("fit/vo_cue.wav")} />
      </Sequence>

      {t < 7.7 && (
        <AbsoluteFill style={{ transform: `translateY(${y}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
          <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
            <OffthreadVideo src={staticFile("fit/kling_a.mp4")} playbackRate={0.72} muted style={{ width: W, height: H, objectFit: "cover" }} />
          </AbsoluteFill>
          {/* top & bottom falloff for type */}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(16,18,22,0.85) 0%, rgba(16,18,22,0) 22%, rgba(16,18,22,0) 72%, rgba(16,18,22,0.9) 100%)" }} />

          {/* title */}
          <div style={{ position: "absolute", top: 150, right: 84, left: 84, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Reveal t={t} at={0.35} style={{ fontFamily: MONO, fontSize: 28, color: SILVER, letterSpacing: 2 }}>
              <bdi dir="ltr">01 / 05</bdi>
            </Reveal>
            <Reveal t={t} at={0.45} style={{ fontFamily: AR, fontSize: 82, fontWeight: 600, color: INK, lineHeight: 1.35 }}>
              السحب العالي الواسع
            </Reveal>
            <div style={{ height: 6, width: 220 * ip(t, [0.75, 1.3], [0, 1], EXPO), background: COBALT, marginTop: 6, borderRadius: 3 }} />
          </div>

          {/* muscle callout with leader line */}
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <circle cx={430} cy={1000} r={10 * lineIn} fill={COBALT} />
            <circle cx={430} cy={1000} r={22 * lineIn} fill="none" stroke={COBALT} strokeWidth={2} opacity={0.6} />
            <polyline points={`430,1000 ${430 - 200 * lineIn},${1000 + 160 * lineIn} ${430 - 200 * lineIn - 120 * ip(t, [2.2, 2.7], [0, 1], EXPO)},${1000 + 160 * lineIn}`} fill="none" stroke={INK} strokeWidth={2} opacity={0.85 * lineIn} />
          </svg>
          <div style={{ position: "absolute", left: 60, top: 1175, width: 360, direction: "rtl", textAlign: "left", opacity: ip(t, [2.5, 2.9], [0, 1]) * (1 - ip(t, [6.6, 7.0], [0, 1])) }}>
            <div style={{ fontFamily: AR, fontSize: 34, fontWeight: 600, color: INK }}>العضلة الظهرية العريضة</div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: SILVER, direction: "ltr", textAlign: "left" }}>LATISSIMUS DORSI</div>
          </div>

          {/* cue captions synced to VO */}
          <div style={{ position: "absolute", bottom: 210, width: "100%", display: "flex", justifyContent: "center" }}>
            {capA && (
              <Reveal t={t} at={2.6} out={4.45} style={{ fontFamily: AR, fontSize: 54, fontWeight: 500, color: INK }}>
                اسحب البار لأعلى صدرك
              </Reveal>
            )}
            {capB && (
              <Reveal t={t} at={4.75} out={6.7} style={{ fontFamily: AR, fontSize: 54, fontWeight: 500, color: INK }}>
                خلّ أكواعك تنزل <span style={{ color: COBALT }}>لتحت ووَرا</span>
              </Reveal>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* next-up slate, whipped in from below */}
      {t > 7.3 && (
        <AbsoluteFill style={{ transform: `translateY(${(1 - WHIP_IN(ip(t, [7.35, 7.8], [0, 1]))) * 1500}px)`, justifyContent: "center", alignItems: "center", direction: "rtl" }}>
          <div style={{ fontFamily: AR, fontSize: 34, color: SILVER }}>التمرين التالي</div>
          <div style={{ fontFamily: AR, fontSize: 76, fontWeight: 600, color: INK, marginTop: 8 }}>التجديف بالكيبل</div>
          <div style={{ height: 6, width: 200, background: COBALT, marginTop: 18, borderRadius: 3 }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
