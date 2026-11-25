// Generates responsive AVIF / WebP / JPEG versions of the project photos
// in assets/source and writes a manifest with their intrinsic sizes.
// Run with: npm run images
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/source';
const OUT = 'public/images';
const WIDTHS = [480, 800, 1200, 1600, 2000];

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const file of (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f))) {
  const name = path.parse(file).name;
  const input = sharp(path.join(SRC, file)).rotate();
  const { width, height } = await input.metadata();
  const widths = [...new Set(WIDTHS.filter((w) => w < width).concat(width))];

  for (const w of widths) {
    const resized = input.clone().resize({ width: w });
    await Promise.all([
      resized.clone().avif({ quality: 52, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`),
      resized.clone().webp({ quality: 74 }).toFile(`${OUT}/${name}-${w}.webp`),
      resized.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}-${w}.jpg`),
    ]);
  }
  manifest[name] = { width, height, widths };
  console.log(`${name}: ${width}x${height} -> ${widths.join(', ')}`);
}

await writeFile('src/images.json', JSON.stringify(manifest, null, 2) + '\n');
