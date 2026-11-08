import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, UI } from "./fonts";
import TL from "./timeline.json";

/*
 * «ابدأ الآن» — minimal monochrome motivational Reel (Arabic, RTL).
 * Black stage, white line icons, white pill tags, glowing headline words,
 * blur-in / blur-out transitions. Progressions run right → left to match Arabic reading.
 */

export type StartNowProps = {
  /** Optional b-roll clips in /public (e.g. "startnow/broll1.mp4") played in grayscale over the outro. */
  broll?: string[];
};

const W = 1080;
const WHITE = "#f4f4f4";
const DIM = "rgba(244,244,244,0.38)";
const GLOW = "0 0 14px rgba(255,255,255,0.65), 0 0 38px rgba(255,255,255,0.32), 0 0 80px rgba(255,255,255,0.12)";
const SOFT_GLOW = "0 0 10px rgba(255,255,255,0.35)";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** Blur-in reveal used for nearly every element. */
const reveal = (f: number, at: number, dur = 12, rise = 18) => {
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  return {
    opacity: p,
    filter: `blur(${(1 - p) * 14}px)`,
    transform: `translateY(${(1 - p) * rise}px)`,
  } as React.CSSProperties;
};

const fadeOut = (f: number, at: number, dur = 10): React.CSSProperties => {
  const p = interpolate(f, [at, at + dur], [0, 1], clamp);
  return { opacity: 1 - p, filter: `blur(${p * 16}px)` };
};

const draw = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

// ---------- primitives ----------

const Txt: React.FC<{
  x?: number;
  y: number;
  size: number;
  weight?: number;
  font?: string;
  glow?: boolean;
  color?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x = W / 2, y, size, weight = 800, font = DISPLAY, glow, color = WHITE, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translate(-50%, -50%)",
      whiteSpace: "nowrap",
      direction: "rtl",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.25,
        color,
        textShadow: glow ? GLOW : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  </div>
);

const Pill: React.FC<{ x?: number; y: number; size?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  x = W / 2,
  y,
  size = 36,
  style,
  children,
}) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)" }}>
    <div
      style={{
        background: WHITE,
        color: "#0a0a0a",
        fontFamily: UI,
        fontWeight: 600,
        fontSize: size,
        padding: `${size * 0.22}px ${size * 0.75}px ${size * 0.3}px`,
        borderRadius: 999,
        whiteSpace: "nowrap",
        direction: "rtl",
        boxShadow: "0 0 22px rgba(255,255,255,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  </div>
);

/** Minimal person icon. (x, y) = feet position. */
const Person: React.FC<{ x: number; y: number; s?: number; color?: string; style?: React.CSSProperties }> = ({
  x,
  y,
  s = 1,
  color = WHITE,
  style,
}) => (
  <div style={{ position: "absolute", left: x - 26 * s, top: y - 86 * s, width: 52 * s, height: 86 * s, ...style }}>
    <svg width={52 * s} height={86 * s} viewBox="0 0 52 86" style={{ overflow: "visible", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))" }}>
      <circle cx={26} cy={15} r={14} fill={color} />
      <path d="M4 86 V52 a22 22 0 0 1 44 0 V86 Z" fill={color} />
    </svg>
  </div>
);

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {children}
  </svg>
);

const lineStyle = { stroke: WHITE, strokeWidth: 5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

const Cross: React.FC<{ cx: number; cy: number; r: number; p: number; w?: number }> = ({ cx, cy, r, p, w = 6 }) => {
  const a = Math.min(1, p * 2);
  const b = Math.max(0, p * 2 - 1);
  return (
    <g style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7))" }}>
      <line x1={cx + r} y1={cy - r} x2={cx + r - 2 * r * a} y2={cy - r + 2 * r * a} stroke={WHITE} strokeWidth={w} strokeLinecap="round" opacity={a > 0 ? 1 : 0} />
      <line x1={cx - r} y1={cy - r} x2={cx - r + 2 * r * b} y2={cy - r + 2 * r * b} stroke={WHITE} strokeWidth={w} strokeLinecap="round" opacity={b > 0 ? 1 : 0} />
    </g>
  );
};

