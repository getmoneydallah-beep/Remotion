import type { ReelConfig } from "./WorkoutReel";
import { GRAMS, GRAMS_CTA } from "./brand";

// "You train every day and your muscles don't grow?" — recovery explained on the biceps, promoting Grams.
// Script & visual direction supplied by the user. Keyframes: GPT Image 2.5 · Motion: Seedance 2.0 Mini · VO: Sadaltager (Gemini).
export const RECOVERY: ReelConfig = {
  duration: 37.8,
  brand: GRAMS,
  hook: {
    video: "recovery/c1.mp4",
    clipLen: 5,
    end: 5.9,
    small: "تتمرّن كل يوم",
    big: "وما تكبر",
    mark: "؟!",
    sub: "يمكن هذا السبب…",
    sub2: { at: 3.0, text: "ما تعطيها وقت تتعافى" },
    shift: 380,
  },
  exercises: [
    {
      clip: "recovery/c2.mp4",
      clipLen: 8,
      start: 5.9,
      end: 14.6,
      title: "النمو يصير وقت الراحة",
      cue: "راحة + تغذية + نوم كافي",
      muscleAr: "العضلة ذات الرأسين",
      muscleEn: "BICEPS BRACHII · RECOVERY",
      dot: [390, 700],
    },
    {
      clip: "recovery/c3.mp4",
      clipLen: 9,
      start: 14.6,
      end: 21.0,
      title: "الإجهاد أكبر من التعافي؟",
      cue: "ممكن يتأثر أداؤك وتقدّمك",
      muscleAr: "نظّم الحمل والتعافي",
      muscleEn: "TRAINING LOAD · RECOVERY",
      dot: [290, 760],
    },
  ],
  outro: {
    image: "recovery/kf/end.png",
    start: 21.0,
    end: 30.9,
    small: "العضلات ما تكبر بكثرة التمرين لحالها…",
    big: "تمرين صحيح +\nتعافي كافي",
    sub: "احفظ الفيديو وأرسله لخويك",
  },
  cta: { start: 30.9, image: "recovery/kf/flex.png", question: GRAMS_CTA.question, line: GRAMS_CTA.line, trial: GRAMS_CTA.trial },
  vo: [
    { src: "recovery/vo.wav", at: 0.3, len: 30.89 },
    { src: GRAMS_CTA.vo, at: 31.2, len: GRAMS_CTA.voLen },
  ],
  music: { src: "fit/music_cut.mp3", volume: 0.34, duck: 0.18 },
  sfx: "recovery/sfx.wav",
};
