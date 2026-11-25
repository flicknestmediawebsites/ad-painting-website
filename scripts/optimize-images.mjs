// Generates responsive AVIF / WebP / JPEG versions of the project photos
// in assets/source and writes a manifest with their intrinsic sizes.
// Run with: npm run images
import sharp from 'sharp';
import { readdir, mkdir, writeFile, stat, rm, readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/source';
const OUT = 'public/images';
const WIDTHS = [480, 900, 1400, 2000];

await mkdir(OUT, { recursive: true });
const previous = JSON.parse(await readFile('src/images.json', 'utf8').catch(() => '{}'));
const manifest = {};
const mtime = async (f) => (await stat(f).catch(() => null))?.mtimeMs ?? 0;

for (const file of (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f))) {
  const name = path.parse(file).name;
  // Skip photos whose outputs are newer than the source (incremental rebuilds)
  if (previous[name] && (await mtime(`${OUT}/${name}.jpg`)) > (await mtime(path.join(SRC, file)))) {
    manifest[name] = previous[name];
    continue;
  }
  const input = sharp(path.join(SRC, file)).rotate();
  const { width, height } = await input.metadata();
  const widths = [...new Set(WIDTHS.filter((w) => w < width).concat(width))];

  for (const w of widths) {
    const resized = input.clone().resize({ width: w });
    await Promise.all([
      resized.clone().avif({ quality: 50, effort: 5 }).toFile(`${OUT}/${name}-${w}.avif`),
      resized.clone().webp({ quality: 72 }).toFile(`${OUT}/${name}-${w}.webp`),
    ]);
  }
  // One JPEG for old browsers and social previews
  const jpgW = Math.min(width, 1200);
  await input.clone().resize({ width: jpgW }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  manifest[name] = { width, height, widths };
  console.log(`${name}: ${width}x${height} -> ${widths.join(', ')}`);
}

// Remove outputs for photos that no longer exist
for (const f of await readdir(OUT)) {
  const base = f.replace(/(-\d+)?\.(avif|webp|jpg)$/, '');
  if (!manifest[base]) await rm(`${OUT}/${f}`);
}
await writeFile('src/images.json', JSON.stringify(manifest, null, 2) + '\n');
