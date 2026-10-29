#!/usr/bin/env node
/**
 * npm run frames
 *
 * assets-src/ (Higgsfield files) → public/frames, public/stills, public/gallery, public/og + manifest.json
 *  - Clips per chapter come from site.config.ts > film.chapters[n].clips (C6a_/C6b_ splits are concatenated alphabetically).
 *  - Each chapter gets exactly film.chapters[n].frames.{desktop|mobile} frames (duplicated boundary frames dropped).
 *  - Anything missing is substituted (procedural art / Ken Burns crossfade / desktop crop) and logged in ASSETS_TODO.md.
 *  - Idempotent: every output unit is hashed against its inputs (.frames-cache.json) and skipped when unchanged.
 *
 * Flags: --force (ignore cache), --only=stills|frames|gallery
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { frameSvg, stillParams, clipParams, galleryParams, interiorSvg } from "./lib/placeholder-art.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "assets-src");
const PUB = path.join(ROOT, "public");
const TMP = path.join(ROOT, "tmp", "frames");
const CACHE_FILE = path.join(ROOT, ".frames-cache.json");
const PIPELINE_VERSION = "3";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];

const { siteConfig } = await import(path.join(ROOT, "src/site.config.ts"));
const chapters = siteConfig.film.chapters;

const D = { w: 1600, h: 900, q: 62 }; // desktop frames
const M = { w: 720, h: 1280, q: 60 }; // mobile frames
const STILL_W = { desktop: [2400, 1600], mobile: [1080] };
const BUDGET_KB = { desktop: 70, mobile: 35 };

/** Clip → [start still, end still] (used for placeholders). */
const CLIP_STILLS = {
  C1_lights_on: ["S2_dirty_dark", "S1_dirty_lit"],
  C2_push_inspect: ["S0_clean_lit", "S3_inspect_close"],
  C3_into_macro: ["S3_inspect_close", "S4_swirl_macro"],
  C4_polish: ["S4_swirl_macro", "S5_polished_macro"],
  C5_bead: ["S5_polished_macro", "S6_bead_macro"],
  C6_pull_back: ["S6_bead_macro", "S7_pickup_golden"],
};
const STILLS = ["S0_clean_lit", "S1_dirty_lit", "S2_dirty_dark", "S3_inspect_close", "S4_swirl_macro", "S5_polished_macro", "S6_bead_macro", "S7_pickup_golden"];
const GALLERY = siteConfig.gallery.items.flatMap((g) => [g.before, g.after]).concat(["I1_interior"]);

// ---------------------------------------------------------------- helpers
const log = (...a) => console.log("•", ...a);
const todo = []; // { file, why, substitute }
const sub = (file, why, substitute) => todo.push({ file, why, substitute });
const cache = !FORCE && fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};
const nextCache = { ...cache };

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const srcFiles = fs.readdirSync(SRC).filter((f) => !f.startsWith("."));
const byBase = new Map(srcFiles.map((f) => [path.parse(f).name, path.join(SRC, f)]));

const IMG_EXT = [".png", ".jpg", ".jpeg", ".webp"];
const VID_EXT = [".mp4", ".mov", ".webm"];
const findImage = (base) => {
  const p = byBase.get(base);
  return p && IMG_EXT.includes(path.extname(p).toLowerCase()) ? p : null;
};
/** A clip, or its alphabetical C6a_/C6b_ split pieces. */
const findClip = (clip, mobile) => {
  const suffix = mobile ? "_m" : "";
  const exact = byBase.get(clip + suffix);
  if (exact && VID_EXT.includes(path.extname(exact).toLowerCase())) return [exact];
  const prefix = clip.split("_")[0]; // C6
  const re = new RegExp(`^${prefix}[a-z]_.*${mobile ? "_m" : ""}$`);
  const parts = srcFiles
    .filter((f) => VID_EXT.includes(path.extname(f).toLowerCase()))
    .filter((f) => re.test(path.parse(f).name) && (mobile || !path.parse(f).name.endsWith("_m")))
    .sort()
    .map((f) => path.join(SRC, f));
  return parts.length ? parts : null;
};

const statKey = (p) => {
  if (!p) return "none";
  const s = fs.statSync(p);
  return `${path.basename(p)}:${s.size}:${Math.round(s.mtimeMs)}`;
};
/** Procedural outputs also depend on the art code itself. */
const ART = createHash("sha1").update(fs.readFileSync(path.join(ROOT, "scripts/lib/placeholder-art.mjs"))).digest("hex").slice(0, 10);
const hash = (...parts) => createHash("sha1").update(JSON.stringify([PIPELINE_VERSION, ...parts])).digest("hex").slice(0, 16);
const fresh = (key, h, outputs) => cache[key] === h && outputs.every((o) => fs.existsSync(o));
const done = (key, h) => (nextCache[key] = h);

