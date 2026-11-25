# A.D painting & Special FX. — website

A single-page site for Aaron Dorman's painting and decorative finishes business.
It is built with Vite and plain HTML, CSS and JavaScript, with no framework.

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run check      # static checks on dist/ (links, ids, alt text, metadata, contrast)
npm test           # Playwright end-to-end checks (desktop, mobile, reduced motion, slider)
npm run images     # regenerate responsive images from assets/source/
```

Deploy the `dist/` folder to any static host.

## Where things live

| What | File |
| --- | --- |
| Page content and markup | `index.html` |
| **Social links (footer icons)** | `src/social-links.js`: change each `href` from `/` to the real profile URL |
| Styles and colour tokens | `src/styles.css` |
| Scroll choreography | `src/motion.js` |
| Photo viewer | `src/lightbox.js` |
| Before/after slider | `src/compare.js` (example markup: `tests/fixtures/compare.html`) |
| Original photos | `assets/source/` |

## Adding photos

1. Put the original JPEG in `assets/source/` and run `npm run images`.
2. In `index.html`, use `<x-img name="file-name" alt="…" sizes="…"></x-img>`.
   At build time it becomes a `<picture>` with AVIF, WebP and JPEG sources and fixed dimensions.

**Rock and marble photos:** the "Rock and marble effects" section currently uses illustrative
textures (`public/images/texture-*.webp`) with a note saying so. When photos of Aaron's
decorative work are available, replace the two `<img>` tags in `.finishes__wide` (the full view)
and `.finishes__detail` (a close-up crop of the same photo). Then remove the `.finishes__note`
line and the texture image in the services frame (`data-service-pic="5"`).

**Before-and-after projects:** each job is an `<article class="pair">` in the Projects section.
Copy an existing one, change the two `<x-img>` names and the captions, and add `pair--portrait` for
upright photos. The scroll animation applies automatically.

**Matched before/after photos:** if a pair is taken from the same position, use the draggable
slider markup from `tests/fixtures/compare.html` in the Projects section. Pairs taken from
different angles should stay as labelled side-by-side photos (the `.pair` block).
