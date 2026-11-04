import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// "The shoulder muscle you're neglecting" — rear delts + reverse fly, promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini · VO: Sadaltager (Gemini).
export const REARDELT: ReelConfig = {
  duration: 37.5,
  brand: GRAMS,
  hook: { video: "reardelt/c1.mp4", clipLen: 5, end: 7.3, small: "عضلة كتفك اللي", big: "مهملها", mark: "!", sub: "وهي سر الأكتاف الأعرض", sub2: { at: 3.4, text: "الكتف الخلفي" }, shift: 380 },
  exercises: [
    { clip: "reardelt/c2.mp4", clipLen: 7, start: 7.3, end: 15.4, title: "الريفيرس فلاي", cue: "انحني، ثبّت ظهرك، وتحكّم", muscleAr: "الدالية الخلفية", muscleEn: "REAR DELTOID", dot: [420, 740] },
    { clip: "reardelt/c3.mp4", clipLen: 8, start: 15.4, end: 23.5, title: "من خلف الكتف", cue: "بدون رمي الوزن أو ترجيح", muscleAr: "الدالية الخلفية + أعلى الظهر", muscleEn: "REAR DELTS · RHOMBOIDS", dot: [400, 760] },
  ],
  outro: { image: "reardelt/kf/top.png", start: 23.5, end: 30.6, small: "إذا أهملتها…", big: "أكتافك بيبقى\nفيها نقص", sub: "احفظ الفيديو وجرّبه" },
  cta: { start: 30.6, image: "reardelt/kf/hook.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "reardelt/vo.wav", at: 0.3, len: 29.96 },
    { src: GRAMS_CTA.vo, at: 30.9, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "reardelt/sfx.wav",
};
