/**
 * Procedural placeholder art. Used only while assets-src/ is missing the Higgsfield files.
 * Renders an SVG "studio" scene with a stylised unbadged wedge supercar (nose left), LED ceiling,
 * cyan wall strip, shelf, roll-up door, polished floor, plus macro paint scenes (swirls, polish, bead).
 * Every parameter interpolates, so clips (dolly-in, polish sweep, bead, pull-back) become real camera moves.
 */

// ---------- utils ----------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const f = (n) => Math.round(n * 100) / 100;

// ---------- vehicle profiles (normalised: x 0..1 nose→tail, y = height above ground in car lengths) ----------
const PROFILES = {
  supercar: {
    top: [[0, 0.07], [0.004, 0.096], [0.05, 0.118], [0.2, 0.15], [0.335, 0.178], [0.47, 0.262], [0.585, 0.27], [0.72, 0.222], [0.88, 0.196], [0.962, 0.206], [0.994, 0.186], [1, 0.085]],
    glass: [[0.355, 0.183], [0.468, 0.253], [0.578, 0.26], [0.69, 0.212], [0.64, 0.19]],
    wheels: [0.19, 0.8], r: 0.072, sill: 0.05, belt: 0.17,
    intake: [[0.66, 0.15], [0.76, 0.16], [0.74, 0.08], [0.68, 0.085]],
  },
  suv: {
    top: [[0, 0.1], [0.008, 0.2], [0.08, 0.236], [0.26, 0.27], [0.345, 0.292], [0.44, 0.392], [0.56, 0.405], [0.92, 0.4], [0.985, 0.37], [1, 0.3], [1, 0.1]],
    glass: [[0.37, 0.3], [0.45, 0.383], [0.92, 0.385], [0.96, 0.31]],
    wheels: [0.18, 0.8], r: 0.085, sill: 0.08, belt: 0.29,
  },
  truck: {
    top: [[0, 0.1], [0.008, 0.25], [0.06, 0.28], [0.24, 0.3], [0.33, 0.312], [0.4, 0.42], [0.52, 0.43], [0.6, 0.42], [0.612, 0.312], [0.995, 0.312], [1, 0.1]],
    glass: [[0.36, 0.318], [0.41, 0.41], [0.585, 0.41], [0.592, 0.318]],
    wheels: [0.17, 0.8], r: 0.085, sill: 0.085, belt: 0.3,
  },
  sedan: {
    top: [[0, 0.08], [0.008, 0.15], [0.06, 0.176], [0.25, 0.205], [0.33, 0.216], [0.45, 0.305], [0.62, 0.31], [0.78, 0.24], [0.97, 0.226], [1, 0.19], [1, 0.08]],
    glass: [[0.355, 0.222], [0.458, 0.296], [0.62, 0.3], [0.74, 0.234]],
    wheels: [0.19, 0.79], r: 0.075, sill: 0.06, belt: 0.205,
  },
  coupe: {
    top: [[0, 0.08], [0.008, 0.14], [0.06, 0.17], [0.27, 0.2], [0.36, 0.21], [0.48, 0.295], [0.6, 0.3], [0.8, 0.222], [0.97, 0.21], [1, 0.18], [1, 0.08]],
    glass: [[0.385, 0.216], [0.49, 0.287], [0.6, 0.29], [0.75, 0.226]],
    wheels: [0.2, 0.8], r: 0.075, sill: 0.06, belt: 0.2,
  },
};

