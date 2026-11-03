import { continueRender, delayRender, staticFile } from "remotion";

export const AR = "'PlexArabic', sans-serif";
export const MONO = "'PlexMono', 'PlexArabic', monospace";

const ARABIC_RANGE =
  "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC";
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212, U+2215, U+FEFF, U+FFFD";

if (typeof document !== "undefined") {
  const handle = delayRender("Loading IBM Plex fonts");
  const faces: FontFace[] = [];
  for (const w of [200, 300, 400, 500, 600]) {
    faces.push(new FontFace("PlexArabic", `url(${staticFile(`fonts2/ibm-plex-sans-arabic-latin-${w}-normal.woff2`)}) format('woff2')`, { weight: String(w), unicodeRange: LATIN_RANGE }));
    faces.push(new FontFace("PlexArabic", `url(${staticFile(`fonts2/ibm-plex-sans-arabic-arabic-${w}-normal.woff2`)}) format('woff2')`, { weight: String(w), unicodeRange: ARABIC_RANGE }));
  }
  for (const w of [300, 400, 500]) {
    faces.push(new FontFace("PlexMono", `url(${staticFile(`fonts2/ibm-plex-mono-latin-${w}-normal.woff2`)}) format('woff2')`, { weight: String(w), unicodeRange: LATIN_RANGE }));
  }
  Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l))))
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
