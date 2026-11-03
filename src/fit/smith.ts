import type { ReelConfig } from "./WorkoutReel";
import { GRAMS } from "./brand";

// Female Smith-machine legs Reel (same five exercises as the reference), promoting Grams.
// Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini (Higgsfield) · Female voice "Kore": Gemini TTS.
const VO_LEN = [4.78, 4.48, 3.91, 3.87, 3.5, 3.56, 5.98];
const AT = [0.25, 5.5, 10.5, 14.9, 19.3, 23.3, 27.5];

export const SMITH: ReelConfig = {
  duration: 35.5,
  brand: GRAMS,
  hook: { image: "smith/kf/hook.png", end: 5.2, small: "تبين رجول", big: "أقوى", sub: "٥ تمارين على السميث" },
  exercises: [
    { clip: "smith/c1.mp4", start: 5.2, end: 10.2, title: "سكوات السميث", cue: "انزلي لين فخذك يوازي الأرض", muscleAr: "الفخذ الأمامية والأرداف", muscleEn: "QUADS · GLUTES", dot: [410, 1320] },
    { clip: "smith/c2.mp4", start: 10.2, end: 14.6, title: "سكوات للأرداف", cue: "قدميك قدام وادفعي بكعبك", muscleAr: "عضلات الأرداف", muscleEn: "GLUTES", dot: [560, 1250] },
    { clip: "smith/c3.mp4", start: 14.6, end: 19.0, title: "قود مورنينق", cue: "وركك لورا وظهرك مستقيم", muscleAr: "الخلفية والأرداف", muscleEn: "HAMSTRINGS · GLUTES", dot: [470, 1120] },
    { clip: "smith/c4.mp4", start: 19.0, end: 23.0, title: "اللانج الخلفي", cue: "رجلك ورا وانزلي بثبات", muscleAr: "الأرداف والفخذ الأمامية", muscleEn: "GLUTES · QUADS", dot: [510, 1200] },
    { clip: "smith/c5.mp4", start: 23.0, end: 27.2, title: "رفع السمانة", cue: "اطلعي على أصابعك وانزلي ببطء", muscleAr: "عضلات السمانة", muscleEn: "CALVES", dot: [450, 1420], labelUp: true },
  ],
  cta: { start: 27.2, image: "smith/kf/hook.png", question: "تبين خطة كاملة تمشين عليها؟", line: "خطط تمارين + حساب سعراتك", trial: "جرّبيه مجانًا ٧ أيام" },
  vo: AT.map((at, i) => ({ src: `smith/vo_${i}.wav`, at, len: VO_LEN[i] })),
  music: { src: "fit/music_cut.mp3", volume: 0.36, duck: 0.2 },
  sfx: "smith/sfx.wav",
};