function spline(pts) {
  // Catmull-Rom → cubic Bézier
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function carGeometry(type, x0, gy, L) {
  const P = PROFILES[type];
  const X = (x) => x0 + x * L;
  const Y = (y) => gy - y * L;
  const top = P.top.map(([x, y]) => [X(x), Y(y)]);
  const ar = (P.r + 0.014) * L;
  const sillY = Y(P.sill);
  const [w1, w2] = P.wheels.map(X);
  let d = spline(top);
  d += ` L${f(X(0.985))} ${f(sillY)} L${f(w2 + ar)} ${f(sillY)} A${f(ar)} ${f(ar)} 0 0 0 ${f(w2 - ar)} ${f(sillY)}`;
  d += ` L${f(w1 + ar)} ${f(sillY)} A${f(ar)} ${f(ar)} 0 0 0 ${f(w1 - ar)} ${f(sillY)} L${f(X(0.015))} ${f(sillY)} Z`;
  const glass = "M" + P.glass.map(([x, y]) => `${f(X(x))} ${f(Y(y))}`).join(" L") + " Z";
  const intake = P.intake ? "M" + P.intake.map(([x, y]) => `${f(X(x))} ${f(Y(y))}`).join(" L") + " Z" : "";
  return { d, glass, intake, wheels: [w1, w2], wr: P.r * L, wy: Y(P.r), X, Y, L, belt: Y(P.belt), sillY, topY: Math.min(...top.map((p) => p[1])) };
}

function wheel(cx, cy, r, id, dirt) {
  let s = `<g>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#09090a"/>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.97)}" fill="none" stroke="#1d1d20" stroke-width="${f(r * 0.05)}"/>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.74)}" fill="url(#rim${id})"/>`;
  // caliper
  s += `<path d="M${f(cx - r * 0.5)} ${f(cy - r * 0.18)} A${f(r * 0.53)} ${f(r * 0.53)} 0 0 1 ${f(cx - r * 0.12)} ${f(cy - r * 0.52)}" stroke="#e8150b" stroke-width="${f(r * 0.17)}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360 - 90;
    s += `<rect x="${f(cx - r * 0.07)}" y="${f(cy - r * 0.7)}" width="${f(r * 0.14)}" height="${f(r * 0.62)}" rx="${f(r * 0.05)}" fill="#151517" stroke="#2c2c30" stroke-width="${f(r * 0.015)}" transform="rotate(${a + 90} ${f(cx)} ${f(cy)})"/>`;
  }
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.14)}" fill="#0d0d0f" stroke="#3a3a40" stroke-width="${f(r * 0.02)}"/>`;
  s += `<path d="M${f(cx - r * 0.6)} ${f(cy - r * 0.35)} A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(cx + r * 0.25)} ${f(cy - r * 0.66)}" stroke="rgba(255,255,255,.22)" stroke-width="${f(r * 0.025)}" fill="none"/>`;
  if (dirt > 0) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#5a4030" opacity="${f(0.55 * dirt)}"/>`;
  return s + `</g>`;
}

const PAINTS = {
  rosso: ["#ff4636", "#d4140b", "#6a0603"],
  grey: ["#8b9097", "#4a4e55", "#1c1e22"],
  white: ["#ffffff", "#d9dce0", "#7f858c"],
  black: ["#4a4d55", "#15161a", "#050506"],
  blue: ["#3d5fb8", "#16275c", "#070c22"],
};

function car(o, geo, id, r) {
  const { dirt = 0, ambient = 1, golden = 0, swirls = 0, paint = "rosso" } = o;
  const c = PAINTS[paint];
  let s = `<defs>
    <linearGradient id="paint${id}" x1="0" y1="${f(geo.topY)}" x2="0" y2="${f(geo.sillY)}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/>
    </linearGradient>
    <linearGradient id="glass${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3038"/><stop offset=".5" stop-color="#0b0d10"/><stop offset="1" stop-color="#181c22"/></linearGradient>
    <radialGradient id="rim${id}"><stop offset="0" stop-color="#1a1a1d"/><stop offset=".85" stop-color="#0e0e10"/><stop offset="1" stop-color="#2a2a2e"/></radialGradient>
    <clipPath id="body${id}"><path d="${geo.d}"/></clipPath>
  </defs>`;
  s += `<path d="${geo.d}" fill="url(#paint${id})"/>`;
  s += `<g clip-path="url(#body${id})">`;
  // shoulder reflection band + LED reflections on the hood
  s += `<rect x="${f(geo.X(0))}" y="${f(geo.belt - geo.L * 0.012)}" width="${f(geo.L)}" height="${f(geo.L * 0.02)}" fill="#fff" opacity="${f(0.28 * ambient)}" filter="url(#soft)"/>`;
  for (let i = 0; i < 4; i++) {
    const x = geo.X(0.06 + i * 0.07);
    s += `<path d="M${f(x)} ${f(geo.Y(0.2))} l${f(geo.L * 0.06)} 0 l${f(-geo.L * 0.05)} ${f(geo.L * 0.09)} l${f(-geo.L * 0.012)} 0 Z" fill="#fff" opacity="${f(0.38 * ambient)}" filter="url(#soft)"/>`;
  }
  // lower-body shadow
  s += `<rect x="${f(geo.X(0))}" y="${f(geo.Y(0.11))}" width="${f(geo.L)}" height="${f(geo.L * 0.08)}" fill="#000" opacity=".35"/>`;
  // golden-hour rim light
  if (golden > 0) s += `<path d="${geo.d}" fill="none" stroke="#ffb35c" stroke-width="${f(geo.L * 0.012)}" opacity="${f(golden * 0.7)}" filter="url(#soft)"/>`;
  // swirl marks under LEDs (inspect)
  if (swirls > 0) {
    const cx = geo.X(0.14), cy = geo.Y(0.13);
    s += `<g opacity="${f(swirls)}">`;
    s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(geo.L * 0.05)}" ry="${f(geo.L * 0.012)}" fill="#fff" opacity=".7" filter="url(#soft)"/>`;
    for (let i = 0; i < 70; i++) {
      const rr = geo.L * (0.006 + r() * 0.07);
      const a0 = r() * 360;
      s += `<circle cx="${f(cx + (r() - 0.5) * geo.L * 0.02)}" cy="${f(cy + (r() - 0.5) * geo.L * 0.01)}" r="${f(rr)}" fill="none" stroke="#fff" stroke-width="${f(geo.L * 0.0006)}" opacity="${f(0.08 + r() * 0.25)}" stroke-dasharray="${f(rr * (0.4 + r()))} ${f(rr * (2 + r() * 3))}" transform="rotate(${f(a0)} ${f(cx)} ${f(cy)})"/>`;
    }
    s += `</g>`;
  }
  // dirt
  if (dirt > 0) {
    s += `<g opacity="${f(dirt)}">`;
    s += `<rect x="${f(geo.X(0))}" y="${f(geo.topY)}" width="${f(geo.L)}" height="${f(geo.sillY - geo.topY)}" fill="#6b5240" opacity=".5"/>`;
    s += `<rect x="${f(geo.X(0))}" y="${f(geo.Y(0.13))}" width="${f(geo.L)}" height="${f(geo.L * 0.09)}" fill="#3e2c1f" opacity=".75" filter="url(#soft)"/>`;
    for (let i = 0; i < 320; i++) {
      const x = geo.X(r());
      const y = geo.Y(0.05 + Math.pow(r(), 1.6) * 0.2);
      const rad = geo.L * (0.001 + Math.pow(r(), 2.6) * 0.0065);
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad * (1 + r()))}" ry="${f(rad)}" fill="${r() > 0.5 ? "#4a3324" : "#7a5d45"}" opacity="${f(0.35 + r() * 0.5)}"/>`;
    }
    for (let i = 0; i < 26; i++) {
      const x = geo.X(0.25 + r() * 0.5);
      const y = geo.belt;
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(geo.L * (0.002 + r() * 0.003))}" height="${f(geo.L * (0.04 + r() * 0.09))}" fill="#4a3526" opacity="${f(0.3 + r() * 0.4)}"/>`;
    }
    s += `</g>`;
  }
  s += `</g>`;
  // glass, intake, headlight
  s += `<path d="${geo.glass}" fill="url(#glass${id})"/>`;
  s += `<path d="${geo.glass}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="${f(geo.L * 0.0015)}"/>`;
  if (dirt > 0) s += `<path d="${geo.glass}" fill="#8a7058" opacity="${f(0.42 * dirt)}"/>`;
  if (geo.intake) s += `<path d="${geo.intake}" fill="#08080a"/>`;
  const hl = `M${f(geo.X(0.018))} ${f(geo.Y(0.103))} L${f(geo.X(0.11))} ${f(geo.Y(0.126))}`;
  s += `<path d="${hl}" stroke="#eaf6ff" stroke-width="${f(geo.L * 0.006)}" stroke-linecap="round" opacity="${f(0.35 + 0.65 * ambient)}"/>`;
  s += `<path d="${hl}" stroke="#bfe6ff" stroke-width="${f(geo.L * 0.02)}" stroke-linecap="round" opacity="${f(0.25 * ambient)}" filter="url(#glow)"/>`;
  // tail light
  s += `<path d="M${f(geo.X(0.965))} ${f(geo.Y(0.175))} L${f(geo.X(0.995))} ${f(geo.Y(0.17))}" stroke="#ff2a1f" stroke-width="${f(geo.L * 0.007)}" stroke-linecap="round"/>`;
  geo.wheels.forEach((wx, i) => (s += wheel(wx, geo.wy, geo.wr, id + "w" + i, dirt)));
  return s;
}