async function pool(items, n, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  });
  await Promise.all(workers);
}
const CONC = Math.max(2, Math.min(6, os.cpus().length));

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

/** Cover-crop a buffer to W×H around a focal point. */
async function coverCrop(input, W, H, fx = 0.5, fy = 0.5) {
  const img = sharp(input);
  const meta = await img.metadata();
  const s = Math.max(W / meta.width, H / meta.height);
  const rw = Math.round(meta.width * s), rh = Math.round(meta.height * s);
  const left = Math.round(Math.min(Math.max(fx * rw - W / 2, 0), rw - W));
  const top = Math.round(Math.min(Math.max(fy * rh - H / 2, 0), rh - H));
  return sharp(input).resize(rw, rh).extract({ left, top, width: W, height: H }).toBuffer();
}

// ---------------------------------------------------------------- stills
/** Returns a PNG buffer for a still at W×H (real file cropped, or procedural). Records substitutions. */
const realStill = (name, mobile) => findImage(name + (mobile ? "_m" : ""));
const isRealStill = (name, mobile) => !!realStill(name, mobile) || (mobile && !!findImage(name));

async function stillBuffer(name, W, H, mobile, focal = { x: 0.5, y: 0.5 }) {
  const own = realStill(name, mobile);
  if (own) return coverCrop(own, W, H, focal.x, focal.y);
  if (mobile) {
    const desk = findImage(name);
    if (desk) return coverCrop(desk, W, H, focal.x, focal.y);
  }
  const p = stillParams(name, W, H, mobile);
  if (!p) throw new Error("No procedural art for " + name);
  return sharp(Buffer.from(frameSvg({ W, H, mobile, ...p }))).png().toBuffer();
}

function focalFor(name) {
  const ch = chapters.find((c) => c.stills.includes(name));
  return { x: ch?.focalX ?? 0.5, y: ch?.focalY ?? 0.5 };
}

async function buildStills() {
  const dir = path.join(PUB, "stills");
  fs.mkdirSync(dir, { recursive: true });
  for (const name of STILLS) {
    for (const variant of ["desktop", "mobile"]) {
      const mobile = variant === "mobile";
      const srcName = name + (mobile ? "_m" : "");
      const own = realStill(name, mobile);
      if (!own) {
        if (mobile && findImage(name)) sub(`${srcName}.png`, "missing", `center-cropped from ${name}.png (focal ${focalFor(name).x})`);
        else sub(`${srcName}.png`, "missing", "procedural placeholder art");
      }
      const widths = STILL_W[variant];
      const outs = widths.flatMap((w) => [`${srcName}-${w}.webp`, `${srcName}-${w}.avif`].map((f) => path.join(dir, f)));
      const h = hash("still", srcName, statKey(own), statKey(mobile ? findImage(name) : null), focalFor(name), own ? null : ART);
      if (fresh("still:" + srcName, h, outs)) continue;
      const W = widths[0];
      const H = mobile ? Math.round((W * 16) / 9) : Math.round((W * 9) / 16);
      const buf = await stillBuffer(name, W, H, mobile, focalFor(name));
      for (const w of widths) {
        const r = sharp(buf).resize(w);
        await r.clone().webp({ quality: 72, effort: 5 }).toFile(path.join(dir, `${srcName}-${w}.webp`));
        await r.clone().avif({ quality: 50, effort: 4 }).toFile(path.join(dir, `${srcName}-${w}.avif`));
      }
      done("still:" + srcName, h);
      log("still", srcName, own ? "(source)" : "(placeholder)");
    }
  }
  // drawer ribbon crop
  const rb = siteConfig.film.ribbon;
  const ribbonOut = path.join(dir, "ribbon-880.webp");
  const rh = hash("ribbon", rb, statKey(findImage(rb.still)), findImage(rb.still) ? null : ART);
  if (!fresh("ribbon", rh, [ribbonOut])) {
    const big = await stillBuffer(rb.still, 2400, 1350, false, focalFor(rb.still));
    const meta = { width: 2400, height: 1350 };
    const cw = 1760, ch = 384; // 2x of 880×192
    const left = Math.round(Math.min(Math.max(rb.focusX * meta.width - cw / 2, 0), meta.width - cw));
    const top = Math.round(Math.min(Math.max(rb.focusY * meta.height - ch / 2, 0), meta.height - ch));
    await sharp(big).extract({ left, top, width: cw, height: ch }).resize(880).webp({ quality: 70 }).toFile(ribbonOut);
    done("ribbon", rh);
    log("ribbon crop");
  }
}