/** Wraps a scene: quick blur-in at the start, blur-out at the end, slow push-in. */
const SceneWrap: React.FC<{ dur: number; children: React.ReactNode; push?: number; noOut?: boolean }> = ({ dur, children, push = 0.035, noOut }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 8], [0, 1], clamp);
  const outP = noOut ? 0 : interpolate(f, [dur - 10, dur], [0, 1], clamp);
  const scale = 1 + push * (f / dur);
  return (
    <AbsoluteFill
      style={{
        opacity: inP * (1 - outP),
        filter: `blur(${(1 - inP) * 10 + outP * 18}px)`,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---------- scenes ----------

/** 1 — «ابقَ هنا… أو اطلع فوق» */
const StairsHook: React.FC = () => {
  const f = useCurrentFrame();
  const groundY = 1080;
  const baseX = 800; // stairs start here and climb leftwards
  const step = 68;
  const n = 8;
  let d = `M ${baseX} ${groundY}`;
  for (let i = 0; i < n; i++) {
    const x = baseX - i * step;
    const y = groundY - i * step;
    d += ` L ${x} ${y - step} L ${x - step} ${y - step}`;
  }
  const topX = baseX - n * step;
  const topY = groundY - n * step;
  const pathLen = n * step * 2 + 10;
  const stairP = draw(f, 20, 52);
  const groundP = draw(f, 0, 12);
  const sun = interpolate(f, [56, 70], [0, 1], { ...clamp, easing: ease });
  return (
    <SceneWrap dur={96}>
      <Stage>
        <line x1={1010} y1={groundY} x2={1010 - 210 * groundP} y2={groundY} {...lineStyle} />
        <path d={d} {...lineStyle} strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - stairP)} />
        {/* arrow up from the top step */}
        <g opacity={draw(f, 44, 54)}>
          <line x1={topX + 30} y1={topY - 10} x2={topX + 30} y2={topY - 10 - 110 * draw(f, 44, 56)} {...lineStyle} strokeWidth={4} />
          <path d={`M ${topX + 16} ${topY - 104} L ${topX + 30} ${topY - 122} L ${topX + 44} ${topY - 104}`} {...lineStyle} strokeWidth={4} opacity={draw(f, 52, 56)} />
        </g>
        {/* sun */}
        <g opacity={sun} transform={`translate(${topX + 30} ${topY - 190}) scale(${0.6 + 0.4 * sun}) rotate(${f * 1.2})`}>
          <circle r={22} fill={WHITE} style={{ filter: "drop-shadow(0 0 22px rgba(255,255,255,0.9))" }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={0} y1={-34} x2={0} y2={-46} stroke={WHITE} strokeWidth={4} strokeLinecap="round" transform={`rotate(${i * 30})`} />
          ))}
        </g>
      </Stage>
      <Person x={905} y={groundY - 3} style={reveal(f, 4, 10, 0)} />
      <div style={reveal(f, 12)}>
        <Txt x={905} y={groundY + 56} size={38} font={UI} weight={600}>
          ابقَ هنا
        </Txt>
      </div>
      <div style={reveal(f, 58)}>
        <Txt x={topX + 170} y={topY - 60} size={44} font={UI} weight={600} style={{ textShadow: SOFT_GLOW }}>
          أو اطلع فوق
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 2 — «إنت للحين ما فهمت؟» */
const Understand: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneWrap dur={60}>
      <div style={reveal(f, 0, 10)}>
        <Txt y={860} size={84} weight={800} glow>
          إنت للحين
        </Txt>
      </div>
      <div style={reveal(f, 18, 10)}>
        <Txt y={990} size={118} weight={900} glow>
          ما فهمت؟
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 3 — the week on repeat */
const WeekLoop: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 540;
  const cy = 860;
  const r = 230;
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const circ = 2 * Math.PI * r;
  const circleP = draw(f, 4, 26);
  // orbiting dot: one lap every 66 frames, counter-clockwise (RTL feel)
  const ang = -Math.PI / 2 - (f / 66) * Math.PI * 2;
  const trail = ang + 0.16;
  const people = [690, 590, 490, 390];
  return (
    <SceneWrap dur={180} push={0.05}>
      <div style={reveal(f, 2)}>
        <Pill y={500}>تعبت من نفس الحياة؟</Pill>
      </div>
      <Stage>
        <circle cx={cx} cy={cy} r={r} {...lineStyle} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={circ * (1 - circleP)} transform={`rotate(-90 ${cx} ${cy})`} />
        <g opacity={draw(f, 22, 30)} style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.9))" }}>
          <circle cx={cx + Math.cos(ang) * r} cy={cy + Math.sin(ang) * r} r={15} fill={WHITE} />
          <circle cx={cx + Math.cos(trail) * (r + 2)} cy={cy + Math.sin(trail) * (r + 2)} r={8} fill={WHITE} opacity={0.8} />
        </g>
        {/* dashed "rest of your life" line */}
        <line x1={900} y1={1490} x2={900 - 720 * draw(f, 125, 150)} y2={1490} stroke={WHITE} strokeWidth={4} strokeDasharray="16 14" />
      </Stage>
      {days.map((d, i) => {
        const a = -Math.PI / 2 - (i / 7) * Math.PI * 2;
        return (
          <div key={d} style={reveal(f, 8 + i * 2, 10, 0)}>
            <Txt x={cx + Math.cos(a) * (r + 62)} y={cy + Math.sin(a) * (r + 54)} size={26} font={UI} weight={500} color={DIM}>
              {d}
            </Txt>
          </div>
        );
      })}
      <div style={reveal(f, 24)}>
        <Txt x={cx} y={cy - 12} size={60} weight={800} style={{ textShadow: SOFT_GLOW }}>
          نفس الروتين
        </Txt>
      </div>
      <div style={reveal(f, 32)}>
        <Txt x={cx} y={cy + 52} size={28} font={UI} weight={500} color={DIM}>
          يتكرر كل أسبوع
        </Txt>
      </div>
      {people.map((x, i) => (
        <Person key={x} x={x} y={1290} s={0.8} color="rgba(244,244,244,0.55)" style={reveal(f, 50 + i * 4, 10, 10)} />
      ))}
      <div style={reveal(f, 66)}>
        <Txt y={1330} size={32} font={UI} weight={500}>
          ناس كثير عايشينها
        </Txt>
      </div>
      <div style={reveal(f, 95)}>
        <Txt y={1408} size={58} weight={900} glow>
          خايف؟
        </Txt>
      </div>
      <div style={reveal(f, 135)}>
        <Txt y={1545} size={34} font={UI} weight={600}>
          تكملها لبقية عمرك؟
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 4 — «فالأحسن إنك… ابدأ الآن» button press */
const ButtonPress: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lit = interpolate(f, [10, 30], [0, 1], { ...clamp, easing: ease });
  const press = f < 50 ? 1 : 1 - 0.07 * Math.sin(Math.min(1, (f - 50) / 8) * Math.PI);
  const ring = spring({ frame: f - 50, fps, config: { damping: 200 } });
  return (
    <SceneWrap dur={84}>
      <div style={reveal(f, 0)}>
        <Txt y={820} size={40} font={UI} weight={600}>
          فالأحسن إنك
        </Txt>
      </div>
      <div style={{ position: "absolute", inset: 0, ...reveal(f, 8, 14, 0) }}>
      <div style={{ position: "absolute", left: W / 2, top: 1000, transform: `translate(-50%,-50%) scale(${press})` }}>
        <div
          style={{
            width: 620,
            height: 170,
            borderRadius: 999,
            background: `rgba(244,244,244,${0.18 + 0.82 * lit})`,
            filter: `blur(${(1 - lit) * 10}px)`,
            boxShadow: `0 0 ${40 * lit}px rgba(255,255,255,0.45), 0 0 0 ${10 + ring * 26}px rgba(244,244,244,${0.9 * (1 - ring) * (f >= 50 ? 1 : 0)}), 0 0 0 10px #050505, 0 0 0 14px rgba(244,244,244,${lit})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 92,
            color: "#080808",
            direction: "rtl",
          }}
        >
          ابدأ الآن
        </div>
      </div>
      </div>
    </SceneWrap>
  );
};

/** 5 — not tomorrow, not next week, not next month */
const Cards: React.FC = () => {
  const f = useCurrentFrame();
  const items = [
    { t: "بكرة", at: 10, x: 45, y: 800 },
    { t: "الأسبوع الجاي", at: 55, x: 95, y: 1060 },
    { t: "الشهر الجاي", at: 105, x: 145, y: 1320 },
  ];
  const cw = 640;
  const ch = 200;
  return (
    <SceneWrap dur={180} push={0.03}>
      <div style={reveal(f, 0)}>
        <Pill y={600}>مو…</Pill>
      </div>
      {items.map((it) => {
        const crossP = draw(f, it.x, it.x + 10);
        return (
          <div key={it.t} style={reveal(f, it.at, 12, 30)}>
            <div
              style={{
                position: "absolute",
                left: W / 2 - cw / 2,
                top: it.y - ch / 2,
                width: cw,
                height: ch,
                border: `4px solid ${WHITE}`,
                borderRadius: 22,
                boxShadow: SOFT_GLOW,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 52, borderBottom: `3px solid ${WHITE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontWeight: 500, fontSize: 26, color: DIM, direction: "rtl" }}>
                خلنا نبدأ
              </div>
              <div
                style={{
                  height: ch - 52 - 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  fontSize: 64,
                  color: WHITE,
                  opacity: 1 - 0.65 * crossP,
                  direction: "rtl",
                }}
              >
                {it.t}
              </div>
            </div>
            <Stage>
              <Cross cx={W / 2} cy={it.y + 26} r={56} p={crossP} />
            </Stage>
          </div>
        );
      })}
    </SceneWrap>
  );
};