// ---------- studio ----------
function layout(W, H, mobile, vehicle) {
  if (mobile) return { ceilY: 0.2 * H, floorY: 0.43 * H, x0: 0.05 * W, gy: 0.6 * H, L: 0.9 * W, door: [0.02 * W, 0.36 * W], shelf: [0.8 * W, 1.02 * W] };
  const L = vehicle === "supercar" ? 0.56 * W : 0.6 * W;
  return { ceilY: 0.29 * H, floorY: 0.62 * H, x0: 0.35 * W, gy: 0.87 * H, L, door: [0.035 * W, 0.29 * W], shelf: [0.875 * W, 0.995 * W] };
}

function studio(o) {
  const { W, H, mobile = false, lights = 1, door = 0, golden = 0, workLight = 0, mud = 0, vehicle = "supercar", seed = 7 } = o;
  const r = rng(seed);
  const Lo = layout(W, H, mobile, vehicle);
  const strips = 7;
  const lit = Array.from({ length: strips }, (_, i) => (Array.isArray(lights) ? lights[i] ?? 0 : lights));
  const ambient = lit.reduce((a, b) => a + b, 0) / strips;
  let s = "";
  // back wall + ceiling
  s += `<rect width="${W}" height="${H}" fill="#0b0b0d"/>`;
  s += `<rect y="${f(Lo.ceilY)}" width="${W}" height="${f(Lo.floorY - Lo.ceilY)}" fill="url(#wall)"/>`;
  // wall panel seams
  for (let i = 1; i < 6; i++) s += `<rect x="${f((W * i) / 6)}" y="${f(Lo.ceilY)}" width="1.5" height="${f(Lo.floorY - Lo.ceilY)}" fill="#000" opacity=".35"/>`;
  // cyan accent strip
  const cy = Lo.floorY - (Lo.floorY - Lo.ceilY) * 0.16;
  s += `<rect y="${f(cy - 2)}" width="${W}" height="4" fill="#22d3ee" opacity="${f(0.35 + 0.55 * Math.max(ambient, 0.4))}"/>`;
  s += `<rect y="${f(cy - 14)}" width="${W}" height="28" fill="#22d3ee" opacity="${f(0.22 * Math.max(ambient, 0.4))}" filter="url(#glow)"/>`;
  // garage door (left)
  const [dx0, dx1] = Lo.door;
  const dTop = Lo.ceilY + (Lo.floorY - Lo.ceilY) * 0.06;
  const dH = Lo.floorY - dTop;
  const open = ease(clamp(door));
  s += `<rect x="${f(dx0)}" y="${f(dTop)}" width="${f(dx1 - dx0)}" height="${f(dH)}" fill="url(#sky)"/>`;
  if (open > 0) s += `<circle cx="${f(dx0 + (dx1 - dx0) * 0.3)}" cy="${f(Lo.floorY - dH * 0.08)}" r="${f(dH * 0.35)}" fill="#ffd28a" opacity="${f(open * 0.9)}" filter="url(#glow)"/>`;
  const panelH = dH * (1 - open);
  s += `<g><rect x="${f(dx0)}" y="${f(dTop)}" width="${f(dx1 - dx0)}" height="${f(panelH)}" fill="#1b1c1f"/>`;
  for (let y = dTop + dH * 0.09; y < dTop + panelH; y += dH * 0.09) s += `<rect x="${f(dx0)}" y="${f(y)}" width="${f(dx1 - dx0)}" height="2" fill="#0a0a0b" opacity=".9"/>`;
  s += `</g><rect x="${f(dx0 - 6)}" y="${f(dTop - 6)}" width="${f(dx1 - dx0 + 12)}" height="${f(dH + 6)}" fill="none" stroke="#2a2b2f" stroke-width="6"/>`;
  // shelf with unbranded bottles (right)
  const [sx0, sx1] = Lo.shelf;
  for (let k = 0; k < 4; k++) {
    const y = Lo.ceilY + (Lo.floorY - Lo.ceilY) * (0.22 + k * 0.2);
    s += `<rect x="${f(sx0)}" y="${f(y)}" width="${f(sx1 - sx0)}" height="5" fill="#26272b"/>`;
    let x = sx0 + 6;
    while (x < sx1 - 14) {
      const bw = 10 + r() * 14, bh = 26 + r() * 30;
      const col = ["#2b2d33", "#3a1412", "#22262c", "#4a4c52", "#14161a"][Math.floor(r() * 5)];
      s += `<rect x="${f(x)}" y="${f(y - bh)}" width="${f(bw)}" height="${f(bh)}" rx="3" fill="${col}"/><rect x="${f(x + bw * 0.3)}" y="${f(y - bh - 7)}" width="${f(bw * 0.4)}" height="8" rx="2" fill="#0e0e10"/>`;
      x += bw + 4 + r() * 6;
    }
  }
  s += `<rect x="${f(sx0)}" y="${f(Lo.ceilY)}" width="5" height="${f(Lo.floorY - Lo.ceilY)}" fill="#1e1f23"/>`;
  // floor
  s += `<rect y="${f(Lo.floorY)}" width="${W}" height="${f(H - Lo.floorY)}" fill="url(#floor)"/>`;
  s += `<rect y="${f(Lo.floorY)}" width="${W}" height="3" fill="#000" opacity=".6"/>`;
  // ceiling LED strips (diagonal parallelograms) + floor reflections
  const slant = W * (mobile ? 0.32 : 0.2);
  let strip = "", refl = "";
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const xb = lerp(-W * 0.05, W * 0.95, t);
    const wTop = W * (mobile ? 0.05 : 0.03), wBot = W * (mobile ? 0.024 : 0.015);
    const p = `M${f(xb - slant)} 0 L${f(xb - slant + wTop)} 0 L${f(xb + wBot)} ${f(Lo.ceilY - 6)} L${f(xb)} ${f(Lo.ceilY - 6)} Z`;
    const on = lit[i];
    strip += `<path d="${p}" fill="${on > 0.05 ? "#fffdf6" : "#1c1c1f"}" opacity="${f(on > 0.05 ? 0.25 + 0.75 * on : 1)}"/>`;
    if (on > 0.05) strip += `<path d="${p}" fill="#fff" opacity="${f(0.55 * on)}" filter="url(#glow)"/>`;
    // reflection on polished floor
    const ry0 = Lo.floorY + 8, ry1 = H;
    if (on > 0.05) refl += `<path d="M${f(xb - wBot)} ${f(ry0)} L${f(xb + wBot * 1.2)} ${f(ry0)} L${f(xb + wTop * 1.4 + slant * 0.5)} ${f(ry1)} L${f(xb + slant * 0.5)} ${f(ry1)} Z" fill="#fff" opacity="${f(0.06 * on)}" filter="url(#glow)"/>`;
  }
  s += refl;
  // golden light spill across the floor
  if (open > 0) {
    s += `<path d="M${f(dx0)} ${f(Lo.floorY)} L${f(dx1)} ${f(Lo.floorY)} L${f(W * 1.1)} ${f(H)} L${f(-W * 0.1)} ${f(H)} Z" fill="url(#spill)" opacity="${f(open * golden)}"/>`;
  }
  // car: shadow, reflection, body
  const geo = carGeometry(vehicle, Lo.x0, Lo.gy, Lo.L);
  const paint = o.paint || "rosso";
  s += `<ellipse cx="${f(geo.X(0.5))}" cy="${f(Lo.gy)}" rx="${f(Lo.L * 0.56)}" ry="${f(Lo.L * 0.03)}" fill="#000" opacity=".85" filter="url(#soft)"/>`;
  s += `<g transform="translate(0 ${f(2 * Lo.gy)}) scale(1 -1)" opacity=".2" mask="url(#reflMask)">${car({ ...o, paint, ambient, swirls: 0 }, geo, "r", rng(seed + 1))}</g>`;
  s += car({ ...o, paint, ambient, golden: golden * open }, geo, "c", rng(seed + 2));
  // mud flakes on the floor
  if (mud > 0) {
    const r2 = rng(seed + 9);
    for (let i = 0; i < 40; i++) s += `<ellipse cx="${f(geo.X(r2()))}" cy="${f(Lo.gy + (r2() - 0.2) * Lo.L * 0.03)}" rx="${f(2 + r2() * 5)}" ry="${f(1 + r2() * 2)}" fill="#4a3324" opacity="${f(mud * (0.5 + r2() * 0.4))}"/>`;
  }
  // darkness, work light, haze
  if (ambient < 1) s += `<rect width="${W}" height="${H}" fill="#000" opacity="${f((1 - ambient) * 0.72)}"/>`;
  if (workLight > 0) {
    s += `<rect width="${W}" height="${H}" fill="url(#work)" opacity="${f(workLight)}"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#haze)" opacity="${f(workLight * 0.6)}"/>`;
  }
  s += strip;
  if (golden > 0) s += `<rect width="${W}" height="${H}" fill="#ff8a2a" opacity="${f(0.1 * golden * open)}"/>`;
  return { svg: s, geo, Lo };
}

