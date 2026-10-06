'use strict';

let AC = null;
let master = null;

function ensureAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = 0.5;
    master.connect(AC.destination);
  } catch (e) {
    AC = null;
  }
}

function blip(freq, dur = 0.06, gain = 0.1) {
  if (!state.sound || !AC) return;
  if (AC.state === 'suspended') AC.resume();
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, AC.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), AC.currentTime + dur);
  g.gain.setValueAtTime(gain, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(AC.currentTime + dur + 0.02);
}

const overlay = document.getElementById('overlay');
const ovKicker = document.getElementById('ovKicker');
const ovTitle = document.getElementById('ovTitle');
const ovBody = document.getElementById('ovBody');
let openId = null;

function openSection(id) {
  const sec = SECTIONS.find((s) => s.id === id);
  if (!sec) return;
  openId = id;
  ovKicker.textContent = sec.kicker;
  ovTitle.innerHTML = sec.headline;
  ovBody.innerHTML = sec.html.replace(
    '0xSEED',
    '0x' + state.seed.toString(16).padStart(6, '0')
  );
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  state.timeScaleTarget = 0.3;
  const cta = ovBody.querySelector('.seedcta');
  if (cta) cta.addEventListener('click', reroll);
  const form = ovBody.querySelector('.brief');
  if (form) {
    const input = form.querySelector('input');
    const btn = form.querySelector('button');
    const status = ovBody.querySelector('.briefstatus');
    const submit = () => {
      const v = input.value.trim();
      if (!v) {
        input.focus();
        return;
      }
      status.textContent = 'brief received — expect weirdness within 24h.';
      input.value = '';
      glyphBurst(W / 2, H / 2);
      blip(520, 0.08, 0.12);
      setTimeout(() => blip(780, 0.08, 0.1), 90);
      state.entropy = clamp(state.entropy + 0.25, 0, 1);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      e.stopPropagation();
    });
  }
}

function closeOverlay() {
  if (!openId) return;
  openId = null;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  state.timeScaleTarget = 1;
}

overlay.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeOverlay();
});

function reroll() {
  state.seed = (Math.random() * 0xffffff) | 0;
  state.ident = genIdentity(state.seed);
  applyIdentity();
  history.replaceState(null, '', '#s=' + state.seed.toString(16));
  for (const s of specimens) {
    s.vx += (Math.random() - 0.5) * 8;
    s.vy += (Math.random() - 0.5) * 8;
  }
  blip(440, 0.06, 0.1);
  setTimeout(() => blip(660, 0.06, 0.08), 70);
}

function toggleArrange() {
  state.arrange = state.arrange === 'free' ? 'ring' : 'free';
  document.getElementById('arrangeBtn').textContent = '◐ arrange: ' + state.arrange;
}

function toggleSound() {
  state.sound = !state.sound;
  document.getElementById('soundBtn').textContent = '♪ audio: ' + (state.sound ? 'on' : 'off');
  if (state.sound) ensureAudio();
}

function toggleMotion() {
  state.motion = !state.motion;
  document.getElementById('motionBtn').textContent = '✦ motion: ' + (state.motion ? 'on' : 'off');
}

document.getElementById('rerollBtn').addEventListener('click', reroll);
document.getElementById('arrangeBtn').addEventListener('click', toggleArrange);
document.getElementById('soundBtn').addEventListener('click', toggleSound);
document.getElementById('motionBtn').addEventListener('click', toggleMotion);

const entropyFill = document.getElementById('entropyFill');
const entropyLabel = document.getElementById('entropyLabel');
const entropyBox = document.querySelector('.entropy');

function stepEntropy(dt) {
  if (state.entropy >= 1 && state.surge <= 0) {
    state.surge = 3;
    entropyBox.classList.add('surge');
    entropyLabel.textContent = '!! signal surge';
    for (const s of specimens) {
      const a = Math.atan2(s.y - H / 2, s.x - W / 2) + (Math.random() - 0.5);
      s.vx += Math.cos(a) * 9;
      s.vy += Math.sin(a) * 9;
    }
    glyphBurst(W / 2, H / 2);
  }
  if (state.surge > 0) {
    state.surge -= dt;
    if (state.surge <= 0) {
      entropyBox.classList.remove('surge');
      state.entropy = 0.35;
    }
  }
  state.entropy = clamp(state.entropy - dt * 0.03, 0, 1);
  entropyFill.style.width = (state.entropy * 100).toFixed(1) + '%';
  if (state.surge <= 0) entropyLabel.textContent = 'entropy ' + state.entropy.toFixed(2);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 'r') reroll();
  else if (k === 'a') toggleArrange();
  else if (k === 's') toggleSound();
  else if (k === 'm') toggleMotion();
});

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  dish.width = Math.max(1, Math.round(W * DPR));
  dish.height = Math.max(1, Math.round(H * DPR));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (knotGL) knotGL.setSize(W, H, DPR);
  if (knotCPU) knotCPU.setSize(W, H);
  sizeSpecimens();
  for (const s of specimens) {
    s.x = clamp(s.x, s.r * 0.5, W - s.r * 0.5);
    s.y = clamp(s.y, s.r * 0.5, H - s.r * 0.5);
  }
}
window.addEventListener('resize', resize);

if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  state.motion = false;
  state.arrange = 'ring';
  document.getElementById('motionBtn').textContent = '✦ motion: off';
  document.getElementById('arrangeBtn').textContent = '◐ arrange: ring';
}

let last = performance.now();
let simT = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  state.timeScale += (state.timeScaleTarget - state.timeScale) * 0.08;
  const sdt = dt * state.timeScale;
  simT += sdt;

  const speed = state.surge > 0 ? 3 : 1;
  const mx = (state.pointer.x / W) * 2 - 1;
  const my = -((state.pointer.y / H) * 2 - 1);
  if (knotGL) {
    knotGL.render(simT, mx, my, state.motion ? speed : 0.12);
  }

  stepPhysics(sdt, simT);
  stepParticles(sdt);
  stepSpeech(sdt);
  stepEntropy(dt);
  drawDish(simT);

  state.pointer.vx *= 0.8;
  state.pointer.vy *= 0.8;
}

(function init() {
  const hash = location.hash.match(/#s=([0-9a-f]+)/i);
  state.seed = hash ? parseInt(hash[1], 16) : (Math.random() * 0xffffff) | 0;
  state.ident = genIdentity(state.seed);
  if (!hash) history.replaceState(null, '', '#s=' + state.seed.toString(16));
  resize();
  applyIdentity();
  placeSpecimens();
  requestAnimationFrame(frame);
})();
