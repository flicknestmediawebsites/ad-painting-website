// Shared page template, components and helpers for the static site generator.
import { readFileSync } from 'node:fs';
import { business, nav, services, pairs, alt as altText } from './data.js';

const images = JSON.parse(readFileSync(new URL('../src/images.json', import.meta.url), 'utf8'));

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const meta = (name) => {
  const m = images[name];
  if (!m) throw new Error(`Unknown image "${name}"`);
  return m;
};
export const fullSrc = (name) => `/images/${name}-${meta(name).widths.at(-1)}.webp`;
export const jpgSrc = (name) => `/images/${name}.jpg`;

/** Responsive <picture> with reserved dimensions. */
export function img(name, { alt = altText[name] ?? '', sizes = '100vw', cls = '', priority = false, style = '' } = {}) {
  const m = meta(name);
  const set = (ext) => m.widths.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(', ');
  return (
    `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
    `<img src="${jpgSrc(name)}" width="${m.width}" height="${m.height}" alt="${esc(alt)}"` +
    (cls ? ` class="${cls}"` : '') +
    (style ? ` style="${style}"` : '') +
    (priority ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') +
    ' decoding="async"></picture>'
  );
}

/** Photo that opens larger in the viewer. */
export function shot(name, { sizes, label = '', cls = '', extra = '' } = {}) {
  const m = meta(name);
  const a = altText[name] ?? '';
  return (
    `<button class="shot ${cls}" type="button" data-shot data-full="${fullSrc(name)}" data-w="${m.width}" data-h="${m.height}" aria-label="View larger: ${esc(a)}">` +
    img(name, { sizes }) +
    (label ? `<span class="label${label === 'After' ? ' label--after' : ''}">${label}</span>` : '') +
    extra +
    '</button>'
  );
}

export const ratio = (name) => (meta(name).width / meta(name).height).toFixed(4);

// ---------- Icons ----------
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>',
  whatsapp: '<path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A7.8 7.8 0 1 1 12 19.8zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3z" fill="currentColor"/>',
  mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.2 7v10h15.6V7z" fill="currentColor"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/>',
  roller: '<rect x="3" y="3.5" width="15" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M18 6.5h2.5v5H11v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="9.5" y="14.5" width="3" height="7" rx="1" fill="currentColor"/>',
  roof: '<path d="M2.5 12 12 4l9.5 8M5 10.2V20h14v-9.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 20v-5h5v5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  floor: '<path d="M3 17 9 7h12l-6 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 13.7h12M11.5 7l-3.6 10M16.5 7 13 17" stroke="currentColor" stroke-width="1.2"/>',
  timber: '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 9.3h18M3 14.7h18M9 4v5.3M15 9.3v5.4M8 14.7V20" stroke="currentColor" stroke-width="1.4"/>',
  trowel: '<path d="M4 15 15 4l5 5-11 11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 6l5 5" stroke="currentColor" stroke-width="1.6"/>',
  marble: '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 15c3-1 4-5 7-6s5 1 7-1M8 21c1-3 3-4 5-4s4-1 5-3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  check: '<path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  chevron: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
};
export const icon = (name, size = 24, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

// ---------- Buttons ----------
export const btn = (label, href, { variant = 'accent', ext = false, iconName = 'arrow', cls = '' } = {}) =>
  `<a class="btn btn--${variant} ${cls}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>` +
  `<span class="btn__label">${label}</span>${iconName ? `<span class="btn__icon">${icon(iconName, 18)}</span>` : ''}` +
  (ext ? '<span class="visually-hidden"> (opens in a new tab)</span>' : '') +
  '</a>';

// ---------- Before & after ----------
export function pairBlock(key, { index, sizes } = {}) {
  const p = pairs[key];
  if (!p) throw new Error(`Unknown pair ${key}`);
  const portrait = meta(p.before).height > meta(p.before).width;
  const num = index ? `<span class="pair__num" aria-hidden="true">${String(index).padStart(2, '0')}</span>` : '';
  const head = `<div class="pair__head">${num}<h3 class="pair__title">${esc(p.title)}</h3><span class="tag">${esc(p.tag)}</span></div>`;

  if (p.compare) {
    const m = meta(p.after);
    return `<article class="pair pair--compare" data-scene data-tags="${esc(p.tag)}">
      ${head}
      <div class="compare" data-compare>
        <div class="compare__frame" style="aspect-ratio:${m.width} / ${m.height}">
          ${img(p.after, { sizes: sizes || '(min-width: 960px) 40vw, 92vw', cls: 'compare__after' })}
          <div class="compare__before">${img(p.before, { sizes: sizes || '(min-width: 960px) 40vw, 92vw' })}</div>
          <span class="label">Before</span><span class="label label--after">After</span>
          <div class="compare__handle" role="slider" tabindex="0" aria-label="Before and after divider: ${esc(p.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <span class="compare__knob" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
          </div>
        </div>
        <p class="compare__hint" aria-hidden="true">Drag to compare</p>
      </div>
    </article>`;
  }

  const sz = sizes || (portrait ? '(min-width: 960px) 24vw, 46vw' : '(min-width: 960px) 44vw, 92vw');
  return `<article class="pair${portrait ? ' pair--portrait' : ''}" data-scene data-tags="${esc(p.tag)}">
    ${head}
    <div class="pair__grid">
      <div class="pair__item pair__item--before">${shot(p.before, { sizes: sz, label: 'Before' })}</div>
      <div class="pair__item pair__item--after">${shot(p.after, { sizes: sz, label: 'After' })}</div>
    </div>
  </article>`;
}

// ---------- Contact band (used at the end of most pages) ----------
export function contactBand({ heading = 'Tell us about your project', id = 'quote' } = {}) {
  return `<section class="contact-band" id="${id}" data-tone="charcoal" aria-labelledby="${id}-title">
  <div class="wrap contact-band__inner">
    <div class="contact-band__copy" data-reveal>
      <p class="eyebrow eyebrow--light">Request a quote</p>
      <h2 class="display" id="${id}-title">${heading}</h2>
      <p class="lede">Send a few details and photos of the job. We’ll get back to you to talk it through and arrange a quote.</p>
    </div>
    <ul class="contact-cards" role="list">
      <li><a class="contact-card contact-card--primary" href="${business.phoneHref}" data-tilt>${icon('phone', 26, 'contact-card__icon')}<span class="contact-card__label">Call now</span><span class="contact-card__value">${business.phoneDisplay}</span></a></li>
      <li><a class="contact-card" href="${business.whatsapp}" target="_blank" rel="noopener" data-tilt>${icon('whatsapp', 26, 'contact-card__icon')}<span class="contact-card__label">WhatsApp</span><span class="contact-card__value">Send photos of the job</span><span class="visually-hidden"> (opens in a new tab)</span></a></li>
      <li><a class="contact-card" href="mailto:${business.email}" data-tilt>${icon('mail', 26, 'contact-card__icon')}<span class="contact-card__label">Email</span><span class="contact-card__value contact-card__value--email">${business.email}</span></a></li>
    </ul>
  </div>
</section>`;
}

// ---------- Layout ----------
const addressLine = () => {
  const a = business.address;
  return `${a.street}, ${a.suburb} ${a.state} ${a.postcode}`;
};

function header(path) {
  const current = (href) => (path === href || (href !== '/' && path.startsWith(href)) ? ' aria-current="page"' : '');
  const servicesMenu = services
    .map((s) => `<li><a href="/services/${s.slug}/"${current(`/services/${s.slug}/`)}>${icon(s.icon, 20)}<span>${esc(s.title)}</span></a></li>`)
    .join('');
  const items = nav
    .map((n) =>
      n.href === '/services/'
        ? `<li class="has-menu">
            <a href="/services/"${current('/services/')}>Services</a>
            <button class="submenu-toggle" type="button" aria-expanded="false" aria-controls="services-menu" aria-label="Show services">${icon('chevron', 16)}</button>
            <ul class="submenu" id="services-menu">${servicesMenu}</ul>
          </li>`
        : `<li><a href="${n.href}"${current(n.href)}>${n.label}</a></li>`
    )
    .join('');
  return `<header class="site-header">
  <div class="site-header__bar">
    <a class="brand" href="/" aria-label="${esc(business.name)} home">
      <span class="brand__mark" aria-hidden="true">AD</span>
      <span class="brand__name">${esc(business.name)}</span>
    </a>
    <nav class="site-nav" aria-label="Main">
      <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-menu" data-nav-toggle>
        <span class="site-nav__toggle-lines" aria-hidden="true"></span><span class="site-nav__toggle-label">Menu</span>
      </button>
      <ul class="site-nav__list" id="site-menu" data-nav-list>
        ${items}
        <li class="site-nav__quote"><a href="/contact/">Request a quote</a></li>
      </ul>
    </nav>
    ${btn('Request a quote', '/contact/', { cls: 'btn--small site-header__quote', iconName: '' })}
  </div>
</header>`;
}

function footer(social) {
  const a = business.address;
  return `<footer class="site-footer" data-tone="charcoal">
  <div class="wrap">
    <div class="site-footer__top">
      <div class="site-footer__brand">
        <a class="brand brand--light" href="/"><span class="brand__mark" aria-hidden="true">AD</span><span class="brand__name">${esc(business.name)}</span></a>
        <p>${esc(business.tagline)}.</p>
        <ul class="social" role="list" aria-label="Social media">${social}</ul>
      </div>
      <nav class="site-footer__col" aria-label="Services">
        <h2 class="site-footer__heading">Services</h2>
        <ul role="list">${services.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.title)}</a></li>`).join('')}</ul>
      </nav>
      <nav class="site-footer__col" aria-label="Company">
        <h2 class="site-footer__heading">Explore</h2>
        <ul role="list">${nav.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
      </nav>
      <div class="site-footer__col">
        <h2 class="site-footer__heading">Contact</h2>
        <address>
          <a href="${business.phoneHref}">${business.phoneDisplay}</a><br>
          <a href="mailto:${business.email}">${business.email}</a><br>
          <span>${esc(a.street)}<br>${esc(a.suburb)} ${a.state} ${a.postcode}</span>
        </address>
        <a class="text-link text-link--light" href="${business.directions}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens Google Maps in a new tab)</span></a>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p>© <span data-year>2026</span> ${esc(business.name)} · Painters and decorators in Canberra, ACT</p>
      <a class="text-link text-link--light" href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </div>
  </div>
</footer>`;
}

export function localBusinessSchema() {
  const a = business.address;
  const s = {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    name: business.name,
    description: 'House painting, roof and timber restoration, floor coatings, plaster repairs and decorative marble and rock-effect finishes in Canberra, ACT.',
    telephone: business.phoneIntl,
    email: business.email,
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.suburb, addressRegion: a.state, postalCode: a.postcode, addressCountry: a.country },
    areaServed: { '@type': 'City', name: 'Canberra' },
    hasMap: business.directions,
    knowsAbout: services.map((x) => x.title),
  };
  if (business.siteUrl) {
    s.url = business.siteUrl + '/';
    s.image = business.siteUrl + jpgSrc('marble-feature-wall');
  }
  return s;
}

export function layout(page, assets, social) {
  const url = business.siteUrl ? business.siteUrl + page.path : '';
  const image = page.image ? jpgSrc(page.image) : jpgSrc('living-green');
  const schemas = [localBusinessSchema(), ...(page.schema || [])];
  const preload = page.preload
    ? (() => {
        const m = meta(page.preload);
        return `<link rel="preload" as="image" type="image/avif" imagesrcset="${m.widths.map((w) => `/images/${page.preload}-${w}.avif ${w}w`).join(', ')}" imagesizes="100vw" fetchpriority="high">`;
      })()
    : '';
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${url ? `<link rel="canonical" href="${url}">` : ''}
<meta name="theme-color" content="#171614">
<meta name="robots" content="${page.noindex ? 'noindex' : 'index, follow'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(business.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:image" content="${business.siteUrl ? business.siteUrl : ''}${image}">
${url ? `<meta property="og:url" content="${url}">` : ''}
<meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image">
<meta name="geo.region" content="AU-ACT">
<meta name="geo.placename" content="Calwell, Canberra">
${preload}
${assets.css.map((c) => `<link rel="stylesheet" href="${c}">`).join('\n')}
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')</script>
${schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
</head>
<body class="page-${page.key}" id="top">
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-bg" aria-hidden="true"></div>
${header(page.path)}
<main id="main">
${page.body}
</main>
${footer(social)}
<dialog class="lightbox" aria-label="Photo viewer" data-lightbox>
  <figure class="lightbox__figure"><img class="lightbox__img" alt="" data-lightbox-img></figure>
  <button class="lightbox__btn lightbox__close" type="button" data-lightbox-close aria-label="Close photo viewer">${icon('plus', 24, 'icon--close')}</button>
  <button class="lightbox__btn lightbox__prev" type="button" data-lightbox-prev aria-label="Previous photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
  <button class="lightbox__btn lightbox__next" type="button" data-lightbox-next aria-label="Next photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
  <p class="lightbox__count" data-lightbox-count aria-live="polite"></p>
</dialog>
${assets.js.map((j) => `<script type="module" src="${j}"></script>`).join('\n')}
</body>
</html>
`;
}

export { addressLine };