// ---------- macro paint ----------
function macro(o) {
  const { W, H, swirl = 1, polish = 0, bead = 0, seed = 11 } = o;
  const r = rng(seed);
  const m = Math.max(W, H);
  let s = `<rect width="${W}" height="${H}" fill="url(#mpaint)"/>`;
  s += `<rect width="${W}" height="${H}" filter="url(#peel)" opacity="${f(0.16 * (1 - polish * 0.7))}"/>`;
  // LED panel reflection: sharpens as polish progresses
  const cx = W * 0.56, cy = H * 0.42;
  const blurId = polish > 0.7 ? "soft" : "glow";
  s += `<g transform="rotate(-18 ${f(cx)} ${f(cy)})">`;
  s += `<rect x="${f(cx - m * 0.3)}" y="${f(cy - m * 0.035)}" width="${f(m * 0.6)}" height="${f(m * 0.07)}" rx="${f(m * 0.01)}" fill="#fff" opacity="${f(0.75 + 0.25 * polish)}" filter="url(#${blurId})"/>`;
  s += `<rect x="${f(cx - m * 0.29)}" y="${f(cy - m * 0.028)}" width="${f(m * 0.58)}" height="${f(m * 0.056)}" rx="${f(m * 0.008)}" fill="#fff" opacity="${f(0.4 + 0.6 * polish)}"/>`;
  s += `<rect x="${f(cx - m * 0.25)}" y="${f(cy + m * 0.09)}" width="${f(m * 0.5)}" height="${f(m * 0.012)}" fill="#fff" opacity="${f(0.35 + 0.4 * polish)}" filter="url(#soft)"/>`;
  s += `</g>`;
  // swirl marks, wiped left→right by polish
  if (swirl > 0) {
    let sw = "";
    for (let i = 0; i < 220; i++) {
      const rr = m * (0.02 + Math.pow(r(), 0.8) * 0.55);
      const a0 = r() * 360;
      const ox = (r() - 0.5) * m * 0.05, oy = (r() - 0.5) * m * 0.04;
      const holo = r() > 0.75 ? ["#ffd5f0", "#d5f0ff", "#fff5c8"][Math.floor(r() * 3)] : "#fff";
      sw += `<circle cx="${f(cx + ox)}" cy="${f(cy + oy)}" r="${f(rr)}" fill="none" stroke="${holo}" stroke-width="${f(1 + r() * 1.3)}" opacity="${f(0.05 + r() * 0.2)}" stroke-dasharray="${f(rr * (0.2 + r() * 0.6))} ${f(rr * (1.5 + r() * 4))}" transform="rotate(${f(a0)} ${f(cx)} ${f(cy)})"/>`;
    }
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H, l = m * (0.02 + r() * 0.08), a = r() * 180;
      sw += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + l)}" y2="${f(y)}" stroke="#fff" stroke-width="1" opacity="${f(0.05 + r() * 0.12)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
    }
    s += `<g opacity="${f(swirl)}" ${polish > 0 ? `mask="url(#polishMask)"` : ""}>${sw}</g>`;
  }
  // water beads
  if (bead > 0) {
    s += `<g opacity="${f(clamp(bead * 1.6))}">`;
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H;
      const rad = m * (0.004 + Math.pow(r(), 2) * 0.03) * clamp(bead * 1.3);
      if (Math.hypot(x - W * 0.5, y - H * 0.55) < m * 0.16) continue;
      s += beadSvg(x, y, rad, r() > 0.6);
    }
    const big = m * 0.11 * ease(clamp((bead - 0.15) / 0.85));
    if (big > 1) s += beadSvg(W * 0.5, H * 0.56, big, false, true);
    s += `</g>`;
  }
  // bokeh and vignette
  for (let i = 0; i < 9; i++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.5)}" r="${f(m * (0.02 + r() * 0.05))}" fill="#ffd0c0" opacity="${f(0.04 + r() * 0.06)}" filter="url(#glow)"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  return s;
}

