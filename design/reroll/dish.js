'use strict';

const dish = document.getElementById('dish');
const ctx = dish.getContext('2d');
let W = 0;
let H = 0;
let DPR = 1;

const specimens = SECTIONS.map((sec, i) => ({
  ...sec,
  idx: i,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 90,
  shape: 'blob',
  sides: 5,
  ph: Math.random() * TAU,
  ph2: Math.random() * TAU,
  squash: 0,
  squashAng: 0,
  hs: 0,
  hover: false,
  dragging: false,
  grabDX: 0,
  grabDY: 0,
  c1: '#ffffff',
  c2: '#ffffff',
  stroke: '#ffffff',
}));

const particles = [];
const wells = [];
let speech = null;
let nextSpeech = 6;

function sizeSpecimens() {
  const base = clamp(Math.min(W, H) / 10, 44, 104);
  for (const s of specimens) s.r = base * s.size;
}

function recolorSpecimens() {
  const id = state.ident;
  const order = [0, 1, 2, 0, 2, 1];
  specimens.forEach((s, i) => {
    s.shape = id.shapes[i % id.shapes.length];
    s.sides = 5 + (i % 3);
    s.c1 = id.accents[order[i % order.length]].css;
    s.c2 = id.accents[(i + 1) % 3].css;
    s.stroke = hsl(id.accents[i % 3].h, id.accents[i % 3].s, 0.78, 0.55);
  });
}

function placeSpecimens() {
  sizeSpecimens();
  const cx = W / 2;
  const cy = H * 0.5;
  const R0 = Math.min(W, H) * 0.34;
  specimens.forEach((s, i) => {
    const a = (i / specimens.length) * TAU - Math.PI / 2;
    s.x = cx + Math.cos(a) * (R0 + (i % 2) * 46);
    s.y = cy + Math.sin(a) * (R0 + (i % 2) * 46) * 0.92;
    s.vx = (Math.random() - 0.5) * 2;
    s.vy = (Math.random() - 0.5) * 2;
  });
  for (let k = 0; k < 90; k++) stepPhysics(1 / 60, 0);
}

function hitWall(s, ang) {
  const sp = Math.hypot(s.vx, s.vy);
  if (sp > 2) {
    s.squash = Math.min(1, s.squash + sp * 0.05);
    s.squashAng = ang;
    sparks(s.x, s.y, 4);
    blip(120 + sp * 30, 0.04, 0.08);
    state.entropy = clamp(state.entropy + 0.01, 0, 1);
  }
}

