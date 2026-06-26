// Deterministic palette generation + cover color extraction for book spines.

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Lighten (positive) or darken (negative) a hex color by a percent amount.
export function shade(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  return rgbToHex({ r: r + amt, g: g + amt, b: b + amt });
}

function luminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Stable per-book seed so the same title/author always lands on the same hue.
export function seedFor(book) {
  return hashString(`${book.title ?? ""}::${book.author ?? ""}`);
}

// Hash-derived palette for books with nothing to sample colors from
// (Kindle/Audible, or a physical book with no cover image).
export function generatedPalette(seed, format) {
  const hue = seed % 360;
  if (format === "kindle") {
    return {
      baseColor: hslToHex(hue, 24, 27),
      accentColor: hslToHex((hue + 200) % 360, 28, 56),
      textColor: hslToHex(hue, 10, 93),
    };
  }
  if (format === "audible") {
    return {
      baseColor: hslToHex(hue, 46, 25),
      accentColor: hslToHex((hue + 145) % 360, 55, 62),
      textColor: hslToHex(hue, 18, 95),
    };
  }
  return {
    baseColor: hslToHex(hue, 32, 30),
    accentColor: hslToHex((hue + 180) % 360, 38, 54),
    textColor: hslToHex(hue, 14, 92),
  };
}

// Samples a loaded <img> for its dominant + a contrasting secondary color.
// Returns null if the canvas is tainted (e.g. cover host blocks CORS).
export function extractCoverPalette(imgEl) {
  const w = 24;
  const h = 36;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, w, h);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    const entry = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    entry.r += r;
    entry.g += g;
    entry.b += b;
    entry.count += 1;
    buckets.set(key, entry);
  }

  const sorted = [...buckets.values()]
    .map((e) => ({ r: e.r / e.count, g: e.g / e.count, b: e.b / e.count, count: e.count }))
    .sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return null;

  const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  const base = sorted[0];
  const accent = sorted.find((c) => dist(c, base) > 60) ?? sorted[Math.min(1, sorted.length - 1)];

  const textColor = luminance(base) > 0.55 ? "#221d16" : "#f4ead7";
  return {
    baseColor: rgbToHex(base),
    accentColor: rgbToHex(accent),
    textColor,
  };
}

export { hashString };