function beadSvg(x, y, rad, blurred, hero = false) {
  const blur = blurred ? ` filter="url(#soft)"` : "";
  let s = `<g${blur}>`;
  s += `<ellipse cx="${f(x + rad * 0.15)}" cy="${f(y + rad * 0.55)}" rx="${f(rad * 0.95)}" ry="${f(rad * 0.4)}" fill="#200000" opacity=".55"/>`;
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#bead)"/>`;
  s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="none" stroke="#3a0000" stroke-width="${f(Math.max(0.6, rad * 0.06))}" opacity=".7"/>`;
  s += `<ellipse cx="${f(x - rad * 0.32)}" cy="${f(y - rad * 0.4)}" rx="${f(rad * 0.3)}" ry="${f(rad * 0.16)}" fill="#fff" opacity=".95" transform="rotate(-30 ${f(x - rad * 0.32)} ${f(y - rad * 0.4)})"/>`;
  s += `<path d="M${f(x - rad * 0.6)} ${f(y + rad * 0.35)} A${f(rad * 0.75)} ${f(rad * 0.75)} 0 0 0 ${f(x + rad * 0.55)} ${f(y + rad * 0.45)}" stroke="#ffb0a0" stroke-width="${f(Math.max(0.6, rad * 0.06))}" fill="none" opacity=".55"/>`;
  if (hero) s += `<rect x="${f(x - rad * 0.55)}" y="${f(y - rad * 0.12)}" width="${f(rad * 1.1)}" height="${f(rad * 0.05)}" fill="#fff" opacity=".55" transform="rotate(-18 ${f(x)} ${f(y)})"/>`;
  return s + `</g>`;
}

function defs(W, H, polish = 0) {
  const m = Math.max(W, H);
  const edge = clamp(polish) * 1.3 - 0.15;
  return `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(m * 0.012)}"/></filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(m * 0.003)}"/></filter>
    <filter id="peel"><feTurbulence type="fractalNoise" baseFrequency="${f(6 / m * 80)}" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17181b"/><stop offset="1" stop-color="#0f1012"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3b3f"/><stop offset=".35" stop-color="#2a2b2e"/><stop offset="1" stop-color="#151517"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1e3a"/><stop offset=".45" stop-color="#c2492a"/><stop offset=".8" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
    <linearGradient id="spill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb35c" stop-opacity=".55"/><stop offset=".6" stop-color="#ff8a2a" stop-opacity=".18"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></linearGradient>
    <radialGradient id="work" cx=".88" cy=".05" r=".8"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".75"/><stop offset=".35" stop-color="#ff9e4a" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="haze" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc4b8" stop-opacity=".22"/><stop offset=".6" stop-color="#cfc4b8" stop-opacity="0"/></linearGradient>
    <linearGradient id="reflFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
    <mask id="reflMask" maskUnits="userSpaceOnUse" x="0" y="${f(-H)}" width="${W}" height="${f(H * 3)}"><rect y="${f(-H)}" width="${W}" height="${f(H * 3)}" fill="url(#reflFade)"/></mask>
    <radialGradient id="mpaint" cx=".55" cy=".42" r=".9"><stop offset="0" stop-color="#e01a0f"/><stop offset=".5" stop-color="#a10c06"/><stop offset="1" stop-color="#3a0302"/></radialGradient>
    <radialGradient id="bead" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ff7a66" stop-opacity=".35"/><stop offset=".6" stop-color="#c8180c" stop-opacity=".55"/><stop offset=".92" stop-color="#5a0503" stop-opacity=".9"/><stop offset="1" stop-color="#ffd0c4" stop-opacity=".8"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <linearGradient id="polishGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="${f(clamp(edge))}" stop-color="#000"/><stop offset="${f(clamp(edge + 0.15))}" stop-color="#fff"/>
    </linearGradient>
    <mask id="polishMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#polishGrad)"/></mask>
  </defs>`;
}

/**
 * Full frame.
 * studio: { lights, door, golden, workLight, dirt, mud, swirls, vehicle, paint }
 * cam: { zoom, fx, fy } (focus in 0..1 of frame) applied to the studio layer
 * macro: { swirl, polish, bead, zoom } ; mix: opacity of macro over studio (0 = studio only, 1 = macro only)
 */
export function frameSvg({ W, H, mobile = false, studio: st = {}, cam = { zoom: 1, fx: 0.5, fy: 0.5 }, macro: mc = null, mix = 0 }) {
  let body = "";
  if (mix < 1) {
    const sc = studio({ W, H, mobile, ...st });
    const z = cam.zoom || 1;
    const fx = (cam.fx ?? 0.5) * W, fy = (cam.fy ?? 0.5) * H;
    // keep the focus point at the same screen spot while zooming, optionally drifting it to centre
    const tx = cam.tx ?? fx, ty = cam.ty ?? fy;
    body += `<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(z)}) translate(${f(-fx)} ${f(-fy)})">${sc.svg}</g>`;
  }
  if (mc && mix > 0) {
    const z = mc.zoom || 1;
    body += `<g opacity="${f(mix)}" transform="translate(${f(W / 2)} ${f(H / 2)}) scale(${f(z)}) translate(${f(-W / 2)} ${f(-H / 2)})">${macro({ W, H, ...mc })}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(W, H, mc?.polish ?? 0)}${body}</svg>`;
}

