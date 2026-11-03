import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT } from "./fonts";

// ---------- design tokens ----------
const BG = "#080A0F";
const GOLD = "#D4AF37";
const W = 1080;
const H = 1920;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (t: number, i: number[], o: number[], easing?: (n: number) => number) =>
  interpolate(t, i, o, { ...CL, easing });
const outCubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);

// Time in seconds, independent of fps (draft 24fps / final 30fps share code)
const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};
const useSpring = (t: number, start: number, damping = 16, mass = 0.9) => {
  const { fps } = useVideoConfig();
  return spring({ frame: Math.max(0, (t - start) * fps), fps, config: { damping, mass, stiffness: 110 } });
};

const goldFill = (sheen = -100): React.CSSProperties => ({
  backgroundImage: `linear-gradient(105deg, transparent ${sheen - 12}%, rgba(255,250,225,0.95) ${sheen}%, transparent ${sheen + 12}%), linear-gradient(180deg, #FFF3C4 0%, #F2D57A 28%, ${GOLD} 55%, #9A7520 82%, #E6C766 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  filter: "drop-shadow(0 0 28px rgba(212,175,55,0.35)) drop-shadow(0 4px 2px rgba(0,0,0,0.6))",
});

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// ---------- background layers ----------
const Background: React.FC = () => {
  const t = useT();
  const gx = 50 + 18 * Math.sin(t * 0.25);
  const gy = 30 + 10 * Math.cos(t * 0.2);
  const endGlow = ip(t, [26.6, 27.4], [0, 1], outCubic);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 45% at ${gx}% ${gy}%, rgba(212,175,55,${0.13 + endGlow * 0.12}) 0%, rgba(212,175,55,0.03) 45%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 40% at ${100 - gx}% 85%, rgba(120,90,30,0.12) 0%, transparent 70%)`,
        }}
      />
      {/* diagonal light beam */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(115deg, transparent ${30 + ((t * 4) % 60)}%, rgba(212,175,55,0.05) ${38 + ((t * 4) % 60)}%, transparent ${46 + ((t * 4) % 60)}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Particles: React.FC = () => {
  const t = useT();
  const boost = 1 + ip(t, [26.6, 27.5], [0, 1.2], outCubic);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(70).fill(0).map((_, i) => {
        const x = random(`x${i}`) * W;
        const speed = 15 + random(`s${i}`) * 55;
        const size = 2 + random(`z${i}`) * 5;
        const y = (((random(`y${i}`) * (H + 200) - t * speed * boost) % (H + 200)) + H + 200) % (H + 200) - 100;
        const drift = Math.sin(t * 0.6 + i) * 18;
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.6 + random(`t${i}`)) + i));
        const near = random(`n${i}`) > 0.85;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + drift,
              top: y,
              width: near ? size * 2.2 : size,
              height: near ? size * 2.2 : size,
              borderRadius: "50%",
              background: near ? "rgba(240,210,120,0.5)" : "#F0D27A",
              opacity: tw * (near ? 0.35 : 0.55) * Math.min(boost, 1.6),
              filter: near ? "blur(3px)" : undefined,
              boxShadow: `0 0 ${size * 3}px rgba(212,175,55,0.8)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)",
      pointerEvents: "none",
    }}
  />
);

// ---------- scene wrapper with cinematic in/out ----------
const Scene: React.FC<{
  start: number;
  end: number;
  fadeIn?: number;
  fadeOut?: number;
  push?: number;
  exitZoom?: number;
  children: (lt: number) => React.ReactNode;
}> = ({ start, end, fadeIn = 0.5, fadeOut = 0.5, push = 0.05, exitZoom = 0.12, children }) => {
  const t = useT();
  if (t < start || t > end) return null;
  const lt = t - start;
  const inP = ip(t, [start, start + fadeIn], [0, 1], outCubic);
  const outP = ip(t, [end - fadeOut, end], [0, 1], Easing.in(Easing.cubic));
  const drift = ip(t, [start, end], [0, push]);
  const scale = 1 + drift + outP * exitZoom - (1 - inP) * 0.06;
  return (
    <AbsoluteFill
      style={{
        opacity: inP * (1 - outP),
        transform: `scale(${scale}) translateY(${(1 - inP) * 40 - outP * 30}px)`,
        filter: `blur(${(1 - inP) * 14 + outP * 18}px)`,
      }}
    >
      {children(lt)}
    </AbsoluteFill>
  );
};

// Per-WORD reveal (never per-letter, so Arabic shaping stays connected)
const Words: React.FC<{
  text: string;
  lt: number;
  delay: number;
  size: number;
  gold?: boolean;
  weight?: number;
  stagger?: number;
  color?: string;
  sheenAt?: number;
}> = ({ text, lt, delay, size, gold, weight = 800, stagger = 0.09, color = "#F5F3EE", sheenAt }) => {
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const sheen = sheenAt === undefined ? -100 : ip(lt, [sheenAt, sheenAt + 1.1], [-20, 130], inOut);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.28,
        direction: "rtl",
        lineHeight: 1.45,
      }}
    >
      {words.map((w, i) => {
        const s = spring({
          frame: Math.max(0, (lt - delay - i * stagger) * fps),
          fps,
          config: { damping: 15, mass: 0.8, stiffness: 120 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: size,
              fontWeight: weight,
              fontFamily: FONT,
              opacity: Math.min(1, s * 1.4),
              transform: `translateY(${(1 - s) * size * 0.5}px) scale(${0.9 + 0.1 * s})`,
              padding: "0 4px",
              ...(gold
                ? { ...goldFill(sheen), filter: `${goldFill().filter} blur(${(1 - s) * 10}px)` }
                : {
                    color,
                    textShadow: "0 6px 30px rgba(0,0,0,0.6)",
                    filter: `blur(${(1 - s) * 10}px)`,
                  }),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const TopCaption: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 260 }) => (
  <div style={{ position: "absolute", top, left: 70, right: 70, textAlign: "center" }}>{children}</div>
);

const GoldRule: React.FC<{ lt: number; delay: number; width?: number }> = ({ lt, delay, width = 220 }) => {
  const p = ip(lt, [delay, delay + 0.8], [0, 1], outCubic);
  return (
    <div
      style={{
        margin: "26px auto 0",
        width: width * p,
        height: 3,
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        boxShadow: `0 0 18px ${GOLD}`,
      }}
    />
  );
};

// ---------- 0–4s HOOK ----------
const Hook: React.FC<{ lt: number }> = ({ lt }) => {
  const { fps } = useVideoConfig();
  const zoom = spring({ frame: lt * fps, fps, config: { damping: 20, mass: 1.2, stiffness: 70 } });
  const scale = interpolate(zoom, [0, 1], [1.7, 1]) + ip(lt, [0.8, 3.6], [0, 0.07]);
  const flash = ip(lt, [0, 0.12, 0.9], [0, 0.9, 0], outCubic);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 48%, rgba(255,225,140,${flash}) 0%, rgba(212,175,55,${flash * 0.4}) 25%, transparent 60%)`,
        }}
      />
      <div style={{ transform: `scale(${scale})`, filter: `blur(${(1 - zoom) * 16}px)`, textAlign: "center", width: 980 }}>
        <Words text="ليش أول" lt={lt} delay={0.1} size={112} />
        <div style={{ marginTop: -20 }}>
          <Words text="100 ألف ريال" lt={lt} delay={0.3} size={176} weight={900} gold sheenAt={1.4} />
        </div>
        <div style={{ marginTop: -10 }}>
          <Words text="أصعب من" lt={lt} delay={0.75} size={112} />
        </div>
        <div style={{ marginTop: -20 }}>
          <Words text="أول مليون؟" lt={lt} delay={0.95} size={176} weight={900} gold sheenAt={2.0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- counter that lives across scenes 2 & 3 ----------
const CHART = { left: 90, top: 780, w: 900, h: 760 };
const chartPoint = (x: number) => {
  const k = 3.1;
  const y = (Math.exp(k * x) - 1) / (Math.exp(k) - 1);
  return { x: 50 + x * 800, y: 700 - y * 600 };
};

const Counter: React.FC = () => {
  const t = useT();
  if (t < 4.2 || t > 17) return null;
  const appear = ip(t, [4.3, 5.0], [0, 1], outCubic);
  const value = ip(t, [4.8, 9.6], [0, 100000], Easing.bezier(0.5, 0, 0.75, 1));
  const morph = ip(t, [10.1, 11.3], [0, 1], inOut);
  const leave = ip(t, [16.4, 16.9], [0, 1]);
  const p0 = chartPoint(0);
  const targetX = CHART.left + p0.x;
  const targetY = CHART.top + p0.y - 95;
  const cx = interpolate(morph, [0, 1], [W / 2, targetX + 70]);
  const cy = interpolate(morph, [0, 1], [1030, targetY]);
  const scale = interpolate(morph, [0, 1], [1, 0.34]);
  const done = ip(t, [9.6, 9.75, 10.1], [0, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) scale(${scale * (0.85 + 0.15 * appear) * (1 + done * 0.05)})`,
        opacity: appear * (1 - leave),
        filter: `blur(${(1 - appear) * 12}px)`,
        textAlign: "center",
      }}
    >
      <div
        dir="ltr"
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 210,
          lineHeight: 1.2,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          ...goldFill(ip(t, [9.6, 10.6], [-20, 130])),
        }}
      >
        {fmt(value)}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 64,
          color: "#E9E4D8",
          marginTop: -20,
          letterSpacing: 2,
          opacity: 1 - morph,
        }}
      >
        ريال سعودي
      </div>
    </div>
  );
};

// ---------- 4–10s STRUGGLE ----------
const Struggle: React.FC<{ lt: number }> = ({ lt }) => {
  const t = lt + 3.7;
  const value = ip(t, [4.8, 9.6], [0, 1], Easing.bezier(0.5, 0, 0.75, 1));
  const barIn = ip(lt, [1.0, 1.6], [0, 1], outCubic);
  const marks = [0.25, 0.5, 0.75, 1];
  return (
    <AbsoluteFill>
      <TopCaption top={250}>
        <Words text="في البداية…" lt={lt} delay={0.3} size={92} gold sheenAt={1.4} />
        <div style={{ marginTop: 14 }}>
          <Words text="كل ريال تجمعه يعتمد على تعبك وادخارك." lt={lt} delay={0.8} size={70} weight={700} stagger={0.07} />
        </div>
        <GoldRule lt={lt} delay={1.2} />
      </TopCaption>
      {/* progress track */}
      <div
        style={{
          position: "absolute",
          top: 1290,
          left: 120,
          width: 840,
          opacity: barIn,
          transform: `translateY(${(1 - barIn) * 30}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 22,
            borderRadius: 11,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(212,175,55,0.25)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: `${value * 100}%`,
              borderRadius: 11,
              background: `linear-gradient(270deg, #8C6A1C, ${GOLD} 60%, #FFE9A3)`,
              boxShadow: `0 0 24px rgba(212,175,55,0.7)`,
            }}
          />
        </div>
        <div style={{ position: "relative", height: 90 }}>
          {marks.map((m) => {
            const on = value >= m - 0.001;
            return (
              <div
                key={m}
                style={{
                  position: "absolute",
                  right: `${m * 100}%`,
                  top: 18,
                  transform: "translateX(50%)",
                  textAlign: "center",
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 34,
                  color: on ? GOLD : "rgba(255,255,255,0.3)",
                  textShadow: on ? `0 0 16px rgba(212,175,55,0.8)` : undefined,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    margin: "0 auto 10px",
                    background: on ? GOLD : "rgba(255,255,255,0.2)",
                  }}
                />
                <span dir="ltr">{m * 100}K</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 42,
            color: "rgba(233,228,216,0.75)",
            direction: "rtl",
            opacity: ip(lt, [2.0, 2.8], [0, 1]),
          }}
        >
          ريال فوق ريال… شهر بعد شهر
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 10–17s TURNING POINT ----------
const Turning: React.FC<{ lt: number }> = ({ lt }) => {
  const draw = ip(lt, [1.2, 5.6], [0, 1], inOut);
  const gridIn = ip(lt, [0.6, 1.4], [0, 1], outCubic);
  const steps = 80;
  const pts = new Array(steps + 1).fill(0).map((_, i) => chartPoint(i / steps));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[steps].x},700 L${pts[0].x},700 Z`;
  const head = chartPoint(draw);
  const pulse = 1 + 0.35 * Math.abs(Math.sin(lt * 4));
  const lbl1 = ip(lt, [2.2, 2.8], [0, 1], outCubic);
  const lbl2 = ip(lt, [4.6, 5.2], [0, 1], outCubic);
  return (
    <AbsoluteFill>
      <TopCaption top={250}>
        <Words text="لكن مع الوقت…" lt={lt} delay={0.3} size={92} gold sheenAt={1.3} />
        <div style={{ marginTop: 14 }}>
          <Words text="رأس مالك يبدأ يساعدك." lt={lt} delay={0.8} size={76} weight={700} />
        </div>
        <GoldRule lt={lt} delay={1.2} />
      </TopCaption>
      <svg
        width={CHART.w}
        height={CHART.h}
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        style={{ position: "absolute", left: CHART.left, top: CHART.top, overflow: "visible" }}
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9A7520" />
            <stop offset="60%" stopColor={GOLD} />
            <stop offset="100%" stopColor="#FFF1B8" />
          </linearGradient>
          <clipPath id="reveal">
            <rect x={0} y={0} width={head.x + 2} height={CHART.h} />
          </clipPath>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* grid */}
        <g opacity={gridIn * 0.5}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`h${i}`} x1={50} x2={850} y1={100 + i * 150} y2={100 + i * 150} stroke="rgba(212,175,55,0.18)" strokeDasharray="6 10" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`v${i}`} y1={80} y2={700} x1={50 + i * 200} x2={50 + i * 200} stroke="rgba(255,255,255,0.06)" />
          ))}
        </g>
        <line x1={50} x2={50 + 800 * gridIn} y1={700} y2={700} stroke="rgba(212,175,55,0.6)" strokeWidth={2} />
        <path d={area} fill="url(#area)" clipPath="url(#reveal)" />
        <path
          d={line}
          fill="none"
          stroke="url(#stroke)"
          strokeWidth={9}
          strokeLinecap="round"
          filter="url(#glow)"
          clipPath="url(#reveal)"
        />
        {draw > 0.01 && (
          <g>
            <circle cx={head.x} cy={head.y} r={26 * pulse} fill={GOLD} opacity={0.18} />
            <circle cx={head.x} cy={head.y} r={13} fill="#FFF1B8" filter="url(#glow)" />
          </g>
        )}
        {/* phase labels */}
        <g opacity={lbl1} transform={`translate(0 ${(1 - lbl1) * 20})`}>
          <line x1={chartPoint(0.42).x} x2={chartPoint(0.42).x} y1={chartPoint(0.42).y - 20} y2={chartPoint(0.42).y - 180} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
          <text x={chartPoint(0.42).x} y={chartPoint(0.42).y - 200} textAnchor="middle" fill="#E9E4D8" fontFamily={FONT} fontWeight={700} fontSize={40} direction="rtl">
            جهدك وادخارك
          </text>
        </g>
        <g opacity={lbl2} transform={`translate(0 ${(1 - lbl2) * 20})`}>
          <text x={560} y={150} textAnchor="middle" fill={GOLD} fontFamily={FONT} fontWeight={800} fontSize={44} direction="rtl">
            + نمو رأس المال
          </text>
          <line x1={640} x2={760} y1={170} y2={chartPoint(0.89).y + 10} stroke="rgba(212,175,55,0.5)" strokeWidth={2} />
        </g>
        <text x={850} y={750} textAnchor="end" fill="rgba(233,228,216,0.55)" fontFamily={FONT} fontWeight={600} fontSize={32} opacity={gridIn}>
          الوقت →
        </text>
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 250,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 30,
          color: "rgba(233,228,216,0.5)",
          direction: "rtl",
          opacity: gridIn,
        }}
      >
        رسم توضيحي — النتائج الفعلية تختلف
      </div>
    </AbsoluteFill>
  );
};

// ---------- 17–24s POWER OF GROWTH ----------
const CompareCard: React.FC<{
  lt: number;
  delay: number;
  base: string;
  result: number;
  ratio: number;
  highlight?: boolean;
}> = ({ lt, delay, base, result, ratio, highlight }) => {
  const s = useSpring(lt, delay, 17);
  const bar = ip(lt, [delay + 0.5, delay + 1.7], [0, ratio], outCubic);
  const num = ip(lt, [delay + 0.5, delay + 1.7], [0, result], outCubic);
  return (
    <div
      style={{
        width: 920,
        margin: "0 auto",
        padding: "36px 48px 40px",
        borderRadius: 36,
        background: highlight
          ? "linear-gradient(160deg, rgba(212,175,55,0.16), rgba(212,175,55,0.04))"
          : "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        border: `2px solid ${highlight ? "rgba(212,175,55,0.7)" : "rgba(255,255,255,0.12)"}`,
        boxShadow: highlight ? "0 0 60px rgba(212,175,55,0.25), inset 0 0 40px rgba(212,175,55,0.08)" : "0 20px 50px rgba(0,0,0,0.4)",
        opacity: Math.min(1, s * 1.3),
        transform: `translateX(${(1 - s) * 160}px)`,
        filter: `blur(${(1 - s) * 12}px)`,
        direction: "rtl",
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: "#F5F3EE", lineHeight: 1.4 }}>
          <span style={{ color: GOLD, fontWeight: 900 }}>10%</span> من <span dir="ltr">{base}</span> ريال
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 600, color: "rgba(233,228,216,0.7)" }}>=</span>
        <span
          dir="ltr"
          style={{ fontSize: 120, fontWeight: 900, lineHeight: 1.25, fontVariantNumeric: "tabular-nums", ...goldFill(ip(lt, [delay + 1.8, delay + 2.8], [-20, 130])) }}
        >
          {fmt(num)}
        </span>
        <span style={{ fontSize: 52, fontWeight: 700, color: "#F5F3EE" }}>ريال</span>
      </div>
      <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,0.07)", marginTop: 16, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: `${bar * 100}%`,
            borderRadius: 9,
            background: `linear-gradient(270deg, #8C6A1C, ${GOLD} 60%, #FFE9A3)`,
            boxShadow: "0 0 20px rgba(212,175,55,0.7)",
          }}
        />
      </div>
    </div>
  );
};

const Growth: React.FC<{ lt: number }> = ({ lt }) => {
  const badge = useSpring(lt, 4.3, 12);
  return (
    <AbsoluteFill>
      <TopCaption top={230}>
        <Words text="كل ما زاد رأس مالك،" lt={lt} delay={0.3} size={74} weight={800} />
        <div style={{ marginTop: 6 }}>
          <Words text="صار أثر نفس نسبة النمو أكبر." lt={lt} delay={0.75} size={66} weight={900} gold sheenAt={2.0} />
        </div>
        <GoldRule lt={lt} delay={1.2} />
      </TopCaption>
      <div style={{ position: "absolute", top: 700, width: "100%" }}>
        <CompareCard lt={lt} delay={1.2} base="10,000" result={1000} ratio={0.1} />
        <div style={{ height: 50 }} />
        <CompareCard lt={lt} delay={2.6} base="100,000" result={10000} ratio={1} highlight />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1500,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, badge * 1.3),
          transform: `scale(${0.7 + 0.3 * badge})`,
        }}
      >
        <div
          style={{
            padding: "16px 44px",
            borderRadius: 60,
            border: `2px solid ${GOLD}`,
            background: "rgba(212,175,55,0.1)",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 46,
            color: "#F5F3EE",
            direction: "rtl",
            boxShadow: "0 0 40px rgba(212,175,55,0.3)",
          }}
        >
          نفس النسبة… <span style={{ color: GOLD }}>أثر أكبر بـ 10 أضعاف</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1650,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 32,
          color: "rgba(233,228,216,0.55)",
          direction: "rtl",
          opacity: ip(lt, [1.5, 2.2], [0, 1]),
        }}
      >
        * مثال توضيحي فقط، وليس عائدًا مضمونًا
      </div>
    </AbsoluteFill>
  );
};

