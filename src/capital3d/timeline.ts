// Beat sheet for Film3D (seconds). scripts/make-audio3.js mirrors the cue formulas.
export const DURATION = 31.5;

export const VO = [
  { src: "vo/l1.wav", at: 0.9 }, // ليش أول مية ألف ريال… أصعب من أول مليون؟
  { src: "vo/l2.wav", at: 5.9 }, // في البداية… كل ريال تجمعه، يجي من تعبك وادخارك.
  { src: "vo/l3.wav", at: 11.7 }, // لكن مع الوقت… رأس مالك يبدأ يشتغل معك.
  { src: "vo/l4.wav", at: 16.5 }, // ونفس نسبة النمو… يصير أثرها أكبر، كل ما كبر رأس مالك.
  { src: "vo/l5.wav", at: 26.4 }, // المليون يبدأ من أول ريال.
  { src: "vo/l6.wav", at: 29.3 }, // ابدأ اليوم.
];
export const VO_LEN = [4.19, 4.45, 3.4, 5.05, 2.74, 1.17];

// Effort: 20 grains (5,000 SAR each)
export const N_GRAINS = 20;
export const grainLand = (k: number) => (k === 0 ? 0 : 6.1 + (k - 1) * 0.235);
export const GRAIN_FLIGHT = 0.75;

// Fusion → pearl
export const FUSE_START = 10.85;
export const FUSE_END = 11.75;

// Capital starts working: beads into a 2×5 grid (each bead = 1,000 SAR)
export const BEAD_BIRTHS = [13.1, 14.3, 14.55, 19.25, 19.42, 19.59, 19.76, 19.93, 20.1, 20.27];
export const SMALL_BEAD_BIRTH = 18.75;
export const BEAD_FLIGHT = 0.5;
export const SMALL_IN = [16.9, 18.0];
export const SMALL_OUT = [22.0, 23.3];

// Climax: grid beads roll into the spiral, then self-replication
export const TO_SPIRAL = [22.35, 23.0];
export const SPIRAL_N = 255;
export const spiralBirth = (i: number) => 23.0 + Math.log2(i / 10) * 0.58;
export const SPIRAL_FLIGHT = 0.46;

export const DOT_LAND = 29.3;