/** Hood/headlight focus point for camera moves, in 0..1 frame coords. */
export function hoodFocus(W, H, mobile) {
  const Lo = layout(W, H, mobile, "supercar");
  const geo = carGeometry("supercar", Lo.x0, Lo.gy, Lo.L);
  return { fx: geo.X(0.14) / W, fy: geo.Y(0.13) / H };
}

// ---------- named stills ----------
export function stillParams(name, W, H, mobile) {
  const hf = hoodFocus(W, H, mobile);
  const inspectCam = { zoom: mobile ? 2.4 : 3.0, fx: hf.fx, fy: hf.fy, tx: W * 0.5, ty: H * (mobile ? 0.5 : 0.52) };
  switch (name) {
    case "S0_clean_lit": return { studio: { lights: 1 } };
    case "S1_dirty_lit": return { studio: { lights: 1, dirt: 1, mud: 1 } };
    case "S2_dirty_dark": return { studio: { lights: 0, dirt: 1, mud: 1, workLight: 1 } };
    case "S3_inspect_close": return { studio: { lights: 1, swirls: 1 }, cam: inspectCam };
    case "S4_swirl_macro": return { macro: { swirl: 1 }, mix: 1 };
    case "S5_polished_macro": return { macro: { swirl: 1, polish: 1 }, mix: 1 };
    case "S6_bead_macro": return { macro: { swirl: 0, polish: 1, bead: 1 }, mix: 1 };
    case "S7_pickup_golden": return { studio: { lights: 1, door: 1, golden: 1 } };
    default: return null;
  }
}