// ---------------------------------------------------------------- frames
function ffprobe(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=width,height,nb_read_packets:format=duration", "-of", "json", file]).toString();
  const j = JSON.parse(out);
  return { duration: +j.format.duration, frames: +j.streams[0].nb_read_packets, width: j.streams[0].width, height: j.streams[0].height };
}

/** Concatenate clip parts → one normalised mp4 at target size (cover crop with focal point). */
function concatClips(parts, W, H, fx, out) {
  const inputs = parts.flatMap((p) => ["-i", p]);
  // crop to target aspect around focalX, then scale
  const crop = `crop='min(iw,ih*${W}/${H})':'min(ih,iw*${H}/${W})':'(iw-min(iw,ih*${W}/${H}))*${fx}':'(ih-min(ih,iw*${H}/${W}))/2'`;
  let filt = parts.map((_, i) => `[${i}:v]${crop},scale=${W}:${H}:flags=lanczos,fps=30,setsar=1,format=yuv420p[v${i}];`).join("");
  filt += parts.map((_, i) => `[v${i}]`).join("") + `concat=n=${parts.length}:v=1:a=0[out]`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filt, "-map", "[out]", "-an", "-c:v", "libx264", "-crf", "14", "-preset", "fast", out]);
}

/** Extract exactly n frames evenly spaced from a video, as PNG buffers. */
function extractFrames(video, n, workdir) {
  rmrf(workdir);
  const { duration } = ffprobe(video);
  const fps = Math.max(1, (n + 2) / duration);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-vf", `fps=${fps.toFixed(4)}`, "-q:v", "2", path.join(workdir, "%04d.png")]);
  const files = fs.readdirSync(workdir).filter((f) => f.endsWith(".png")).sort();
  if (!files.length) throw new Error("ffmpeg extracted no frames from " + video);
  const pick = Array.from({ length: n }, (_, i) => files[Math.round((i * (files.length - 1)) / Math.max(1, n - 1))]);
  return pick.map((f) => path.join(workdir, f));
}

async function kenBurns(a, b, n, W, H) {
  // a, b: PNG buffers at W*1.08 × H*1.08 so we can zoom without upscaling much
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    const zoom = 1 + 0.07 * t;
    const bw = Math.round(W * 1.08), bh = Math.round(H * 1.08);
    const cw = Math.round(bw / zoom / 1.0), ch = Math.round(bh / zoom / 1.0);
    const left = Math.round((bw - cw) / 2), top = Math.round((bh - ch) / 2);
    const fa = await sharp(a).extract({ left, top, width: cw, height: ch }).resize(W, H).toBuffer();
    const fb = await sharp(b).extract({ left, top, width: cw, height: ch }).resize(W, H).removeAlpha().ensureAlpha(t).png().toBuffer();
    out.push(await sharp(fa).composite([{ input: fb }]).png().toBuffer());
  }
  return out;
}

