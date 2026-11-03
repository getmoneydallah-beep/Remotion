import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const SCENE = 80; // 3 scenes x 80 frames = 240 frames = 10s @ 24fps

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 240], [135, 225]);
  const glowY = interpolate(frame, [0, 240], [30, 70]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, #1a0533 0%, #4c1d95 45%, #be185d 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${glowY}%, rgba(236,72,153,0.45) 0%, rgba(139,92,246,0.15) 35%, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Scene: React.FC<{
  text: string;
  size: number;
  gradient?: boolean;
  sub?: string;
  last?: boolean;
}> = ({ text, size, gradient, sub, last }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const exit = last
    ? 0
    : interpolate(frame, [SCENE - 14, SCENE], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      });
  const opacity = Math.min(enter, 1) * (1 - exit);
  const y = interpolate(enter, [0, 1], [60, 0]) - exit * 60;
  const scale = interpolate(enter, [0, 1], [0.85, 1]) + exit * 0.08;
  const blur = interpolate(enter, [0, 1], [12, 0]) + exit * 12;
  const subOpacity = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = last ? 1 + Math.sin(frame / 8) * 0.02 : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        textAlign: "center",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: -1.5,
          lineHeight: 1.05,
          opacity,
          transform: `translateY(${y}px) scale(${scale * pulse})`,
          filter: `blur(${blur}px)`,
          color: "white",
          ...(gradient
            ? {
                background: "linear-gradient(90deg, #ffffff, #f9a8d4, #c4b5fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : {}),
          textShadow: gradient ? undefined : "0 8px 40px rgba(236,72,153,0.5)",
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            opacity: subOpacity * (1 - exit),
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const LopsPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence durationInFrames={SCENE}>
        <Scene text="Have an idea?" size={72} />
      </Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE}>
        <Scene text="Build it with AI" size={68} gradient />
      </Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE}>
        <Scene text="Lops.app" size={96} gradient sub="Start building today" last />
      </Sequence>
    </AbsoluteFill>
  );
};