function stepPhysics(dt, t) {
  const n = specimens.length;
  const cx = W / 2;
  const cy = H * 0.5;
  const ring = state.arrange === 'ring';
  const motion = state.motion;
  const p = state.pointer;

  for (const s of specimens) {
    if (s.dragging) continue;
    if (ring) {
      const i = s.idx;
      const a = i * (TAU / n) + (motion ? t * 0.05 : 0);
      const R0 = Math.min(W, H) * 0.34;
      const tx = cx + Math.cos(a) * (R0 + (i % 2) * 46);
      const ty = cy + Math.sin(a) * (R0 + (i % 2) * 46) * 0.92;
      s.vx += (tx - s.x) * 0.045;
      s.vy += (ty - s.y) * 0.045;
      s.vx *= 0.86;
      s.vy *= 0.86;
    } else {
      if (motion) {
        s.vx += Math.sin(t * 0.6 + s.ph) * 0.05;
        s.vy += Math.cos(t * 0.5 + s.ph2) * 0.05;
      }
      s.vx += (cx - s.x) * 0.0006;
      s.vy += (cy - s.y) * 0.0006;
      if (state.surge > 0) {
        const ga = t * 1.7;
        s.vx += Math.cos(ga + s.ph) * 0.12;
        s.vy += Math.sin(ga * 1.3 + s.ph2) * 0.12;
      }
      s.vx *= 0.985;
      s.vy *= 0.985;
    }
    if (!ring && p.x > -100) {
      const dx = s.x - p.x;
      const dy = s.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 150 && d > 0.1) {
        const f = (1 - d / 150) * (0.22 + Math.hypot(p.vx, p.vy) * 0.02);
        s.vx += (dx / d) * f;
        s.vy += (dy / d) * f;
      }
    }
    s.x += s.vx;
    s.y += s.vy;
    const m = s.r * 0.85;
    if (s.x < m) {
      s.x = m;
      if (s.vx < 0) {
        hitWall(s, 0);
        s.vx = -s.vx * 0.82;
      }
    }
    if (s.x > W - m) {
      s.x = W - m;
      if (s.vx > 0) {
        hitWall(s, Math.PI);
        s.vx = -s.vx * 0.82;
      }
    }
    if (s.y < m) {
      s.y = m;
      if (s.vy < 0) {
        hitWall(s, -Math.PI / 2);
        s.vy = -s.vy * 0.82;
      }
    }
    if (s.y > H - m) {
      s.y = H - m;
      if (s.vy > 0) {
        hitWall(s, Math.PI / 2);
        s.vy = -s.vy * 0.82;
      }
    }
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > 16) {
      s.vx *= 16 / sp;
      s.vy *= 16 / sp;
    }
  }

  if (!ring) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = specimens[i];
        const b = specimens[j];
        if (a.dragging && b.dragging) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = (a.r + b.r) * 0.92;
        if (d < min && d > 0.01) {
          const nx = dx / d;
          const ny = dy / d;
          const ov = (min - d) / 2;
          const wa = b.dragging ? 0 : 1;
          const wb = a.dragging ? 0 : 1;
          const tot = wa + wb || 1;
          a.x -= nx * ov * 2 * (wa / tot);
          a.y -= ny * ov * 2 * (wa / tot);
          b.x += nx * ov * 2 * (wb / tot);
          b.y += ny * ov * 2 * (wb / tot);
          const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rvn < 0) {
            const e = 0.85;
            const jimp = (-(1 + e) * rvn) / 2;
            a.vx -= jimp * nx * wa;
            a.vy -= jimp * ny * wa;
            b.vx += jimp * nx * wb;
            b.vy += jimp * ny * wb;
            const impact = -rvn;
            if (impact > 1.4) {
              a.squash = Math.min(1, a.squash + impact * 0.12);
              b.squash = Math.min(1, b.squash + impact * 0.12);
              a.squashAng = Math.atan2(ny, nx);
              b.squashAng = Math.atan2(ny, nx);
              sparks((a.x + b.x) / 2, (a.y + b.y) / 2, Math.min(14, (impact * 2) | 0));
              blip(160 + impact * 55, 0.05, Math.min(0.2, impact * 0.03));
              state.entropy = clamp(state.entropy + impact * 0.012, 0, 1);
            }
          }
        }
      }
    }
  }

  for (const s of specimens) {
    s.squash *= 0.9;
    s.hs += ((s.hover ? 1 : 0) - s.hs) * 0.15;
  }

  for (let i = wells.length - 1; i >= 0; i--) {
    const w = wells[i];
    w.t += dt;
    if (w.t > w.dur) {
      wells.splice(i, 1);
      continue;
    }
    const str = (1 - w.t / w.dur) * 1.6;
    for (const s of specimens) {
      if (s.dragging) continue;
      const dx = w.x - s.x;
      const dy = w.y - s.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2) || 1;
      const f = Math.min((str * 900) / (d2 + 900), 1.4);
      s.vx += (dx / d) * f;
      s.vy += (dy / d) * f;
    }
  }
}

function sparks(x, y, count) {
  if (!state.motion) return;
  const id = state.ident;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const sp = 1 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      col: id.accents[i % 3].css,
      glyph: Math.random() < 0.25 ? id.glyph : null,
    });
  }
}

function glyphBurst(x, y) {
  const chars = '01<>{}#$%&*+≠∴~';
  const id = state.ident;
  for (let i = 0; i < 42; i++) {
    const a = Math.random() * TAU;
    const sp = 1 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1.5,
      life: 1.6,
      col: id.accents[i % 3].css,
      glyph: chars[Math.floor(Math.random() * chars.length)],
    });
  }
}

function stepParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt * 1.4;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function stepSpeech(dt) {
  if (!state.motion) return;
  nextSpeech -= dt;
  if (nextSpeech <= 0 && !speech) {
    const s = specimens[Math.floor(Math.random() * specimens.length)];
    speech = {
      text: LINES[Math.floor(Math.random() * LINES.length)],
      t: 0,
      dur: 2.6,
      s,
    };
    nextSpeech = 8 + Math.random() * 8;
  }
  if (speech) {
    speech.t += dt;
    if (speech.t > speech.dur) speech = null;
  }
}

