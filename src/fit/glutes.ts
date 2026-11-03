import type { ReelConfig } from "./WorkoutReel";
import { GRAMS } from "./brand";

// Women's glutes-at-home Reel (mat + one dumbbell), promoting Grams.
// Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini (Higgsfield) · Female voice "Kore": Gemini TTS (CTA line reused from smith).
const VO_LEN = [5.06, 4.44, 3.37, 3.94, 3.26, 4.11, 5.98];
const AT = [0.25, 5.7, 10.7, 14.5, 18.9, 22.7, 27.3];

export const GLUTES: ReelConfig = {
  duration: 35.3,
  brand: GRAMS,
  hook: { image: "glutes/kf/hook.png", end: 5.4, small: "تبين أرداف", big: "أقوى", sub: "٥ تمارين من البيت" },
  exercises: [
    { clip: "glutes/c1.mp4", start: 5.4, end: 10.4, title: "الهيب ثرست", cue: "ادفعي وركك لفوق وعصري", muscleAr: "عضلة الأرداف الكبرى", muscleEn: "GLUTEUS MAXIMUS", dot: [520, 1080] },
    { clip: "glutes/c2.mp4", start: 10.4, end: 14.2, title: "جسر الأرداف", cue: "ثبتي ثانية فوق", muscleAr: "الأرداف والخلفية", muscleEn: "GLUTES · HAMSTRINGS", dot: [630, 1150] },
    { clip: "glutes/c3.mp4", start: 14.2, end: 18.6, title: "الركلة الخلفية", cue: "رجلك لورا وظهرك ثابت", muscleAr: "عضلة الأرداف الكبرى", muscleEn: "GLUTEUS MAXIMUS", dot: [450, 1000] },
    { clip: "glutes/c4.mp4", start: 18.6, end: 22.4, title: "سكوات السومو", cue: "رجولك واسعة وانزلي بهدوء", muscleAr: "الأرداف والفخذ الداخلية", muscleEn: "GLUTES · ADDUCTORS", dot: [400, 1110] },
    { clip: "glutes/c5.mp4", start: 22.4, end: 27.0, title: "فاير هايدرنت", cue: "ركبتك على الجنب وانزلي ببطء", muscleAr: "الأرداف الجانبية", muscleEn: "GLUTEUS MEDIUS", dot: [510, 1080] },
  ],
  cta: { start: 27.0, image: "glutes/kf/hook.png", question: "تبين خطة كاملة تمشين عليها؟", line: "خطط تمارين + حساب سعراتك", trial: "جرّبيه مجانًا ٧ أيام" },
  vo: AT.map((at, i) => ({ src: `glutes/vo_${i}.wav`, at, len: VO_LEN[i] })),
  music: { src: "fit/music_cut.mp3", volume: 0.36, duck: 0.2 },
  sfx: "glutes/sfx.wav",
};
