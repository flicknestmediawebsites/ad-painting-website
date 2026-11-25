// Static checks on every built page (run `npm run build` first):
// unique ids, in-page anchors, images with alt text and files that exist,
// required metadata, and WCAG AA contrast for the palette's text colours.
import { readFileSync, existsSync } from 'node:fs';

const pages = JSON.parse(readFileSync('dist/pages.json', 'utf8'));
const problems = [];
let imageRefs = 0;

for (const p of pages) {
  const html = readFileSync(`dist/${p.file}`, 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`${p.path}: duplicate ids ${[...new Set(dupes)].join(', ')}`);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(target)) problems.push(`${p.path}: link to missing #${target}`);
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(tag)) problems.push(`${p.path}: img without alt`);
    if (!/\swidth="\d+"/.test(tag) && !tag.includes('data-lightbox-img')) problems.push(`${p.path}: img without width`);
  }
  for (const [f] of html.matchAll(/\/images\/[a-z0-9-]+\.(?:avif|webp|jpg)/g)) {
    imageRefs++;
    if (!existsSync(`dist${f}`)) problems.push(`${p.path}: missing ${f}`);
  }
  for (const needle of ['<title>', 'name="description"', 'rel="icon"', 'lang="en-AU"', 'name="viewport"', 'application/ld+json'])
    if (!html.includes(needle)) problems.push(`${p.path}: missing ${needle}`);
  if ((html.match(/<h1\b/g) || []).length !== 1) problems.push(`${p.path}: needs exactly one h1`);
}

const lum = (hex) => hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const [fg, bg, label] of [
  ['#1f1e1c', '#f4efe7', 'ink on paper'], ['#4b4741', '#e9e0d1', 'secondary ink on sand'], ['#8a4630', '#f4efe7', 'timber on paper'],
  ['#8a4630', '#e9e0d1', 'timber on sand'], ['#ffffff', '#8a4630', 'white on timber button'], ['#d39a83', '#171614', 'light timber on charcoal'],
  ['#d39a83', '#2c3a31', 'light timber on forest'], ['#f4efe7', '#2c3a31', 'paper on forest'], ['#f4efe7', '#171614', 'paper on charcoal'],
]) {
  const r = ratio(fg, bg);
  console.log(`${r >= 4.5 ? '✓' : '✗'} ${label}: ${r.toFixed(2)}:1`);
  if (r < 4.5) problems.push(`low contrast: ${label}`);
}
console.log(`${pages.length} pages, ${imageRefs} image references checked`);
if (problems.length) { console.error(problems.map((p) => `✗ ${p}`).join('\n')); process.exit(1); }
console.log('✓ static checks passed');