/** 6 — «لازم تبدأ الآن — ليش؟» */
const StartNowBig: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 15, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <SceneWrap dur={90}>
      <div style={reveal(f, 0)}>
        <Txt y={810} size={44} font={UI} weight={600}>
          لازم
        </Txt>
      </div>
      <div style={{ opacity: Math.min(1, pop * 1.4), filter: `blur(${Math.max(0, 1 - pop) * 16}px)` }}>
        <Txt y={950} size={170} weight={900} glow style={{ transform: `scale(${1.25 - 0.25 * pop})` }}>
          تبدأ الآن
        </Txt>
      </div>
      <div style={reveal(f, 50)}>
        <Pill y={1120}>ليش؟</Pill>
      </div>
    </SceneWrap>
  );
};

/** 7 — there will always be obstacles… climb them anyway */
const Bars: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gy = 1200;
  const bars = [
    { x: 720, h: 190, label: "مشاكل", at: 50 },
    { x: 510, h: 290, label: "ظروف", at: 85 },
    { x: 290, h: 410, label: "عوائق", at: 120 },
  ];
  const bw = 150;
  // figure path: ground → each bar top
  const stops = [{ x: 905, y: gy }, ...bars.map((b) => ({ x: b.x, y: gy - b.h }))];
  const hops = [190, 215, 240];
  let px = stops[0].x;
  let py = stops[0].y;
  for (let i = 0; i < hops.length; i++) {
    const p = interpolate(f, [hops[i], hops[i] + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    if (p > 0) {
      const a = stops[i];
      const b = stops[i + 1];
      px = a.x + (b.x - a.x) * p;
      py = a.y + (b.y - a.y) * p - Math.sin(Math.PI * p) * 130;
    }
  }
  const swap = draw(f, 156, 166);
  const swap2 = draw(f, 250, 260);
  return (
    <SceneWrap dur={300} push={0.03}>
      <div style={{ ...reveal(f, 25), opacity: (reveal(f, 25).opacity as number) * (1 - swap) }}>
        <Pill y={560}>دايم بيكون فيه</Pill>
      </div>
      <div style={reveal(f, 160)}>
        <Pill y={560}>فالأحسن تبدأ الآن</Pill>
      </div>
      <Stage>
        <line x1={1000} y1={gy} x2={1000 - 920 * draw(f, 0, 16)} y2={gy} {...lineStyle} strokeWidth={4} />
        {bars.map((b) => {
          const g = spring({ frame: f - b.at, fps, config: { damping: 15, stiffness: 120 } });
          const h = b.h * g;
          return <rect key={b.x} x={b.x - bw / 2} y={gy - h} width={bw} height={h} rx={10} fill={WHITE} style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.45))" }} />;
        })}
      </Stage>
      {bars.map((b) => (
        <div key={b.label} style={reveal(f, b.at + 8, 10)}>
          <Txt x={b.x} y={gy - b.h + 40} size={32} font={UI} weight={600} color="#0a0a0a">
            {b.label}
          </Txt>
        </div>
      ))}
      <Person x={px} y={py - 3} style={reveal(f, 6, 10, 0)} />
      <div style={{ ...reveal(f, 60), opacity: (reveal(f, 60).opacity as number) * (1 - swap2) }}>
        <Txt y={gy + 64} size={36} font={UI} weight={600} color={DIM}>
          دايمًا
        </Txt>
      </div>
      <div style={reveal(f, 254)}>
        <Txt y={gy + 64} size={40} font={UI} weight={600}>
          بأي حال
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 8 — «تدري وش الشي العادي؟ الفشل» */
const Failing: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 40, fps, config: { damping: 14, stiffness: 150 } });
  return (
    <SceneWrap dur={150}>
      <div style={{ ...reveal(f, 0), ...(f > 30 ? fadeOut(f, 30, 8) : {}) }}>
        <Txt y={900} size={72} weight={800} glow>
          تدري وش الشي العادي؟
        </Txt>
      </div>
      <div style={{ opacity: f >= 40 ? Math.min(1, pop * 1.4) : 0, filter: `blur(${Math.max(0, 1 - pop) * 16}px)` }}>
        <Txt y={880} size={190} weight={900} glow style={{ transform: `scale(${1.2 - 0.2 * pop})` }}>
          الفشل
        </Txt>
      </div>
      <div style={{ position: "absolute", inset: 0, ...reveal(f, 60) }}>
      <div style={{ position: "absolute", left: W / 2, top: 1040, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 18, direction: "rtl" }}>
        <svg width={52} height={52} viewBox="0 0 52 52">
          <circle cx={26} cy={26} r={22} {...lineStyle} strokeWidth={3.5} />
          <path d="M15 27 L23 34 L37 19" {...lineStyle} strokeWidth={4} strokeDasharray={40} strokeDashoffset={40 * (1 - draw(f, 64, 76))} />
        </svg>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 54, color: WHITE }}>عادي</span>
      </div>
      </div>
      <div style={reveal(f, 85)}>
        <Pill y={1170}>لازم تفشل</Pill>
      </div>
    </SceneWrap>
  );
};

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/** 9 — fail counter on the stairs → success */
const FailStairs: React.FC = () => {
  const f = useCurrentFrame();
  const n = 9;
  const step = 72;
  const x0 = 900;
  const y0 = 1380;
  let d = `M ${x0 + 40} ${y0}`;
  for (let i = 0; i < n; i++) {
    const x = x0 - i * step;
    const y = y0 - i * step;
    d += ` L ${x} ${y} L ${x} ${y - step}`;
  }
  d += ` L ${x0 - n * step} ${y0 - n * step}`;
  const len = n * step * 2 + 40;
  const stepAt = (i: number) => 8 + i * 10;
  const drawn = draw(f, 4, stepAt(n - 1) + 8);
  const fails = Array.from({ length: n - 1 }).filter((_, i) => f >= stepAt(i) + 6).length;
  const topX = x0 - n * step;
  const topY = y0 - n * step;
  const star = interpolate(f, [108, 122], [0, 1], { ...clamp, easing: ease });
  const starPath = Array.from({ length: 10 })
    .map((_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 18 : 42;
      return `${i ? "L" : "M"} ${Math.cos(a) * rr} ${Math.sin(a) * rr}`;
    })
    .join(" ") + " Z";
  return (
    <SceneWrap dur={150} push={0.04}>
      <div style={reveal(f, 30)}>
        <Pill y={470}>افشل قد ما تقدر</Pill>
      </div>
      <div style={reveal(f, 2)}>
        <Txt x={860} y={640} size={36} font={UI} weight={600}>
          {`مرات الفشل: ${toArabicDigits(fails)}`}
        </Txt>
      </div>
      <Stage>
        <path d={d} {...lineStyle} strokeWidth={4} strokeDasharray={len} strokeDashoffset={len * (1 - drawn)} />
        {Array.from({ length: n - 1 }).map((_, i) => (
          <Cross key={i} cx={x0 - i * step - step / 2} cy={y0 - i * step - step / 2 - 4} r={14} p={draw(f, stepAt(i) + 4, stepAt(i) + 10)} w={4} />
        ))}
        <g opacity={star} transform={`translate(${topX - 10} ${topY - 70}) scale(${0.4 + 0.6 * star}) rotate(${(1 - star) * -60})`}>
          <path d={starPath} fill={WHITE} style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.95))" }} />
        </g>
      </Stage>
      <div style={reveal(f, 104)}>
        <Txt x={topX + 10} y={topY - 160} size={30} font={UI} weight={500} color={DIM}>
          وفي النهاية
        </Txt>
      </div>
      <div style={reveal(f, 116)}>
        <Txt x={topX + 10} y={topY + 10} size={46} weight={900} glow>
          تنجح
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 10 — «بس تدري وش اللي مو عادي؟ إنك ما تحاول» */
const NotTrying: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 50, fps, config: { damping: 14, stiffness: 150 } });
  const dim = interpolate(f, [96, 112], [1, 0.32], clamp);
  return (
    <SceneWrap dur={120}>
      <div style={{ ...reveal(f, 0), ...(f > 40 ? fadeOut(f, 40, 8) : {}) }}>
        <Txt y={860} size={52} font={UI} weight={600}>
          بس تدري وش الشي
        </Txt>
        <Txt y={960} size={84} weight={900} glow>
          اللي مو عادي؟
        </Txt>
      </div>
      <div style={{ opacity: f >= 50 ? Math.min(1, pop * 1.4) * dim : 0, filter: `blur(${Math.max(0, 1 - pop) * 16 + (1 - dim) * 4}px)` }}>
        <Txt y={900} size={150} weight={900} glow style={{ transform: `scale(${1.2 - 0.2 * pop})` }}>
          إنك ما تحاول
        </Txt>
      </div>
      <div style={reveal(f, 70)}>
        <Txt y={1040} size={40} font={UI} weight={600} color={DIM}>
          هذا اللي مو عادي
        </Txt>
      </div>
    </SceneWrap>
  );
};

