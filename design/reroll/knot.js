'use strict';

let knotGL = null;
let knotCPU = null;

function knotPoint(t) {
  const p = 2;
  const q = 3;
  const a = t * TAU;
  return [
    (2 + Math.cos(q * a)) * Math.cos(p * a),
    (2 + Math.cos(q * a)) * Math.sin(p * a),
    Math.sin(q * a),
  ];
}
function knotTangent(t) {
  const e = 0.001;
  const a = knotPoint(Math.max(0, t - e));
  const b = knotPoint(Math.min(1, t + e));
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  return [d[0] / l, d[1] / l, d[2] / l];
}
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function knotStrips(N, K, R) {
  const strips = [];
  for (let k = 0; k <= K; k++) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const P = knotPoint(t);
      let off = [0, 0, 0];
      if (k > 0) {
        const T = knotTangent(t);
        const Nv = vnorm(vcross(T, [0, 0, 1]));
        const B = vcross(T, Nv);
        const phi = ((k - 1) / (K - 1)) * TAU + t * TAU * 1.5;
        for (let c = 0; c < 3; c++) off[c] = R * (Math.cos(phi) * Nv[c] + Math.sin(phi) * B[c]);
      }
      pts.push([(P[0] + off[0]) / 3, (P[1] + off[1]) / 3, (P[2] + off[2]) / 3, t + (k - 1) * 0.09]);
    }
    strips.push(pts);
  }
  return strips;
}

function initKnotGL() {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;

  const VS = `
attribute vec3 aPos;
attribute float aT;
uniform mat4 uMVP;
uniform float uTime;
uniform float uAmp;
varying float vT;
varying float vGlow;
void main() {
  vec3 p = aPos;
  float d = sin(p.x * 3.0 + uTime * 0.8) * sin(p.y * 4.0 - uTime * 0.6) * sin(p.z * 5.0 + uTime * 0.7);
  p += normalize(aPos + vec3(0.0001)) * d * uAmp;
  gl_Position = uMVP * vec4(p, 1.0);
  vT = aT;
  vGlow = 0.5 + 0.5 * d;
}`;

  const FS = `
precision mediump float;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uAlpha;
varying float vT;
varying float vGlow;
void main() {
  vec3 col = mix(uC1, uC2, fract(vT * 2.0));
  col = mix(col, uC3, smoothstep(0.55, 1.0, vT));
  gl_FragColor = vec4(col * (0.55 + 0.9 * vGlow), uAlpha);
}`;

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VS);
  const fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const N = 160;
  const K = 6;
  const strips = knotStrips(N, K, 0.3);
  const flat = [];
  for (const pts of strips) for (const p of pts) flat.push(p[0], p[1], p[2], p[3]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flat), gl.STATIC_DRAW);

  const sbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(strips[0].flat()), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aT = gl.getAttribLocation(prog, 'aT');
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aT);

  const uMVP = gl.getUniformLocation(prog, 'uMVP');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uAmp = gl.getUniformLocation(prog, 'uAmp');
  const uC1 = gl.getUniformLocation(prog, 'uC1');
  const uC2 = gl.getUniformLocation(prog, 'uC2');
  const uC3 = gl.getUniformLocation(prog, 'uC3');
  const uAlpha = gl.getUniformLocation(prog, 'uAlpha');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  const colors = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
  let alpha = 0.5;
  let W = 1;
  let H = 1;

  const m4mul = (a, b) => {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  };
  const perspective = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
  };
  const rotX = (a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  };
  const rotY = (a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  };
  const rotZ = (a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };
  const trans = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

  return {
    setColors(rgbs) {
      colors[0] = rgbs[0];
      colors[1] = rgbs[1];
      colors[2] = rgbs[2];
    },
    setSize(w, h, dpr) {
      W = w;
      H = h;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(t, mx, my, speed) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const aspect = W / H;
      const P = perspective(0.8, aspect, 0.1, 100);
      const V = trans(0, 0, -3.6);
      const M = m4mul(rotY(t * 0.25 * speed + mx * 1.1), m4mul(rotX(t * 0.14 * speed + my * 0.8), rotZ(Math.sin(t * 0.1) * 0.2)));
      const MVP = m4mul(P, m4mul(V, M));
      gl.uniformMatrix4fv(uMVP, false, MVP);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uAmp, 0.13 + speed * 0.05);
      gl.uniform3fv(uC1, colors[0]);
      gl.uniform3fv(uC2, colors[1]);
      gl.uniform3fv(uC3, colors[2]);
      gl.uniform1f(uAlpha, alpha);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(aT, 1, gl.FLOAT, false, 16, 12);
      for (let s = 0; s <= K; s++) gl.drawArrays(gl.LINE_STRIP, s * N, N);

      gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(aT, 1, gl.FLOAT, false, 16, 12);
      gl.drawArrays(gl.POINTS, 0, N);
    },
  };
}

function initKnotCPU() {
  const N = 120;
  const K = 4;
  const strips = knotStrips(N, K, 0.3);
  const colors = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
  let W = 1;
  let H = 1;
  return {
    setColors(rgbs) {
      colors[0] = rgbs[0];
      colors[1] = rgbs[1];
      colors[2] = rgbs[2];
    },
    setSize(w, h) {
      W = w;
      H = h;
    },
    render(t, mx, my, speed, c) {
      const cx = W / 2;
      const cy = H / 2;
      const s = Math.min(W, H) * 0.16;
      const ry = t * 0.25 * speed + mx * 1.1;
      const rx = t * 0.14 * speed + my * 0.8;
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const f = 300;
      for (let st = 0; st < strips.length; st++) {
        const pts = strips[st];
        let prev = null;
        for (let i = 0; i < N; i++) {
          const p = pts[i];
          const x1 = p[0] * cosY + p[2] * sinY;
          const z1 = -p[0] * sinY + p[2] * cosY;
          const y1 = p[1] * cosX - z1 * sinX;
          const z2 = p[1] * sinX + z1 * cosX;
          const persp = f / (f + z2 * 100);
          const sx = cx + x1 * s * persp;
          const sy = cy + y1 * s * persp;
          if (prev) {
            const depth = clamp(1 - (z2 + 1) / 2.4, 0.1, 1);
            const ci = Math.floor(clamp(p[3], 0, 0.999) * 3) % 3;
            c.strokeStyle = rgba(colors[ci], 0.3 * depth);
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(prev[0], prev[1]);
            c.lineTo(sx, sy);
            c.stroke();
          }
          prev = [sx, sy];
        }
      }
    },
  };
}

try {
  knotGL = initKnotGL();
} catch (e) {
  knotGL = null;
}
if (!knotGL) knotCPU = initKnotCPU();
