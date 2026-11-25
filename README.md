# A.D painting & Special FX. — website

Multi-page static website for a Canberra painting, decorating and special FX business:
a long, scroll-animated homepage, Services (overview plus six service pages), Projects
(before & after plus gallery), About, Contact (map and quote form), Blog (six articles) and a 404 page.

Built with Vite plus a small static page generator: no framework and no server needed.

## Commands

```bash
npm install
npm run build      # build everything into dist/
npm run preview    # preview the built site at http://localhost:4173
npm run check      # static checks (ids, links, alt text, metadata, contrast)
npm test           # Playwright tests (all pages, desktop + mobile, scroll effects, forms…)
npm run package    # build + ad-painting-website-hostinger.zip for upload
```

## Editing content

| What | File |
| --- | --- |
| Business details (name, phone, email, address, map, domain) | `site/data.js` → `business` |
| Services (text, photos, FAQs, before & afters) | `site/data.js` → `services` |
| Before & after projects | `site/data.js` → `pairs` |
| Finished work gallery | `site/data.js` → `gallery` |
| Photo descriptions (alt text) | `site/data.js` → `alt` |
| Blog posts | `site/posts.js` |
| Page layouts | `site/pages.js`; shared header/footer in `site/render.js` |
| Social links (footer icons) | `src/social-links.js` |
| Styles / scroll effects | `src/styles.css`, `src/motion.js` |

**Domain / SEO:** set `business.siteUrl` in `site/data.js` (e.g. `https://www.example.com.au`) to add
canonical links, full social-preview URLs and `sitemap.xml` on the next build.

## Photos

1. Put the original photos in a folder and list them in `PHOTOS` in `scripts/process-photos.py`.
2. `npm run photos -- <folder>` crops phone watermarks, applies a light enhancement and aligns
   slider pairs into `assets/source/`.
3. `npm run images` builds the responsive AVIF/WebP/JPEG versions into `public/images/` (only changed photos).
4. Use the photo name in `site/data.js`.

A before & after pair with `compare: true` uses the draggable slider. Only use it for photos taken from
the same position (the script aligns them); other pairs are shown side by side.

## Hosting (Hostinger)

Run `npm run package` and upload `ad-painting-website-hostinger.zip` to `public_html` in Hostinger's
File Manager, extract it (replace existing files), then delete the zip. The included `.htaccess` sets the
404 page, compression and caching.
