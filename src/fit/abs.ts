import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// "You train abs every day… so why don't they show?" — reverse crunch + body-fat lesson, promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini · VO: Sadaltager (Gemini).
export const ABS: ReelConfig = {
  duration: 38.5,
  brand: GRAMS,
  hook: {
    video: "abs/c1.mp4",
    clipLen: 5,
    end: 8.0,
    small: "تتمرّن بطن",
    big: "كل يوم",
    mark: "؟",
    sub: "وليه ما طلعت عضلاتك؟!",
    sub2: { at: 3.6, text: "عضلاتك موجودة… بس مخفية" },
    shift: 0,
  },
  exercises: [
    {
      clip: "abs/c2.mp4",
      clipLen: 8,
      start: 8.0,
      end: 16.0,
      title: "الريفيرس كرنش",
      cue: "ارفع الحوض بتحكّم، بدون اندفاع",
      muscleAr: "عضلة البطن المستقيمة",
      muscleEn: "RECTUS ABDOMINIS",
      dot: [470, 990],
    },
    {
      clip: "abs/c3.mp4",
      clipLen: 9,
      start: 16.0,
      end: 23.6,
      title: "السر في نسبة الدهون",
      cue: "تمارين البطن لحالها ما تحرق دهون المنطقة",
      muscleAr: "قلّل دهون جسمك كامل",
      muscleEn: "BODY FAT % · NUTRITION",
      dot: [660, 1180],
    },
  ],
  outro: {
    image: "abs/kf/end.png",
    start: 23.6,
    end: 31.6,
    small: "السر مو ألف عدّة بطن…",
    big: "السر إنك تفهم\nكيف جسمك يشتغل",
    sub: "احفظ الفيديو وأرسله لخويك",
  },
  cta: { start: 31.6, image: "abs/kf/hook.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "abs/vo.wav", at: 0.3, len: 31.33 },
    { src: GRAMS_CTA.vo, at: 31.9, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "abs/sfx.wav",
};