/** Procedural motion for a missing clip; t = 0..1 across the clip. */
export function clipParams(clip, t, W, H, mobile) {
  const hf = hoodFocus(W, H, mobile);
  const zIn = mobile ? 2.4 : 3.0;
  const inspectT = { tx: W * 0.5, ty: H * (mobile ? 0.5 : 0.52) };
  const e = ease(t);
  switch (clip) {
    case "C1_lights_on": {
      const lights = Array.from({ length: 7 }, (_, i) => {
        const start = 0.1 + (6 - i) * 0.1;
        const k = clamp((t - start) / 0.12);
        const flick = k > 0 && k < 1 ? (Math.sin(k * 40 + i) > 0 ? 1 : 0.15) : k;
        return k >= 1 ? 1 : flick * k;
      });
      return { studio: { lights, dirt: 1, mud: 1, workLight: 1 - e } };
    }
    case "C2_push_inspect":
      return {
        studio: { lights: 1, swirls: clamp((t - 0.45) / 0.55) },
        cam: { zoom: lerp(1, zIn, e), fx: hf.fx, fy: hf.fy, tx: lerp(hf.fx * W, inspectT.tx, e), ty: lerp(hf.fy * H, inspectT.ty, e) },
      };
    case "C3_into_macro":
      return {
        studio: { lights: 1, swirls: 1 },
        cam: { zoom: zIn * lerp(1, 6, e), fx: hf.fx, fy: hf.fy, ...inspectT },
        macro: { swirl: 1, zoom: lerp(1.6, 1, e) },
        mix: clamp((t - 0.35) / 0.5),
      };
    case "C4_polish":
      return { macro: { swirl: 1, polish: e }, mix: 1 };
    case "C5_bead":
      return { macro: { swirl: 1, polish: 1, bead: e, zoom: lerp(1, 1.12, e) }, mix: 1 };
    case "C6_pull_back": {
      return {
        studio: { lights: 1, door: clamp((t - 0.35) / 0.6), golden: 1 },
        cam: { zoom: lerp(zIn * 4, 1, ease(clamp(t / 0.85))), fx: hf.fx, fy: hf.fy, tx: lerp(W * 0.5, hf.fx * W, ease(clamp(t / 0.85))), ty: lerp(H * 0.5, hf.fy * H, ease(clamp(t / 0.85))) },
        macro: { swirl: 0, polish: 1, bead: 1, zoom: lerp(1.12, 2.2, e) },
        mix: 1 - clamp(t / 0.4),
      };
    }
    default:
      return null;
  }
}

