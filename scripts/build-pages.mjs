// Renders every page into dist/ after Vite has built the CSS and JS.
// Also writes robots.txt, sitemap.xml (when business.siteUrl is set) and .htaccess for Apache/Hostinger.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { allPages } from '../site/pages.js';
import { layout } from '../site/render.js';
import { business } from '../site/data.js';
import { socialLinks, socialIcons } from '../src/social-links.js';

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const entry = manifest['src/main.js'];
const assets = { js: [`/${entry.file}`], css: (entry.css || []).map((c) => `/${c}`) };

const social = socialLinks
  .map(
    ({ name, icon, href }) =>
      `<li><a class="social__link" href="${href}" aria-label="${name}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${socialIcons[icon]}</svg></a></li>`
  )
  .join('');

const pages = allPages();
const written = [];
for (const page of pages) {
  const file = page.file || `${page.path.replace(/^\//, '')}index.html`;
  const out = `dist/${file}`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(page, assets, social));
  written.push({ path: page.path, file, title: page.title, noindex: !!page.noindex });
}
writeFileSync('dist/pages.json', JSON.stringify(written, null, 2));

const indexable = written.filter((p) => !p.noindex);
writeFileSync(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\n${business.siteUrl ? `\nSitemap: ${business.siteUrl}/sitemap.xml\n` : ''}`
);
if (business.siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
      .map((p) => `  <url><loc>${business.siteUrl}${p.path}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`
  );
}

writeFileSync(
  'dist/.htaccess',
  `# A.D painting & Special FX. – Apache settings (Hostinger)
ErrorDocument 404 /404.html
DirectoryIndex index.html
Options -Indexes

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/json text/plain application/xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/avif "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

AddType image/avif .avif
AddType image/webp .webp
`
);
console.log(`${written.length} pages written${business.siteUrl ? ' + sitemap.xml' : ' (set business.siteUrl for canonical links and sitemap.xml)'}`);