async function buildChapterFrames() {
  const manifest = { version: PIPELINE_VERSION, generatedAt: new Date().toISOString(), chapters: {}, placeholders: [] };
  for (const ch of chapters) {
    manifest.chapters[ch.id] = { desktop: 0, mobile: 0, width: D.w, height: D.h, mobileWidth: M.w, mobileHeight: M.h, placeholder: false };
    for (const variant of ["desktop", "mobile"]) {
      const mobile = variant === "mobile";
      const spec = mobile ? M : D;
      const target = ch.frames[variant];
      const outDir = path.join(PUB, "frames", ch.id, variant);
      if (!ch.clips.length || !target) {
        fs.rmSync(path.join(PUB, "frames", ch.id), { recursive: true, force: true });
        continue;
      }
      // Lights-on is optional: when its clip is missing the film uses the code fallback (no frames).
      const sources = ch.clips.map((clip) => ({ clip, parts: findClip(clip, mobile) || (mobile ? findClip(clip, false) : null), own: !!findClip(clip, mobile) }));
      if (ch.id === "arrive" && sources.every((s) => !s.parts)) {
        sub(`${ch.clips[0]}${mobile ? "_m" : ""}.mp4`, "missing (optional)", "code fallback: flicker crossfade S2_dirty_dark → S1_dirty_lit");
        fs.rmSync(outDir, { recursive: true, force: true });
        continue;
      }
      const per = ch.clips.map((_, i) => Math.floor(target / ch.clips.length) + (i < target % ch.clips.length ? 1 : 0));
      const h = hash("frames", ch.id, variant, target, ch.focalX, sources.map((s) => (s.parts || []).map(statKey)), ch.clips.map((c) => (CLIP_STILLS[c] || []).map((n) => statKey(realStill(n, mobile) || findImage(n)))), ART);
      const outs = Array.from({ length: target }, (_, i) => path.join(outDir, String(i + 1).padStart(4, "0") + ".webp"));
      const isPlaceholder = sources.some((s) => !s.own);
      if (isPlaceholder) manifest.chapters[ch.id].placeholder = true;
      sources.forEach((s) => {
        const name = `${s.clip}${mobile ? "_m" : ""}.mp4`;
        if (!s.parts) sub(name, "missing", isRealStill(CLIP_STILLS[s.clip][0], mobile) ? "Ken Burns crossfade between its stills" : "procedural camera move (placeholder art)");
        else if (!s.own) sub(name, "missing", `center-cropped from ${s.clip}.mp4`);
      });
      manifest.chapters[ch.id][variant] = target;
      if (fresh(`frames:${ch.id}:${variant}`, h, outs)) continue;

      rmrf(outDir);
      let k = 0;
      const writeFrame = async (buf) => {
        const file = outs[k++];
        await sharp(buf).resize(spec.w, spec.h, { fit: "cover" }).webp({ quality: spec.q, effort: 5, smartSubsample: true }).toFile(file);
      };
      for (let ci = 0; ci < sources.length; ci++) {
        const s = sources[ci];
        const n = per[ci] + (ci > 0 ? 1 : 0); // extra frame, first one dropped (shared boundary)
        let bufs;
        if (s.parts) {
          const joined = path.join(TMP, `${ch.id}-${variant}-${ci}.mp4`);
          concatClips(s.parts, spec.w, spec.h, ch.focalX, joined);
          bufs = extractFrames(joined, n, path.join(TMP, `${ch.id}-${variant}-${ci}`)).map((p) => fs.readFileSync(p));
        } else {
          const [a, b] = CLIP_STILLS[s.clip];
          if (!isRealStill(a, mobile) && !isRealStill(b, mobile)) {
            bufs = new Array(n);
            await pool([...Array(n).keys()], CONC, async (i) => {
              const t = n === 1 ? 1 : i / (n - 1);
              const p = clipParams(s.clip, t, spec.w, spec.h, mobile);
              bufs[i] = await sharp(Buffer.from(frameSvg({ W: spec.w, H: spec.h, mobile, ...p }))).png().toBuffer();
            });
          } else {
            const bw = Math.round(spec.w * 1.08), bh = Math.round(spec.h * 1.08);
            const A = await stillBuffer(a, bw, bh, mobile, focalFor(a));
            const B = await stillBuffer(b, bw, bh, mobile, focalFor(b));
            bufs = await kenBurns(A, B, n, spec.w, spec.h);
          }
        }
        if (ci > 0) bufs = bufs.slice(1);
        for (const b of bufs) await writeFrame(b);
      }
      done(`frames:${ch.id}:${variant}`, h);
      const kb = outs.reduce((a, o) => a + fs.statSync(o).size, 0) / 1024;
      const avg = kb / outs.length;
      log(`frames ${ch.id}/${variant}: ${outs.length} × avg ${avg.toFixed(1)}KB = ${(kb / 1024).toFixed(1)}MB${avg > BUDGET_KB[variant] ? "  ⚠ over budget (" + BUDGET_KB[variant] + "KB)" : ""}`);
    }
  }
  manifest.placeholders = [...new Set(todo.map((t) => t.file))];
  fs.mkdirSync(path.join(PUB, "frames"), { recursive: true });
  fs.writeFileSync(path.join(PUB, "frames", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

// ---------------------------------------------------------------- gallery + OG
async function buildGallery() {
  const dir = path.join(PUB, "gallery");
  fs.mkdirSync(dir, { recursive: true });
  for (const name of GALLERY) {
    const own = findImage(name);
    if (!own) sub(`${name}.png`, "missing", "procedural placeholder art");
    const outs = [1600, 800].map((w) => path.join(dir, `${name}-${w}.webp`));
    const h = hash("gallery", name, statKey(own), own ? null : ART);
    if (fresh("gallery:" + name, h, outs)) continue;
    let buf;
    if (own) buf = await coverCrop(own, 1600, 1200);
    else if (name === "I1_interior") buf = await sharp(Buffer.from(interiorSvg(1600, 1200))).png().toBuffer();
    else buf = await sharp(Buffer.from(frameSvg({ W: 1600, H: 1200, ...galleryParams(name) }))).png().toBuffer();
    for (const w of [1600, 800]) await sharp(buf).resize(w).webp({ quality: 70, effort: 5 }).toFile(path.join(dir, `${name}-${w}.webp`));
    done("gallery:" + name, h);
    log("gallery", name, own ? "(source)" : "(placeholder)");
  }
  // OG base image (brand name is overlaid at request time by app/opengraph-image.tsx)
  const og = findImage("OG_share");
  if (!og) sub("OG_share.jpg", "missing", "S7_pickup_golden composition (placeholder)");
  const ogOut = path.join(PUB, "og", "og-base.jpg");
  const h = hash("og", statKey(og), statKey(findImage("S7_pickup_golden")), og ? null : ART);
  if (!fresh("og", h, [ogOut])) {
    fs.mkdirSync(path.dirname(ogOut), { recursive: true });
    const buf = og ? await coverCrop(og, 1200, 630, 0.6, 0.5) : await stillBuffer("S7_pickup_golden", 1200, 630, false, { x: 0.45, y: 0.55 });
    await sharp(buf).jpeg({ quality: 80, mozjpeg: true }).toFile(ogOut);
    done("og", h);
    log("og base");
  }
}

// ---------------------------------------------------------------- ASSETS_TODO.md
function writeTodo() {
  const uniq = [];
  const seen = new Set();
  for (const t of todo) {
    if (seen.has(t.file)) continue;
    seen.add(t.file);
    uniq.push(t);
  }
  const present = srcFiles.filter((f) => f !== "README.md");
  let md = `# ASSETS_TODO\n\nGenerated by \`npm run frames\` on ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. Re-run it after adding files to \`assets-src/\`.\n\n`;
  md += `Generate these in the Higgsfield web app (see the master prompt, Part B) and save them into \`assets-src/\` with the exact names.\n\n`;
  if (!uniq.length) md += "Nothing missing. Every asset comes from `assets-src/`.\n";
  else {
    md += `## Missing (${uniq.length}): currently substituted\n\n| File | Status | Substitute in use |\n|---|---|---|\n`;
    md += uniq.map((t) => `| \`${t.file}\` | ${t.why} | ${t.substitute} |`).join("\n") + "\n";
  }
  md += `\n## Found in assets-src/ (${present.length})\n\n` + (present.length ? present.map((f) => `- \`${f}\``).join("\n") : "- none yet") + "\n";
  md += `\n## After adding real files\n\n1. \`npm run frames\`\n2. \`npm run check-align\` and copy the suggested \`film.washAlign\` into \`src/site.config.ts\`\n3. Open \`/?align=1\` to eyeball the wash alignment, tune \`focalX\` / \`focalY\` per chapter\n4. Set \`gallery.isSample: false\` once the before/afters are real job photos\n`;
  fs.writeFileSync(path.join(ROOT, "ASSETS_TODO.md"), md);
}

// ---------------------------------------------------------------- run
const t0 = Date.now();
log(`assets-src: ${srcFiles.length} file(s)`);
if (!ONLY || ONLY === "stills") await buildStills();
let manifest;
if (!ONLY || ONLY === "frames") manifest = await buildChapterFrames();
if (!ONLY || ONLY === "gallery") await buildGallery();
if (!ONLY) writeTodo();
fs.writeFileSync(CACHE_FILE, JSON.stringify(nextCache, null, 2));
if (manifest) {
  const sizeOf = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).reduce((a, f) => a + (fs.statSync(path.join(dir, f)).isFile() ? fs.statSync(path.join(dir, f)).size : 0), 0) : 0);
  let d = 0, m = 0;
  for (const ch of chapters) {
    d += sizeOf(path.join(PUB, "frames", ch.id, "desktop"));
    m += sizeOf(path.join(PUB, "frames", ch.id, "mobile"));
  }
  log(`film total: desktop ${(d / 1048576).toFixed(1)}MB · mobile ${(m / 1048576).toFixed(1)}MB`);
}
log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s · ${new Set(todo.map((t) => t.file)).size} substitution(s) → ASSETS_TODO.md`);
