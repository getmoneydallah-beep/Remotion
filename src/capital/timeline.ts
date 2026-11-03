// Single source of truth for story beats (seconds). scripts/make-audio2.js mirrors these formulas.

export const N_GRAINS = 20; // hand-carried deposits (5,000 SAR each → 100,000)
export const depositLand = (k: number) => (k === 0 ? 4.8 : 5.3 + (k - 1) * 0.27 + 0.03 * Math.sin(k * 2.3));
export const DEPOSIT_FLIGHT = 0.95;

export const M_FIELD = 90; // grains pulled in by gravity
export const captureTime = (j: number) => 12.0 + 4.7 * Math.pow((j + 1) / M_FIELD, 0.45);
export const SPIRAL = 2.0;

export const LATE_DEPOSITS = [12.4, 13.6, 14.8, 16.0]; // you keep saving, but you're outpaced

export const BEAD_SMALL_LAND = 19.6;
export const beadLargeLand = (i: number) => 19.75 + i * 0.13;
export const BEAD_FLIGHT = 0.6;

export const DOT_LAND = 28.35;
