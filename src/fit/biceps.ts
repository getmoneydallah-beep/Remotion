import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// Biceps from three shoulder positions (behind / beside / in front of the body), promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini · VO: Sadaltager (Gemini).
export const BICEPS: ReelConfig = {
  duration: 40,
  brand: GRAMS,
  hook: { video: "biceps/c1.mp4", end: 4.4, small: "تتمرن بايسبس", big: "بنفس الحركة", sub: "جرّب هالثلاثة!", shift: 0 },
  exercises: [
    { clip: "biceps/c1b.mp4", clipLen: 8, start: 4.4, end: 12.3, title: "كيرل على البنش المائل", cue: "ذراعك خلف جسمك", muscleAr: "البايسبس بوضعية استطالة", muscleEn: "BICEPS · ARM BEHIND BODY", dot: [220, 830] },
    { clip: "biceps/c2.mp4", clipLen: 7, start: 12.3, end: 19.9, title: "الكيرل واقف", cue: "أكواعك ثابتة وبدون ترجيح", muscleAr: "البايسبس · الذراع بجانب الجسم", muscleEn: "BICEPS · ARM AT SIDE", dot: [800, 770] },
    { clip: "biceps/c3.mp4", clipLen: 8, start: 19.9, end: 25.7, title: "البريتشر كيرل", cue: "يسند ذراعك ويمنع الغش", muscleAr: "البايسبس · الذراع أمام الجسم", muscleEn: "BICEPS · ARM IN FRONT", dot: [380, 780] },
  ],
  outro: { image: "biceps/kf/preacher.png", start: 25.7, end: 33.0, small: "ثلاث زوايا مختلفة", big: "تمرين أذكى\nللبايسبس", sub: "احفظ الفيديو وجرّبها" },
  cta: { start: 33.0, image: "biceps/kf/incline.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "biceps/vo.wav", at: 0.3, len: 32.48 },
    { src: GRAMS_CTA.vo, at: 33.3, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "biceps/sfx.wav",
};
