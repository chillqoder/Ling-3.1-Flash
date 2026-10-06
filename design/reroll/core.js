'use strict';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

const hsl = (h, s, l, a = 1) => {
  const [r, g, b] = hslToRgb(h, s, l).map((v) => Math.round(v * 255));
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
};
const rgba = (rgb, a) => `rgba(${rgb.map((v) => Math.round(v * 255)).join(',')},${a})`;

const state = {
  seed: 0,
  ident: null,
  timeScale: 1,
  timeScaleTarget: 1,
  entropy: 0,
  surge: 0,
  arrange: 'free',
  sound: false,
  motion: true,
  pointer: { x: -999, y: -999, vx: 0, vy: 0, down: false },
};

function genIdentity(seed) {
  const rng = mulberry32(seed);
  const H = rng() * 360;
  const scheme = pick(rng, ['analog', 'triad', 'split', 'mono', 'comp']);
  let hues;
  if (scheme === 'analog') hues = [H, H + 32, H - 32];
  else if (scheme === 'triad') hues = [H, H + 120, H + 240];
  else if (scheme === 'split') hues = [H, H + 150, H + 210];
  else if (scheme === 'mono') hues = [H, H, H];
  else hues = [H, H + 180, H + 12];
  const accents = hues.map((h, i) => {
    const s = scheme === 'mono' ? [0.7, 0.45, 0.85][i] : 0.62 + rng() * 0.28;
    const l = 0.55 + rng() * 0.12;
    return { h, s, l, css: hsl(h, s, l), rgb: hslToRgb(h, s, l) };
  });
  const bgH = H + rng() * 40 - 20;
  const display = pick(rng, ['Space Grotesk', 'Instrument Serif', 'Space Mono']);
  const displayStack = {
    'Space Grotesk': `'Space Grotesk', 'Arial Narrow', system-ui, sans-serif`,
    'Instrument Serif': `'Instrument Serif', Georgia, serif`,
    'Space Mono': `'Space Mono', ui-monospace, monospace`,
  }[display];
  const shapes = ['blob', 'poly', 'pill', 'bar', 'blob', 'poly'];
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }
  const pattern = pick(rng, ['rings', 'dots', 'scan', 'none']);
  const panelRad = `${14 + rng() * 14}px ${8 + rng() * 10}px ${18 + rng() * 12}px ${10 + rng() * 8}px`;
  const markPts = [];
  const n = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = 38 + rng() * 10;
    markPts.push(`${(50 + Math.cos(a) * rr).toFixed(1)},${(50 + Math.sin(a) * rr).toFixed(1)}`);
  }
  const glyph = pick(rng, ['◆', '◈', '✦', '⬡', '●', '◉']);
  const [gr, gg, gb] = accents[0].rgb.map((v) => Math.round(v * 255));
  return {
    seed,
    H,
    scheme,
    accents,
    bg: hsl(bgH, 0.16 + rng() * 0.08, 0.06 + rng() * 0.03),
    bg2: hsl(bgH + 30, 0.2, 0.1 + rng() * 0.03),
    ink: hsl(H, 0.1, 0.93),
    dim: hsl(H, 0.08, 0.6),
    line: hsl(H, 0.12, 0.8, 0.14),
    glow: `rgba(${gr},${gg},${gb},0.10)`,
    display,
    displayStack,
    monoStack: `'Space Mono', ui-monospace, monospace`,
    shapes,
    pattern,
    panelRad,
    markPts,
    glyph,
  };
}

function applyIdentity() {
  const id = state.ident;
  const r = document.documentElement.style;
  r.setProperty('--bg', id.bg);
  r.setProperty('--bg2', id.bg2);
  r.setProperty('--ink', id.ink);
  r.setProperty('--dim', id.dim);
  r.setProperty('--a1', id.accents[0].css);
  r.setProperty('--a2', id.accents[1].css);
  r.setProperty('--a3', id.accents[2].css);
  r.setProperty('--line', id.line);
  r.setProperty('--glow', id.glow);
  r.setProperty('--display', id.displayStack);
  r.setProperty('--mono', id.monoStack);
  r.setProperty('--panel-rad', id.panelRad);
  document.getElementById('mark').innerHTML =
    `<svg viewBox="0 0 100 100"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${id.accents[0].css}"/><stop offset="1" stop-color="${id.accents[2].css}"/>` +
    `</linearGradient></defs><polygon points="${id.markPts.join(' ')}" fill="url(#lg)"/></svg>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="${id.markPts.join(' ')}" fill="${id.accents[0].css}"/></svg>`;
  document.getElementById('favicon').href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  const hex = '0x' + id.seed.toString(16).padStart(6, '0');
  document.getElementById('seedLabel').textContent = 'seed ' + hex;
  document.title = 'REROLL® — seed ' + hex;
  if (knotGL) knotGL.setColors(id.accents.map((a) => a.rgb));
  if (knotCPU) knotCPU.setColors(id.accents.map((a) => a.rgb));
  if (typeof recolorSpecimens === 'function') recolorSpecimens();
}
