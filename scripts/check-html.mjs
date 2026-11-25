// Static checks on the built page (run `npm run build` first):
// unique ids, in-page links resolve, images have alt text and exist,
// required metadata is present, and key colour pairs meet WCAG AA contrast.
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const problems = [];

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) problems.push(`duplicate ids: ${dupes.join(', ')}`);

for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(target)) problems.push(`link to missing #${target}`);
}

for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\salt="/.test(tag)) problems.push(`img without alt: ${tag.slice(0, 80)}`);
  if (!/\swidth="\d+"/.test(tag) && !tag.includes('data-lightbox-img')) problems.push(`img without width: ${tag.slice(0, 80)}`);
}

const files = new Set([...html.matchAll(/images\/[a-z0-9-]+\.(?:avif|webp|jpg)/g)].map((m) => m[0]));
for (const f of files) if (!existsSync(`dist/${f}`)) problems.push(`missing file ${f}`);

for (const needle of ['<title>', 'name="description"', 'rel="icon"', 'lang="en-AU"', 'name="viewport"']) {
  if (!html.includes(needle)) problems.push(`missing ${needle}`);
}

// WCAG contrast for the palette's text pairs
const lum = (hex) => {
  const c = hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['#22211f', '#f4efe7', 'ink on paper'],
  ['#4b4741', '#f4efe7', 'secondary ink on paper'],
  ['#4b4741', '#ebe3d6', 'secondary ink on About background'],
  ['#8a4630', '#f4efe7', 'timber accent on paper'],
  ['#8a4630', '#ebe3d6', 'timber accent on About background'],
  ['#ffffff', '#8a4630', 'white on timber button'],
  ['#c07f67', '#1d1c1a', 'light timber on charcoal'],
  ['#f4efe7', '#1d1c1a', 'paper on charcoal'],
];
for (const [fg, bg, label] of pairs) {
  const r = ratio(fg, bg);
  console.log(`${r >= 4.5 ? '✓' : '✗'} ${label}: ${r.toFixed(2)}:1`);
  if (r < 4.5) problems.push(`low contrast: ${label}`);
}

console.log(`${ids.length} ids, ${files.size} image files referenced`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ static checks passed');
