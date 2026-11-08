import TL from "./timeline.json";

export const FPS = TL.fps;

type Scene = (typeof TL.scenes)[number] & { start: number };

export const SCENES: Scene[] = (() => {
  let start = 0;
  return TL.scenes.map((s) => {
    const out = { ...s, start };
    start += s.dur;
    return out;
  });
})();

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.dur, 0);

export const sceneT = (id: string): Scene => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
};

/** Scene-local frame at which a VO phrase starts (+ optional frame offset). */
export const mark = (id: string, key: string, offset = 0) => {
  const s = sceneT(id);
  const sec = (s.marks as unknown as Record<string, number>)[key];
  if (sec === undefined) throw new Error(`unknown mark ${id}.${key}`);
  return Math.round(s.voAt + sec * FPS) + offset;
};

export const marksFor = (id: string) => (key: string, offset = 0) => mark(id, key, offset);

export const MUSIC = TL.music;
