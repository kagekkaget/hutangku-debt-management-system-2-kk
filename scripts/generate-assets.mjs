/**
 * Merasterisasi aset SVG di scripts/assets menjadi JPG di public/images.
 * Jalankan: node scripts/generate-assets.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "scripts", "assets");
const outDir = join(root, "public", "images");

const jobs = [
  { svg: "paper-texture.svg", jpg: "paper-texture.jpg", width: 1024 },
  { svg: "login-warung.svg", jpg: "login-warung.jpg", width: 1600 },
  { svg: "ledger-flatlay.svg", jpg: "ledger-flatlay.jpg", width: 1920 },
];

await mkdir(outDir, { recursive: true });

for (const job of jobs) {
  const svg = await readFile(join(srcDir, job.svg));
  const jpg = await sharp(svg, { density: 144 })
    .resize({ width: job.width })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await writeFile(join(outDir, job.jpg), jpg);
  console.log(`✓ ${job.jpg} (${(jpg.length / 1024).toFixed(0)} KB)`);
}
