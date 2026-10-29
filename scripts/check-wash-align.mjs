#!/usr/bin/env node
/**
 * npm run check-align
 * Compares S0_clean_lit vs S1_dirty_lit (desktop + mobile): writes a difference image to tmp/ and searches
 * for the translation that best lines them up (edge maps, so the mud itself doesn't bias the result).
 * Prints a suggested film.washAlign for src/site.config.ts.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "tmp");
fs.mkdirSync(OUT, { recursive: true });

const find = (base) => {
  for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
    const p = path.join(SRC, base + ext);
    if (fs.existsSync(p)) return p;
  }
  const pub = path.join(ROOT, "public", "stills", base + (base.endsWith("_m") ? "-1080.webp" : "-1600.webp"));
  return fs.existsSync(pub) ? pub : null;
};

async function edges(file, W) {
  const { data, info } = await sharp(file)
    .resize(W)
    .greyscale()
    .convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function check(suffix) {
  const a = find("S0_clean_lit" + suffix);
  const b = find("S1_dirty_lit" + suffix);
  if (!a || !b) {
    console.log(`- ${suffix || "desktop"}: S0/S1 not found, skipped`);
    return;
  }
  const meta = await sharp(a).metadata();
  const W = 480;
  const scale = meta.width / W;
  const [A, B] = await Promise.all([edges(a, W), edges(b, W)]);
  let best = { dx: 0, dy: 0, err: Infinity };
  const R = 10;
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) {
      let err = 0, n = 0;
      for (let y = R; y < A.h - R; y += 2)
        for (let x = R; x < A.w - R; x += 2) {
          err += Math.abs(A.data[y * A.w + x] - B.data[(y + dy) * B.w + (x + dx)]);
          n++;
        }
      err /= n;
      if (err < best.err) best = { dx, dy, err };
    }
  const zero = (() => {
    let err = 0, n = 0;
    for (let y = R; y < A.h - R; y += 2)
      for (let x = R; x < A.w - R; x += 2) {
        err += Math.abs(A.data[y * A.w + x] - B.data[y * B.w + x]);
        n++;
      }
    return err / n;
  })();
  const diff = path.join(OUT, `wash-diff${suffix || ""}.png`);
  const bb = await sharp(b).resize(meta.width, meta.height).toBuffer();
  await sharp(a).composite([{ input: bb, blend: "difference" }]).png().toFile(diff);
  // washAlign is applied to the dirty still in source pixels; the film scales it with the cover fit.
  const dx = -Math.round(best.dx * scale), dy = -Math.round(best.dy * scale);
  console.log(`- ${suffix ? "mobile" : "desktop"}: best offset dx=${dx}px dy=${dy}px (edge error ${best.err.toFixed(2)} vs ${zero.toFixed(2)} unshifted)`);
  console.log(`  difference image: ${path.relative(ROOT, diff)}`);
  if (!suffix) console.log(`  suggested: film.washAlign = { dx: ${dx}, dy: ${dy}, scale: 1 }`);
}

await check("");
await check("_m");
