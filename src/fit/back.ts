import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// Back Reel, rebranded for Grams. Original Kling clips had a cobalt glow baked in;
// `grade` = #goldify colour matrix: shifts only blue-dominant pixels (the glow) to brand gold.
const VO_LEN = [3.79, 5.41, 4.49, 4.95, 3.38, 3.73];
const SHOT_STARTS = [0, 4.0, 10.2, 16.0, 22.0, 27.0];

export const BACK: ReelConfig = {
  duration: 40,
  brand: GRAMS,
  grade: "url(#goldify) sepia(0.12)",
  hook: { video: "fit/c_hook.mp4", end: 4.0, small: "تبي ظهر", big: "أعرض", sub: "٥ تمارين كيبل", shift: 300 },
  exercises: [
    { clip: "fit/c_wide.mp4", start: 4.0, end: 10.2, title: "السحب العالي الواسع", cue: "اسحب البار لأعلى صدرك", muscleAr: "العضلة الظهرية العريضة", muscleEn: "LATISSIMUS DORSI", dot: [430, 1000] },
    { clip: "fit/c_close.mp4", start: 10.2, end: 16.0, title: "السحب بقبضة ضيقة", cue: "أكواعك قريبة من جسمك", muscleAr: "أسفل الظهرية العريضة", muscleEn: "LOWER LATS", dot: [470, 1020] },
    { clip: "fit/c_straight.mp4", start: 16.0, end: 22.0, title: "السحب بذراع مستقيمة", cue: "يدينك مفرودة لين فخوذك", muscleAr: "العضلة الظهرية العريضة", muscleEn: "LATS", dot: [450, 880] },
    { clip: "fit/c_face.mp4", start: 22.0, end: 27.0, title: "سحب الوجه", cue: "اسحب لوجهك وافتح أكواعك", muscleAr: "الكتف الخلفي وأعلى الظهر", muscleEn: "REAR DELTS · TRAPS", dot: [380, 760] },
    { clip: "fit/c_onearm.mp4", start: 27.0, end: 32.4, title: "التجديف بيد وحدة", cue: "اسحب لخصرك وجسمك ثابت", muscleAr: "الظهرية العريضة ومنتصف الظهر", muscleEn: "LATS · MID-BACK", dot: [410, 915] },
  ],
  cta: { start: 32.4, image: "fit/kf/hook.jpg", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    ...SHOT_STARTS.map((s, i) => ({ src: `fit/vo_${i}.wav`, at: s + (i === 0 ? 0.25 : 0.3), len: VO_LEN[i] })),
    { src: GRAMS_CTA.vo, at: 32.7, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.36, duck: 0.2 },
  sfx: "fit/back_sfx.wav",
};
