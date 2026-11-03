import type { ReelConfig } from "./WorkoutReel";

// Legs Reel promoting Grams — Train & Eat. Clips: GPT Image 2.5 keyframes → Seedance 2.0 Mini (Higgsfield). VO: Gemini.
const VO_LEN = [3.33, 4.43, 3.95, 4.26, 3.96, 3.7, 5.1];
const STARTS = [0.25, 4.3, 9.7, 14.7, 19.9, 24.9, 29.7];

export const LEGS: ReelConfig = {
  duration: 37,
  brand: {
    bg: "#0E1012", ink: "#F3F0E9", silver: "#A6ADB8", accent: "#DDA73F", green: "#135241",
    appName: "Grams", appTagline: "تمرّن وكُل بالأرقام", icon: "legs/icon.jpg", screenshot: "legs/shot_workouts.png",
  },
  hook: { image: "legs/kf/hook.png", end: 4.0, small: "تبي رجول", big: "أقوى", sub: "٥ تمارين للأرجل" },
  exercises: [
    { clip: "legs/c1.mp4", start: 4.0, end: 9.4, title: "سكوات الدمبل", cue: "صدرك مرفوع، فخذك يوازي الأرض", muscleAr: "الفخذ الأمامية والألوية", muscleEn: "QUADS · GLUTES", dot: [440, 1060] },
    { clip: "legs/c2.mp4", start: 9.4, end: 14.4, title: "دفع الأرجل", cue: "ادفع بكعبك ولا تقفل ركبك", muscleAr: "عضلات الفخذ الأمامية", muscleEn: "QUADRICEPS", dot: [650, 950], zoom: 1.35, origin: "50% 25%" },
    { clip: "legs/c3.mp4", start: 14.4, end: 19.6, title: "الرفعة الرومانية", cue: "وركك لورا وظهرك مستقيم", muscleAr: "الخلفية والألوية", muscleEn: "HAMSTRINGS · GLUTES", dot: [500, 1150] },
    { clip: "legs/c4.mp4", start: 19.6, end: 24.6, title: "سكوات بلغاري", cue: "انزل بثبات على رجل وحدة", muscleAr: "الفخذ الأمامية والألوية", muscleEn: "QUADS · GLUTES", dot: [690, 1150] },
    { clip: "legs/c5.mp4", start: 24.6, end: 29.4, title: "رفع السمانة", cue: "اطلع على أصابعك وانزل ببطء", muscleAr: "عضلات السمانة", muscleEn: "CALVES", dot: [500, 1380], labelUp: true },
  ],
  cta: { start: 29.4, image: "legs/kf/hook.png", question: "تبي خطة كاملة تمشي عليها؟", line: "خطط تمارين + حساب سعراتك", trial: "جرّبه مجانًا ٧ أيام" },
  vo: STARTS.map((at, i) => ({ src: `legs/vo_${i}.wav`, at, len: VO_LEN[i] })),
  music: { src: "fit/music_cut.mp3", volume: 0.36, duck: 0.2 },
  sfx: "legs/sfx.wav",
};