// ---------- 24–30s ENDING ----------
const Ending: React.FC<{ lt: number }> = ({ lt }) => {
  const { fps } = useVideoConfig();
  const cta = 2.9; // local time of "ابدأ اليوم." reveal (≈26.8s)
  const up = ip(lt, [cta - 0.3, cta + 0.6], [0, 1], inOut);
  const s = spring({ frame: Math.max(0, (lt - cta) * fps), fps, config: { damping: 13, mass: 1, stiffness: 90 } });
  const flash = ip(lt, [cta, cta + 0.15, cta + 1.4], [0, 1, 0], outCubic);
  const ring = ip(lt, [cta, cta + 1.6], [0, 1], outCubic);
  const rays = ip(lt, [cta, cta + 0.8], [0, 1], outCubic);
  const finalFade = ip(lt, [5.6, 6.1], [0, 0.5]);
  return (
    <AbsoluteFill>
      {/* rotating golden rays */}
      <AbsoluteFill
        style={{
          opacity: rays * 0.35,
          background: `repeating-conic-gradient(from ${lt * 12}deg at 50% 55%, rgba(212,175,55,0.22) 0deg 4deg, transparent 4deg 18deg)`,
          maskImage: "radial-gradient(circle at 50% 55%, black 0%, transparent 55%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 55%, black 0%, transparent 55%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, rgba(255,230,150,${flash * 0.85}) 0%, rgba(212,175,55,${flash * 0.35}) 30%, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: 1056,
          width: 1400 * ring,
          height: 1400 * ring,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `3px solid rgba(212,175,55,${(1 - ring) * 0.8})`,
          boxShadow: `0 0 40px rgba(212,175,55,${(1 - ring) * 0.6})`,
        }}
      />
      {/* line 1 */}
      <div
        style={{
          position: "absolute",
          top: interpolate(up, [0, 1], [700, 430]),
          width: "100%",
          textAlign: "center",
          transform: `scale(${interpolate(up, [0, 1], [1, 0.72])})`,
          opacity: interpolate(up, [0, 1], [1, 0.75]),
        }}
      >
        <Words text="المليون يبدأ من" lt={lt} delay={0.3} size={110} weight={800} />
        <Words text="أول ريال." lt={lt} delay={0.7} size={150} weight={900} gold sheenAt={1.6} />
      </div>
      {/* CTA */}
      {lt > cta - 0.05 && (
        <div
          style={{
            position: "absolute",
            top: 900,
            width: "100%",
            textAlign: "center",
            transform: `scale(${interpolate(s, [0, 1], [1.8, 1])})`,
            opacity: Math.min(1, s * 1.5),
            filter: `blur(${(1 - s) * 18}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 172,
              lineHeight: 1.35,
              direction: "rtl",
              ...goldFill(ip(lt, [cta + 0.8, cta + 2.0], [-20, 130])),
              filter: "drop-shadow(0 0 50px rgba(212,175,55,0.55)) drop-shadow(0 6px 3px rgba(0,0,0,0.6))",
            }}
          >
            ابدأ اليوم.
          </div>
          <div
            style={{
              margin: "10px auto 0",
              width: 520 * ip(lt, [cta + 0.4, cta + 1.3], [0, 1], outCubic),
              height: 4,
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              boxShadow: `0 0 24px ${GOLD}`,
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 210,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 30,
          color: "rgba(233,228,216,0.5)",
          direction: "rtl",
          opacity: ip(lt, [cta + 1.2, cta + 2], [0, 1]),
        }}
      >
        محتوى تعليمي وليس نصيحة استثمارية
      </div>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: finalFade }} />
    </AbsoluteFill>
  );
};

// ---------- composition ----------
const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const sx = Math.sin(t * 0.35) * 10;
  const sy = Math.cos(t * 0.28) * 12;
  const rot = Math.sin(t * 0.2) * 0.4;
  return <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(1.02)` }}>{children}</AbsoluteFill>;
};

export const FinanceReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG, direction: "rtl", fontFamily: FONT, width: W, height: H }}>
      <Audio src={staticFile("finance-score.wav")} />
      <Background />
      <Particles />
      <Camera>
        <Scene start={0} end={4.05} fadeIn={0.01} fadeOut={0.55} exitZoom={0.35}>
          {(lt) => <Hook lt={lt} />}
        </Scene>
        <Scene start={3.7} end={10.35} fadeOut={0.5}>
          {(lt) => <Struggle lt={lt} />}
        </Scene>
        <Counter />
        <Scene start={10.0} end={17.2} fadeOut={0.5}>
          {(lt) => <Turning lt={lt} />}
        </Scene>
        <Scene start={16.9} end={24.25} fadeOut={0.5}>
          {(lt) => <Growth lt={lt} />}
        </Scene>
        <Scene start={23.9} end={30.01} fadeOut={0.01} push={0.03} exitZoom={0}>
          {(lt) => <Ending lt={lt} />}
        </Scene>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
