import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { socialLinks, socialIcons } from './src/social-links.js';

const images = JSON.parse(readFileSync(new URL('./src/images.json', import.meta.url), 'utf8'));

const attr = (s, name) => (s.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];
const has = (s, name) => new RegExp(`\\s${name}(\\s|>|$)`).test(s);

/**
 * <x-img name="house-after-white" alt="…" sizes="…" class="…" [priority] [pclass="…"]></x-img>
 * becomes a <picture> with AVIF/WebP/JPEG sources and reserved dimensions.
 */
function renderImage(tag) {
  const name = attr(tag, 'name');
  const meta = images[name];
  if (!meta) throw new Error(`x-img: unknown image "${name}"`);
  const alt = attr(tag, 'alt');
  if (alt === undefined) throw new Error(`x-img: "${name}" needs alt`);
  const sizes = attr(tag, 'sizes') || '100vw';
  const cls = attr(tag, 'class');
  const pcls = attr(tag, 'pclass');
  const style = attr(tag, 'style');
  const priority = has(tag, 'priority');
  const set = (ext) => meta.widths.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallbackW = meta.widths.find((w) => w >= 1200) || meta.widths.at(-1);
  return (
    `<picture${pcls ? ` class="${pcls}"` : ''}>` +
    `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
    `<img src="/images/${name}-${fallbackW}.jpg" srcset="${set('jpg')}" sizes="${sizes}"` +
    ` width="${meta.width}" height="${meta.height}" alt="${alt}"` +
    (cls ? ` class="${cls}"` : '') +
    (style ? ` style="${style}"` : '') +
    (priority ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') +
    ' decoding="async"></picture>'
  );
}

function renderSocial() {
  return socialLinks
    .map(
      ({ name, icon, href }) =>
        `<li><a class="social__link" href="${href}" aria-label="${name}">` +
        `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${socialIcons[icon]}</svg></a></li>`
    )
    .join('');
}

const sitePlugin = {
  name: 'ad-site-html',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html
        .replace(/<x-img\b[^>]*><\/x-img>/g, renderImage)
        .replace('<!-- social-links -->', renderSocial())
        .replace(/\{\{full:([a-z0-9-]+)\}\}/g, (_, n) => `/images/${n}-${images[n].widths.at(-1)}.webp`)
        .replace(/\{\{w:([a-z0-9-]+)\}\}/g, (_, n) => images[n].width)
        .replace(/\{\{h:([a-z0-9-]+)\}\}/g, (_, n) => images[n].height);
    },
  },
};

export default defineConfig({
  plugins: [sitePlugin],
  build: { target: 'es2019', cssMinify: true },
});