/** 11 — outro: the figure finally climbs; or user b-roll in grayscale. */
const Outro: React.FC<{ broll: string[] }> = ({ broll }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = 156;
  const groundY = 1240;
  const baseX = 820;
  const step = 70;
  const n = 7;
  let d = `M 1010 ${groundY} L ${baseX} ${groundY}`;
  for (let i = 0; i < n; i++) {
    const x = baseX - i * step;
    const y = groundY - i * step;
    d += ` L ${x} ${y - step} L ${x - step} ${y - step}`;
  }
  const topX = baseX - n * step;
  const topY = groundY - n * step;
  // climb: one hop per step, 8 frames each
  const hop = (f - 6) / 8;
  const k = Math.max(0, Math.min(n, Math.floor(hop)));
  const p = Math.max(0, Math.min(1, hop - k));
  const cur = (i: number) => (i === 0 ? { x: 905, y: groundY } : { x: baseX - (i - 1) * step - step / 2, y: groundY - i * step });
  const a = cur(k);
  const b = cur(Math.min(n, k + 1));
  const done = hop >= n;
  const px = done ? cur(n).x : a.x + (b.x - a.x) * p;
  const py = done ? cur(n).y : a.y + (b.y - a.y) * p - Math.sin(Math.PI * p) * 40;
  const sun = interpolate(f, [60, 80], [0.25, 1], clamp) * interpolate(f, [84, 96], [1, 0.3], clamp);
  const pop = spring({ frame: f - 84, fps, config: { damping: 14, stiffness: 150 } });
  const end = interpolate(f, [dur - 18, dur], [1, 0], clamp);
  const segLen = broll.length ? Math.floor(84 / broll.length) : 0;

  return (
    <SceneWrap dur={dur} noOut push={0.05}>
      <AbsoluteFill style={{ opacity: end }}>
        {broll.length > 0 ? (
          <AbsoluteFill style={{ opacity: interpolate(f, [80, 90], [1, 0.25], clamp) }}>
            {broll.map((src, i) => (
              <Sequence key={src} from={i * segLen} durationInFrames={i === broll.length - 1 ? dur - i * segLen : segLen}>
                <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.15) brightness(0.8)" }} />
              </Sequence>
            ))}
          </AbsoluteFill>
        ) : (
          <>
            <Stage>
              <path d={d} {...lineStyle} strokeWidth={4} opacity={interpolate(f, [80, 92], [1, 0.1], clamp)} />
              <g transform={`translate(${topX + 10} ${topY - 150})`} opacity={sun}>
                <circle r={26 + 6 * sun} fill={WHITE} style={{ filter: `drop-shadow(0 0 ${30 * sun}px rgba(255,255,255,0.95))` }} />
              </g>
            </Stage>
            <Person x={px} y={py - 3} style={{ opacity: interpolate(f, [80, 92], [1, 0.1], clamp) }} />
            <div style={{ ...reveal(f, 10), opacity: (reveal(f, 10).opacity as number) * interpolate(f, [76, 84], [1, 0], clamp) }}>
              <Txt y={520} size={44} font={UI} weight={600}>
                الدرج قدامك… والقرار لك
              </Txt>
            </div>
          </>
        )}
        <div style={{ opacity: f >= 84 ? Math.min(1, pop * 1.4) : 0, filter: `blur(${Math.max(0, 1 - pop) * 16}px)` }}>
          <Txt y={940} size={180} weight={900} glow style={{ transform: `scale(${1.2 - 0.2 * pop})` }}>
            ابدأ الآن.
          </Txt>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- composition ----------

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img src={staticFile(`grain${f % 4}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.07, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<{ broll: string[] }>> = {
  stairs: StairsHook,
  understand: Understand,
  loop: WeekLoop,
  button: ButtonPress,
  cards: Cards,
  startNow: StartNowBig,
  bars: Bars,
  failing: Failing,
  failStairs: FailStairs,
  notTrying: NotTrying,
  outro: Outro,
};

export const START_NOW_DURATION = TL.scenes[TL.scenes.length - 1].start + TL.scenes[TL.scenes.length - 1].dur;

export const StartNowReel: React.FC<StartNowProps> = ({ broll = [] }) => {
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #161616 0%, #0b0b0b 45%, #030303 100%)" }}>
      {TL.scenes.map((s) => {
        const C = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.dur} name={s.id}>
            <C broll={broll} />
          </Sequence>
        );
      })}
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
      <Audio src={staticFile("startnow/score.wav")} />
    </AbsoluteFill>
  );
};