function drawPattern(t) {
  const p = state.ident.pattern;
  const id = state.ident;
  if (p === 'rings') {
    const cx = W / 2;
    const cy = H * 0.46;
    const maxR = Math.hypot(W, H) * 0.6;
    for (let i = 0; i < 16; i++) {
      const rad = (t * 14 + i * (maxR / 16)) % maxR;
      ctx.strokeStyle = hsl(id.accents[0].h, id.accents[0].s, 0.7, 0.05 * (1 - rad / maxR));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, TAU);
      ctx.stroke();
    }
  } else if (p === 'dots') {
    const gap = 46;
    const ox = state.pointer.x * 0.012;
    const oy = state.pointer.y * 0.012;
    ctx.fillStyle = hsl(id.H, 0.1, 0.8, 0.05);
    for (let x = gap / 2 + (ox % gap); x < W; x += gap) {
      for (let y = gap / 2 + (oy % gap); y < H; y += gap) {
        ctx.fillRect(x, y, 1.4, 1.4);
      }
    }
  } else if (p === 'scan') {
    ctx.fillStyle = hsl(id.H, 0.1, 0.8, 0.028);
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    const by = (t * 70) % (H + 240) - 120;
    const a = id.accents[1];
    const g = ctx.createLinearGradient(0, by - 60, 0, by + 60);
    g.addColorStop(0, hsl(a.h, a.s, a.l, 0));
    g.addColorStop(0.5, hsl(a.h, a.s, a.l, 0.06));
    g.addColorStop(1, hsl(a.h, a.s, a.l, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, by - 60, W, 120);
  }
}

