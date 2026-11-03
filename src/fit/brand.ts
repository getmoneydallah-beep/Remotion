import type { Brand } from "./WorkoutReel";

// Grams — Train & Eat. Colours sampled from the App Store icon.
export const GRAMS: Brand = {
  bg: "#0E1012", ink: "#F3F0E9", silver: "#A6ADB8", accent: "#DDA73F", green: "#135241",
  appName: "Grams", appTagline: "تمرّن وكُل بالأرقام", icon: "legs/icon.jpg",
  screenshots: ["brand/ar_home_x3.png", "brand/ar_workouts_x3.png", "brand/ar_progress_x3.png"],
};

// Standard app CTA (voice line recorded once in public/legs/vo_6.wav and reused by every Reel)
export const GRAMS_CTA = { question: "تبي خطة كاملة تمشي عليها؟", line: "خطط تمارين + حساب سعراتك", trial: "جرّبه مجانًا ٧ أيام", vo: "legs/vo_6.wav", voLen: 5.1 };
