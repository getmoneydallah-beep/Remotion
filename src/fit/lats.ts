import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// "Training back… but your arm does all the work?" — single-arm dumbbell row fix, promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini · VO: Sadaltager (Gemini).
export const LATS: ReelConfig = {
  duration: 36.7,
  brand: GRAMS,
  hook: {
    video: "lats/c1.mp4",
    clipLen: 5,
    end: 7.2,
    small: "تتمرّن ظهر… بس الشغل",
    big: "على يدك",
    mark: "؟!",
    sub: "تسحب الدمبل كأنك تسوي كيرل",
    sub2: { at: 3.1, text: "الخطأ: السحب بالبايسبس" },
    shift: 320,
  },
  exercises: [
    {
      clip: "lats/c2.mp4",
      clipLen: 8,
      start: 7.2,
      end: 14.6,
      title: "اسحب مرفقك لوركك",
      cue: "مو ترفع الدمبل بيدك",
      muscleAr: "العضلة الظهرية العريضة",
      muscleEn: "LATISSIMUS DORSI",
      dot: [540, 800],
    },
    {
      clip: "lats/c3.mp4",
      clipLen: 9,
      start: 14.6,
      end: 23.5,
      title: "ثبّت ظهرك… لا تلف",
      cue: "خلك متحكّم بالحركة",
      muscleAr: "اللاتس + الرومبويد",
      muscleEn: "LATS · RHOMBOIDS · REAR DELTS",
      dot: [540, 800],
    },
  ],
  outro: {
    image: "lats/kf/end.png",
    start: 23.5,
    end: 29.8,
    small: "تحس يدك أكثر من ظهرك؟",
    big: "الغلط في\nمسار السحب",
    sub: "احفظ الفيديو وجرّبه في يوم الظهر",
  },
  cta: { start: 29.8, image: "lats/kf/top.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "lats/vo.wav", at: 0.3, len: 29.5 },
    { src: GRAMS_CTA.vo, at: 30.1, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "lats/sfx.wav",
};