function roundRectPath(x, y, w, h, rad) {
  rad = Math.min(rad, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function shapePath(s, t) {
  const r = s.r;
  ctx.beginPath();
  if (s.shape === 'blob') {
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * TAU;
      const rr = r * (1 + 0.1 * Math.sin(3 * a + s.ph) + 0.06 * Math.sin(5 * a - t * 0.7 + s.ph2));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  } else if (s.shape === 'poly') {
    for (let i = 0; i <= s.sides; i++) {
      const a = (i / s.sides) * TAU - Math.PI / 2;
      const rr = r * (1 + 0.07 * Math.sin(i * 2.7 + s.ph));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  } else if (s.shape === 'pill') {
    roundRectPath(-r * 0.95, -r * 0.58, r * 1.9, r * 1.16, r * 0.58);
  } else {
    roundRectPath(-r * 1.15, -r * 0.45, r * 2.3, r * 0.9, r * 0.18);
  }
}

function fitFont(text, maxW, weight, base, family) {
  let px = base;
  ctx.font = weight + ' ' + px + 'px ' + family;
  let guard = 0;
  while (ctx.measureText(text).width > maxW && px > 8 && guard++ < 20) {
    px -= 1;
    ctx.font = weight + ' ' + px + 'px ' + family;
  }
  return px;
}

function drawSpecimen(s, t) {
  const id = state.ident;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.squashAng);
  ctx.scale(1 + 0.2 * s.squash, 1 - 0.16 * s.squash);
  ctx.rotate(-s.squashAng);
  const sc = 1 + 0.07 * s.hs + 0.04 * s.squash;
  ctx.scale(sc, sc);

  shapePath(s, t);
  ctx.shadowColor = s.c1;
  ctx.shadowBlur = 28;
  const g = ctx.createLinearGradient(-s.r, -s.r, s.r, s.r);
  g.addColorStop(0, s.c1);
  g.addColorStop(1, s.c2);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = s.stroke;
  ctx.stroke();

  shapePath(s, t);
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.globalAlpha = 1;

  const maxW = s.r * (s.shape === 'bar' ? 1.9 : 1.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(s.title, maxW, 700, s.r * 0.3, id.displayStack);
  ctx.fillStyle = 'rgba(8,8,14,0.88)';
  ctx.fillText(s.title, 0, -s.r * 0.04);
  fitFont(s.sub.toUpperCase(), maxW, 400, s.r * 0.13, id.monoStack);
  ctx.fillStyle = 'rgba(8,8,14,0.55)';
  ctx.fillText(s.sub.toUpperCase(), 0, s.r * 0.24);
  const idxPx = Math.max(8, s.r * 0.11);
  ctx.font = '700 ' + idxPx + 'px ' + id.monoStack;
  ctx.fillStyle = 'rgba(8,8,14,0.6)';
  ctx.fillText('0' + (s.idx + 1), 0, -s.r * (s.shape === 'bar' ? 0.3 : 0.44));
  ctx.restore();
}

function drawDish(t) {
  ctx.clearRect(0, 0, W, H);
  if (knotCPU) {
    const p = state.pointer;
    knotCPU.render(t, (p.x / W) * 2 - 1, -((p.y / H) * 2 - 1), state.motion ? (state.surge > 0 ? 3 : 1) : 0.12, ctx);
  }
  drawPattern(t);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const w of wells) {
    const pr = w.t / w.dur;
    for (let k = 0; k < 3; k++) {
      const rp = pr * 1.6 - k * 0.18;
      if (rp <= 0) continue;
      const a = state.ident.accents[1];
      ctx.strokeStyle = hsl(a.h, a.s, 0.7, 0.25 * (1 - rp / 1.6));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, rp * 140, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();

  const order = [...specimens].sort((a, b) => a.y - b.y);
  for (const s of order) drawSpecimen(s, t);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1);
    if (p.glyph) {
      ctx.font = '700 13px ' + state.ident.monoStack;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.col;
      ctx.fillText(p.glyph, p.x, p.y);
    } else {
      ctx.strokeStyle = p.col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  if (speech) {
    const a = clamp(Math.min(speech.t * 4, (speech.dur - speech.t) * 2), 0, 1);
    ctx.globalAlpha = a * 0.9;
    ctx.font = 'italic 400 13px ' + state.ident.displayStack;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.ident.dim;
    ctx.fillText('“' + speech.text + '”', speech.s.x, speech.s.y - speech.s.r * 0.85);
    ctx.globalAlpha = 1;
  }
}

function specimenAt(x, y) {
  const order = [...specimens].sort((a, b) => b.y - a.y);
  for (const s of order) {
    if (Math.hypot(x - s.x, y - s.y) < s.r) return s;
  }
  return null;
}

let dragSpec = null;
let downX = 0;
let downY = 0;
let downT = 0;
let moved = 0;

dish.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  dish.setPointerCapture(e.pointerId);
  const x = e.clientX;
  const y = e.clientY;
  state.pointer.down = true;
  state.pointer.x = x;
  state.pointer.y = y;
  downX = x;
  downY = y;
  downT = performance.now();
  moved = 0;
  const s = specimenAt(x, y);
  if (s) {
    dragSpec = s;
    s.dragging = true;
    s.grabDX = s.x - x;
    s.grabDY = s.y - y;
    blip(300, 0.03, 0.05);
  }
});

dish.addEventListener('pointermove', (e) => {
  const x = e.clientX;
  const y = e.clientY;
  const p = state.pointer;
  p.vx = lerp(p.vx, x - p.x, 0.5);
  p.vy = lerp(p.vy, y - p.y, 0.5);
  p.x = x;
  p.y = y;
  if (dragSpec) {
    moved = Math.max(moved, Math.hypot(x - downX, y - downY));
    const tx = x + dragSpec.grabDX;
    const ty = y + dragSpec.grabDY;
    dragSpec.vx += (tx - dragSpec.x) * 0.28;
    dragSpec.vy += (ty - dragSpec.y) * 0.28;
    dragSpec.vx *= 0.72;
    dragSpec.vy *= 0.72;
    dragSpec.x += dragSpec.vx;
    dragSpec.y += dragSpec.vy;
    dish.style.cursor = 'grabbing';
  } else {
    const hov = specimenAt(x, y);
    for (const s of specimens) s.hover = s === hov;
    dish.style.cursor = hov ? 'grab' : 'crosshair';
  }
});

function endPointer(e) {
  state.pointer.down = false;
  dish.style.cursor = 'crosshair';
  for (const s of specimens) s.hover = false;
  if (dragSpec) {
    const s = dragSpec;
    s.dragging = false;
    dragSpec = null;
    const sp = Math.hypot(s.vx, s.vy);
    if (moved < 8 && performance.now() - downT < 600) {
      s.vx *= 0.3;
      s.vy *= 0.3;
      openSection(s.id);
    } else if (sp > 3) {
      s.squash = Math.min(1, 0.4 + sp * 0.04);
      s.squashAng = Math.atan2(s.vy, s.vx);
      state.entropy = clamp(state.entropy + sp * 0.02, 0, 1);
    }
  }
}
dish.addEventListener('pointerup', endPointer);
dish.addEventListener('pointercancel', endPointer);

dish.addEventListener('dblclick', (e) => {
  wells.push({ x: e.clientX, y: e.clientY, t: 0, dur: 2.4 });
  blip(90, 0.15, 0.15);
  state.entropy = clamp(state.entropy + 0.08, 0, 1);
});
