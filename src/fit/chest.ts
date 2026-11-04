import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// "You're training chest wrong" tips Reel — dumbbell bench press technique, promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini (Higgsfield)
// VO: one continuous Sadaltager take (Gemini TTS) + the standard Grams CTA line.
export const CHEST: ReelConfig = {
  duration: 42.5,
  brand: GRAMS,
  hook: { image: "chest/kf/setup.png", end: 8.5, small: "تتمرّن صدر", big: "غلط", mark: "!", sub: "وما تحس بعضلة الصدر؟", sub2: { at: 4.8, text: "المشكلة في طريقتك" }, shift: 200 },
  exercises: [
    { clip: "chest/c1.mp4", start: 8.5, end: 13.0, title: "ثبّت كتوفك", cue: "للخلف وتحت، وارفع صدرك شوي", muscleAr: "العضلة الصدرية الكبرى", muscleEn: "PECTORALIS MAJOR", dot: [600, 930] },
    { clip: "chest/c2.mp4", start: 13.0, end: 18.2, title: "لا تفتح أكواعك", cue: "زاوية الكوع بين ٤٥ و٦٠ درجة", muscleAr: "الصدر + الكتف الأمامي", muscleEn: "PECS · FRONT DELTS", dot: [420, 970] },
    { clip: "chest/c3.mp4", start: 18.2, end: 25.4, title: "انزل… وادفع", cue: "تمدد مريح، وقرّب يدينك شوي", muscleAr: "انقباض الصدر", muscleEn: "PEC CONTRACTION", dot: [470, 900] },
    { clip: "chest/c2.mp4", start: 25.4, end: 28.0, title: "لا ترفع كتوفك", cue: "كتوفك ثابتة طول الحركة", muscleAr: "ثبات الكتف", muscleEn: "SHOULDER STABILITY", dot: [300, 1000], zoom: 1.3, origin: "45% 45%" },
  ],
  outro: { image: "chest/kf/top.png", start: 28.0, end: 35.6, small: "تذكّر…", big: "مو كل ما زدت الوزن\nتتمرّن صح", sub: "التحكم أهم من الوزن" },
  cta: { start: 35.6, image: "chest/kf/top.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "chest/vo.wav", at: 0.3, len: 34.96 },
    { src: GRAMS_CTA.vo, at: 35.9, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "chest/sfx.wav",
};