// ---------- gallery, interior, OG ----------
export function galleryParams(name) {
  const m = name.match(/^G\d_(suv|truck|sedan|coupe)_(before|after)$/);
  if (!m) return null;
  const paint = { suv: "grey", truck: "white", sedan: "black", coupe: "blue" }[m[1]];
  const dirty = m[2] === "before";
  return { studio: { lights: 1, vehicle: m[1], paint, dirt: dirty ? 0.85 : 0, mud: dirty ? 0.6 : 0, seed: 21 }, cam: { zoom: 1.15, fx: 0.65, fy: 0.8, tx: 1600 * 0.5, ty: 1200 * 0.64 } };
}

export function interiorSvg(W, H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx=".55" cy=".4" r=".9"><stop offset="0" stop-color="#2a2a2e"/><stop offset="1" stop-color="#050506"/></radialGradient>
    <linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18181b"/><stop offset="1" stop-color="#0a0a0b"/></linearGradient>
    <filter id="b"><feGaussianBlur stdDeviation="${W * 0.006}"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <path d="M0 ${H * 0.42} Q${W * 0.5} ${H * 0.3} ${W} ${H * 0.4} L${W} ${H * 0.6} L0 ${H * 0.62} Z" fill="url(#d)"/>
  <path d="M0 ${H * 0.42} Q${W * 0.5} ${H * 0.3} ${W} ${H * 0.4}" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" filter="url(#b)"/>
  <circle cx="${W * 0.38}" cy="${H * 0.6}" r="${H * 0.3}" fill="none" stroke="#0c0c0e" stroke-width="${H * 0.06}"/>
  <circle cx="${W * 0.38}" cy="${H * 0.6}" r="${H * 0.3}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-dasharray="${H * 0.4} ${H * 1.6}" transform="rotate(200 ${W * 0.38} ${H * 0.6})"/>
  <rect x="${W * 0.38 - H * 0.09}" y="${H * 0.54}" width="${H * 0.18}" height="${H * 0.12}" rx="${H * 0.03}" fill="#131316"/>
  <path d="M${W * 0.6} ${H} L${W * 0.66} ${H * 0.62} L${W * 0.82} ${H * 0.62} L${W * 0.9} ${H} Z" fill="#101012"/>
  <path d="M${W * 0.66} ${H * 0.62} L${W * 0.82} ${H * 0.62}" stroke="#e8150b" stroke-width="2" stroke-opacity=".8"/>
  <rect width="${W}" height="${H}" fill="#ffe8d0" opacity=".03"/>
</svg>`;
}
