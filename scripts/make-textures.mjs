// Generates the illustrative stone textures used in the "Rock and marble effects"
// section (until project photos of Aaron's decorative work are supplied),
// plus the PNG favicon / touch icon.
// Run with: node scripts/make-textures.mjs
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';

await mkdir('public/images', { recursive: true });

const rock = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100">
  <filter id="r" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.009" numOctaves="6" seed="11" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="9" lighting-color="#efe3cf" result="l">
      <feDistantLight azimuth="225" elevation="38"/>
    </feDiffuseLighting>
    <feColorMatrix in="n" type="matrix" values="0.9 0 0 0 0.25  0.75 0 0 0 0.2  0.55 0 0 0 0.14  0 0 0 0 1" result="c"/>
    <feBlend in="l" in2="c" mode="multiply"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#r)"/>
</svg>`;

const marble = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
  <filter id="m" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency="0.0022 0.006" numOctaves="5" seed="4" result="t"/>
    <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.91  0 0 0 0 0.87  -2.6 -0.4 0 0 1.25" result="veins"/>
    <feFlood flood-color="#f3efe8"/>
    <feComposite in="veins" operator="over"/>
  </filter>
  <filter id="v" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency="0.0035 0.0016" numOctaves="4" seed="21"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.24  0 0 0 0 0.22  -7 0 0 0 1.02"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#m)"/>
  <rect width="100%" height="100%" filter="url(#v)" opacity="0.55"/>
</svg>`;

await sharp(Buffer.from(rock)).webp({ quality: 78 }).toFile('public/images/texture-rock.webp');
await sharp(Buffer.from(marble)).webp({ quality: 80 }).toFile('public/images/texture-marble.webp');

const favicon = await readFile('public/favicon.svg');
await sharp(favicon, { density: 600 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(favicon, { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
console.log('textures and icons written');
