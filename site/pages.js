// Page definitions for the static site generator.
import { business, services, pairs, gallery } from './data.js';
import { posts } from './posts.js';
import { esc, img, shot, icon, btn, pairBlock, contactBand, ratio, addressLine } from './render.js';

const site = (path) => (business.siteUrl ? business.siteUrl + path : path);

const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site(path) })),
});

const formatDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Shared sections ----------
function pageHero({ eyebrow, title, lede, image, actions = '', crumbs = [] }) {
  const trail = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs
        .map(([name, href], i) => (i < crumbs.length - 1 ? `<li><a href="${href}">${esc(name)}</a></li>` : `<li aria-current="page">${esc(name)}</li>`))
        .join('')}</ol></nav>`
    : '';
  return `<section class="page-hero" data-tone="charcoal" data-hero>
  <div class="page-hero__stage">
    <div class="page-hero__media">${img(image, { priority: true, sizes: '100vw', cls: 'page-hero__img' })}</div>
    <div class="page-hero__shade" aria-hidden="true"></div>
    <div class="wrap page-hero__content">
      ${trail}
      <p class="eyebrow eyebrow--light">${esc(eyebrow)}</p>
      <h1 class="page-hero__title">${title}</h1>
      ${lede ? `<p class="page-hero__lede">${lede}</p>` : ''}
      ${actions ? `<div class="hero-actions">${actions}</div>` : ''}
    </div>
  </div>
</section>`;
}

function serviceCards({ heading = true } = {}) {
  return `<ul class="service-cards" role="list">
  ${services
    .map(
      (s, i) => `<li class="service-card-wrap" data-reveal>
      <a class="service-card" href="/services/${s.slug}/" data-tilt>
        <span class="service-card__media">${img(s.hero, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw' })}</span>
        <span class="service-card__glare" aria-hidden="true"></span>
        <span class="service-card__body">
          <span class="service-card__top"><span class="service-card__icon">${icon(s.icon, 22)}</span><span class="service-card__num">${String(i + 1).padStart(2, '0')}</span></span>
          ${heading ? `<h3 class="service-card__title">${esc(s.title)}</h3>` : `<span class="service-card__title">${esc(s.title)}</span>`}
          <span class="service-card__text">${esc(s.short)}</span>
          <span class="service-card__more">Explore ${icon('arrow', 18)}</span>
        </span>
      </a>
    </li>`
    )
    .join('')}
</ul>`;
}

function processSteps() {
  const steps = [
    ['Talk it through', 'Tell us about the job, send a few photos and we’ll arrange a time to see it and provide a quote.'],
    ['Prepare & protect', 'Floors, furniture and gardens are covered. Surfaces are cleaned, repaired, sanded and primed.'],
    ['Paint & finish', 'Quality products applied with care for crisp lines, even colour and a durable finish.'],
    ['Walkthrough', 'We check every detail with you and leave the site clean and tidy.'],
  ];
  return `<section class="process" data-tone="sand" aria-labelledby="process-title">
  <div class="wrap">
    <header class="section-head section-head--center" data-reveal>
      <p class="eyebrow">How we work</p>
      <h2 class="display" id="process-title">A smooth job from first call to final coat</h2>
    </header>
    <ol class="process__steps" role="list">
      ${steps
        .map(
          ([t, d], i) => `<li class="step" data-reveal>
        <div class="step__card" data-tilt>
          <span class="step__num">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="step__title">${t}</h3>
          <p>${d}</p>
        </div>
      </li>`
        )
        .join('')}
    </ol>
  </div>
</section>`;
}

function blogCards(list, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `<ul class="blog-cards" role="list">${list
    .map(
      (p) => `<li data-reveal><a class="blog-card" href="/blog/${p.slug}/" data-tilt>
      <span class="blog-card__media">${img(p.image, { sizes: '(min-width: 960px) 30vw, 92vw' })}</span>
      <span class="blog-card__body">
        <span class="blog-card__meta">${formatDate(p.date)} · ${p.readTime} min read</span>
        <${h} class="blog-card__title">${esc(p.title)}</${h}>
        <span class="blog-card__more">Read article ${icon('arrow', 18)}</span>
      </span>
    </a></li>`
    )
    .join('')}</ul>`;
}

function mapBlock() {
  return `<div class="map-card" data-reveal>
    <iframe class="map-card__frame" src="${business.mapEmbed}" title="Map showing ${esc(business.name)} in ${business.address.suburb}, ${business.address.state}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    <div class="map-card__info">
      ${icon('pin', 22)}
      <div><strong>${esc(business.name)}</strong><br>${esc(addressLine())}</div>
      ${btn('Get directions', business.directions, { variant: 'dark', ext: true, cls: 'btn--small' })}
    </div>
  </div>`;
}

// ---------- Home ----------
function home() {
  const featured = ['marble-feature-wall', 'deck-after', 'living-green', 'brick-home-front', 'stairwell', 'marble-swirl-detail', 'path-after', 'living-green-3', 'rock-texture-detail', 'house-after', 'table-after', 'dining-neutral'];
  const rowA = featured.slice(0, 6), rowB = featured.slice(6);
  const wallRow = (list, dir) =>
    `<div class="wall__row wall__row--${dir}">${[...list, ...list]
      .map((n, i) => `<div class="wall__tile"${i >= list.length ? ' aria-hidden="true"' : ''}>${img(n, { sizes: '(min-width: 960px) 26vw, 60vw', alt: i >= list.length ? '' : undefined })}</div>`)
      .join('')}</div>`;

  return {
    key: 'home',
    path: '/',
    title: `${business.name} | Painters & Decorators Canberra`,
    description:
      'Premium house painting, decorating and special FX finishes in Canberra, ACT. Interior and exterior painting, roof and timber restoration, floor coatings, plaster repairs and marble-effect feature walls.',
    image: 'marble-feature-wall',
    preload: 'living-green',
    body: `
<section class="hero" data-tone="charcoal" data-hero aria-labelledby="hero-title">
  <div class="hero__stage">
    <div class="hero__scene" data-parallax-scene>
      <div class="hero__media layer" data-depth="0">${img('living-green', { priority: true, sizes: '100vw', cls: 'hero__img' })}</div>
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="hero__float hero__float--a layer" data-depth="2" aria-hidden="true">${img('marble-swirl-detail', { sizes: '22vw', alt: '' })}</div>
      <div class="hero__float hero__float--b layer" data-depth="3" aria-hidden="true">${img('deck-after', { sizes: '24vw', alt: '' })}</div>
      <div class="hero__float hero__float--c layer" data-depth="1.5" aria-hidden="true">${img('brick-home-front', { sizes: '18vw', alt: '' })}</div>
    </div>
    <div class="wrap hero__content">
      <p class="hero__brand">${esc(business.name)}</p>
      <h1 class="hero__title" id="hero-title"><span class="hero__line">House painting</span> <span class="hero__line">&amp; decorative</span> <span class="hero__line hero__line--accent">finishes</span></h1>
      <p class="hero__lede">Premium painting, decorating and special FX finishes for Canberra homes and businesses. Interiors, exteriors, timber, floors and feature walls that turn heads.</p>
      <div class="hero-actions">
        ${btn('Request a quote', '/contact/')}
        ${btn('View projects', '/projects/', { variant: 'ghost' })}
      </div>
    </div>
    <div class="hero__scroll" aria-hidden="true"><span></span>Scroll</div>
  </div>
</section>

<section class="statement" data-tone="paper" aria-label="Introduction">
  <div class="wrap">
    <p class="statement__text" data-words>Colour changes everything. From a fresh coat on the whole house to marble-effect feature walls, we bring craftsmanship, care and a premium finish to every surface.</p>
    <div class="statement__chips" data-reveal>
      <span class="chip">${icon('check', 18)} Interiors &amp; exteriors</span>
      <span class="chip">${icon('check', 18)} Roofs, timber &amp; floors</span>
      <span class="chip">${icon('check', 18)} Special FX finishes</span>
      <span class="chip">${icon('pin', 18)} Based in Calwell, ACT</span>
    </div>
  </div>
</section>

<section class="services-home" data-tone="paper" aria-labelledby="services-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal>
      <div><p class="eyebrow">What we do</p><h2 class="display" id="services-title">Services</h2></div>
      <p class="lede">Six specialist services, one team. Everything your home needs to look its best, inside and out.</p>
    </header>
    ${serviceCards()}
  </div>
</section>

<section class="transform" data-tone="sand" aria-labelledby="transform-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal>
      <div><p class="eyebrow">Before &amp; after</p><h2 class="display" id="transform-title">Transformations</h2></div>
      <p class="lede">Drag, scroll and see the difference.</p>
    </header>
    <div class="transform__grid">
      ${pairBlock('patio-floor')}
      ${pairBlock('deck')}
    </div>
    <div class="transform__more">
      ${pairBlock('house')}
      ${pairBlock('path')}
    </div>
    <div class="center-action" data-reveal>${btn('See all projects', '/projects/', { variant: 'dark' })}</div>
  </div>
</section>

<section class="finishes" data-tone="charcoal" data-scene aria-labelledby="finishes-title">
  <div class="wrap finishes__grid">
    <div class="finishes__copy">
      <p class="eyebrow eyebrow--light">Special FX</p>
      <h2 class="display" id="finishes-title">Rock &amp; marble effects</h2>
      <p class="lede">Decorative natural rock-effect and marble-effect finishes for interior and exterior pillars and feature walls. Built by hand in layers, so every surface is one of a kind.</p>
      <ul class="finishes__list" role="list">
        <li>${icon('check', 18)} Marble-effect feature walls</li>
        <li>${icon('check', 18)} Natural rock &amp; stone effects</li>
        <li>${icon('check', 18)} Concrete &amp; polished plaster looks</li>
      </ul>
      ${btn('Explore special finishes', '/services/decorative-finishes/', { variant: 'light' })}
    </div>
    <div class="finishes__stage">
      <div class="finishes__card finishes__card--main layer">${shot('marble-feature-wall', { sizes: '(min-width: 960px) 46vw, 92vw' })}</div>
      <div class="finishes__card finishes__card--a layer">${shot('marble-swirl-detail', { sizes: '(min-width: 960px) 16vw, 36vw' })}</div>
      <div class="finishes__card finishes__card--b layer">${shot('rock-texture-detail', { sizes: '(min-width: 960px) 20vw, 40vw' })}</div>
      <div class="finishes__card finishes__card--c layer">${shot('polished-plaster-detail', { sizes: '(min-width: 960px) 14vw, 30vw' })}</div>
    </div>
  </div>
</section>

<section class="wall" data-tone="forest" data-scene aria-labelledby="wall-title">
  <div class="wrap wall__head" data-reveal>
    <p class="eyebrow eyebrow--light">Our work</p>
    <h2 class="display" id="wall-title">Crafted finishes, every time</h2>
  </div>
  <div class="wall__plane">
    ${wallRow(rowA, 'a')}
    ${wallRow(rowB, 'b')}
  </div>
  <div class="center-action" data-reveal>${btn('View the gallery', '/projects/#gallery', { variant: 'light' })}</div>
</section>

${processSteps()}

<section class="why" data-tone="paper" aria-labelledby="why-title">
  <div class="wrap why__grid">
    <div class="why__media" data-scene>
      <div class="why__img layer">${img('stairwell', { sizes: '(min-width: 960px) 40vw, 92vw' })}</div>
      <div class="why__img why__img--small layer">${img('path-after', { sizes: '(min-width: 960px) 18vw, 40vw' })}</div>
    </div>
    <div class="why__copy">
      <p class="eyebrow">Why choose us</p>
      <h2 class="display" id="why-title">Premium results, without the fuss</h2>
      <ul class="why__list" role="list">
        <li data-reveal>${icon('roller', 26)}<div><h3>Preparation done right</h3><p>The finish is only as good as what is underneath, so preparation is never rushed.</p></div></li>
        <li data-reveal>${icon('marble', 26)}<div><h3>Special FX specialists</h3><p>Marble and rock-effect finishes that most painters simply don’t offer.</p></div></li>
        <li data-reveal>${icon('timber', 26)}<div><h3>One team, many skills</h3><p>Painting, restoration, floors, repairs and decorative work, all handled together.</p></div></li>
        <li data-reveal>${icon('check', 26)}<div><h3>Clean and respectful</h3><p>Your home is protected while we work and left tidy when we finish.</p></div></li>
      </ul>
    </div>
  </div>
</section>

<section class="journal" data-tone="sand" aria-labelledby="journal-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal>
      <div><p class="eyebrow">Colour, paint &amp; decoration</p><h2 class="display" id="journal-title">From the blog</h2></div>
      ${btn('All articles', '/blog/', { variant: 'dark' })}
    </header>
    ${blogCards(posts.slice(0, 3))}
  </div>
</section>

<section class="area" data-tone="paper" aria-labelledby="area-title">
  <div class="wrap area__grid">
    <div class="area__copy" data-reveal>
      <p class="eyebrow">Canberra, ACT</p>
      <h2 class="display" id="area-title">Local painters for Canberra homes</h2>
      <p class="lede">Based in Calwell in Canberra’s south, ${esc(business.name)} brings painting, decorating and special finishes to homes and businesses across the ACT.</p>
      <div class="hero-actions">${btn('Call ' + business.phoneDisplay, business.phoneHref, { iconName: 'phone' })}${btn('Contact us', '/contact/', { variant: 'dark' })}</div>
    </div>
    ${mapBlock()}
  </div>
</section>

${contactBand()}
`,
  };
}

// ---------- Services overview ----------
function servicesIndex() {
  return {
    key: 'services',
    path: '/services/',
    title: `Painting & Decorating Services Canberra | ${business.name}`,
    description:
      'Interior and exterior painting, roof restoration, garage and floor coatings, timber restoration, plaster repairs and marble and rock-effect finishes in Canberra, ACT.',
    image: 'living-green',
    preload: 'living-neutral',
    schema: [breadcrumb([['Home', '/'], ['Services', '/services/']])],
    body: `
${pageHero({
  eyebrow: 'Services',
  title: 'Painting, restoration &amp; special finishes',
  lede: 'Everything your home needs to look its best, inside and out, from one skilled team.',
  image: 'living-neutral',
  actions: btn('Request a quote', '/contact/'),
  crumbs: [['Home', '/'], ['Services', '/services/']],
})}
<section class="services-home" data-tone="paper" aria-labelledby="all-services">
  <div class="wrap">
    <header class="section-head" data-reveal><p class="eyebrow">What we do</p><h2 class="display" id="all-services">Our services</h2></header>
    ${serviceCards()}
  </div>
</section>
${services
  .map(
    (s, i) => `<section class="service-row${i % 2 ? ' service-row--flip' : ''}" data-tone="${i % 2 ? 'sand' : 'paper'}" aria-labelledby="row-${s.slug}">
  <div class="wrap service-row__grid">
    <div class="service-row__media" data-scene><div class="service-row__img layer">${img(s.hero, { sizes: '(min-width: 960px) 46vw, 92vw' })}</div></div>
    <div class="service-row__copy" data-reveal>
      <span class="service-row__num">${String(i + 1).padStart(2, '0')}</span>
      <h2 class="h2" id="row-${s.slug}">${esc(s.title)}</h2>
      <p class="lede">${esc(s.intro)}</p>
      <ul class="ticks" role="list">${s.includes.slice(0, 4).map((x) => `<li>${icon('check', 18)} ${esc(x)}</li>`).join('')}</ul>
      ${btn('Learn more', `/services/${s.slug}/`, { variant: 'dark' })}
    </div>
  </div>
</section>`
  )
  .join('')}
${processSteps()}
${contactBand()}
`,
  };
}

// ---------- Individual service ----------
function servicePage(s) {
  const related = services.filter((x) => x.slug !== s.slug).slice(0, 3);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    serviceType: s.title,
    description: s.seoDescription,
    provider: { '@type': 'HousePainter', name: business.name, telephone: business.phoneIntl },
    areaServed: { '@type': 'City', name: 'Canberra' },
  };
  const galleryItems = s.gallery
    .map((n) => `<li class="gallery__item" data-reveal>${shot(n, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw' })}</li>`)
    .join('');
  return {
    key: 'service',
    path: `/services/${s.slug}/`,
    title: `${s.seoTitle} | ${business.name}`,
    description: s.seoDescription,
    image: s.hero,
    preload: s.hero,
    schema: [breadcrumb([['Home', '/'], ['Services', '/services/'], [s.title, `/services/${s.slug}/`]]), serviceSchema, faqSchema],
    body: `
${pageHero({
  eyebrow: 'Services',
  title: esc(s.title),
  lede: esc(s.short),
  image: s.hero,
  actions: btn('Request a quote', '/contact/') + btn('Call ' + business.phoneDisplay, business.phoneHref, { variant: 'ghost', iconName: 'phone' }),
  crumbs: [['Home', '/'], ['Services', '/services/'], [s.title, `/services/${s.slug}/`]],
})}
<section class="service-intro" data-tone="paper" aria-labelledby="intro-title">
  <div class="wrap service-intro__grid">
    <div data-reveal>
      <p class="eyebrow">Overview</p>
      <h2 class="display" id="intro-title">${esc(s.title)} in Canberra</h2>
    </div>
    <div class="service-intro__copy" data-reveal>
      <p class="lede">${esc(s.intro)}</p>
      <ul class="ticks ticks--two" role="list">${s.includes.map((x) => `<li>${icon('check', 18)} ${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
</section>
<section class="highlights" data-tone="charcoal" aria-label="Why it matters">
  <div class="wrap">
    <ul class="highlights__list" role="list">${s.highlights
      .map(([t, d], i) => `<li data-reveal><div class="highlight" data-tilt><span class="highlight__num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div></li>`)
      .join('')}</ul>
  </div>
</section>
${
  s.pairs.length
    ? `<section class="transform" data-tone="sand" aria-labelledby="work-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal><div><p class="eyebrow">Before &amp; after</p><h2 class="display" id="work-title">The difference</h2></div></header>
    <div class="pairs">${s.pairs.map((k) => pairBlock(k)).join('')}</div>
  </div>
</section>`
    : ''
}
${
  s.gallery.length
    ? `<section class="gallery-section" data-tone="paper" aria-labelledby="gallery-title">
  <div class="wrap">
    <header class="section-head" data-reveal><p class="eyebrow">Gallery</p><h2 class="display" id="gallery-title">Finished work</h2></header>
    <ul class="gallery gallery--masonry" role="list">${galleryItems}</ul>
  </div>
</section>`
    : ''
}
<section class="faq" data-tone="sand" aria-labelledby="faq-title">
  <div class="wrap faq__grid">
    <header data-reveal><p class="eyebrow">FAQs</p><h2 class="display" id="faq-title">Good questions</h2><p class="lede">Anything else? <a class="text-link" href="/contact/">Get in touch</a>.</p></header>
    <div class="faq__list">${s.faqs
      .map(([q, a]) => `<details class="faq__item" data-reveal><summary><span>${esc(q)}</span>${icon('plus', 22)}</summary><p>${esc(a)}</p></details>`)
      .join('')}</div>
  </div>
</section>
<section class="related" data-tone="paper" aria-labelledby="related-title">
  <div class="wrap">
    <header class="section-head" data-reveal><p class="eyebrow">More services</p><h2 class="h2" id="related-title">You might also need</h2></header>
    <ul class="related__list" role="list">${related
      .map((r) => `<li data-reveal><a class="related-card" href="/services/${r.slug}/" data-tilt>${img(r.hero, { sizes: '(min-width: 960px) 28vw, 92vw' })}<span>${esc(r.title)} ${icon('arrow', 18)}</span></a></li>`)
      .join('')}</ul>
  </div>
</section>
${contactBand({ heading: `Planning ${s.title.toLowerCase().startsWith('rock') ? 'a feature finish' : 'a project'}? Let’s talk.` })}
`,
  };
}

// ---------- Projects ----------
function projects() {
  const order = ['patio-floor', 'house', 'deck', 'brick-home', 'weatherboard', 'path', 'bedroom', 'fascia', 'stairs', 'table', 'plant-room-floor', 'letterbox', 'vanity'];
  const tags = ['All', 'Interiors', 'Exteriors', 'Timber', 'Floors', 'Decorative'];
  return {
    key: 'projects',
    path: '/projects/',
    title: `Projects: Before & After Painting Gallery | ${business.name}`,
    description:
      'Before and after painting projects in Canberra: exterior repaints, timber decks, floors, interiors and marble-effect decorative finishes by A.D painting & Special FX.',
    image: 'deck-after',
    preload: 'house-after',
    schema: [breadcrumb([['Home', '/'], ['Projects', '/projects/']])],
    body: `
${pageHero({
  eyebrow: 'Projects',
  title: 'Before &amp; after',
  lede: 'Real transformations, from weathered to wow. Scroll, drag and tap any photo to see it larger.',
  image: 'house-after',
  actions: btn('Request a quote', '/contact/'),
  crumbs: [['Home', '/'], ['Projects', '/projects/']],
})}
<section class="transform transform--all" data-tone="sand" aria-labelledby="pairs-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal><div><p class="eyebrow">Transformations</p><h2 class="display" id="pairs-title">Before &amp; after</h2></div><p class="lede">${order.length} projects.</p></header>
    <div class="pairs">${order.map((k, i) => pairBlock(k, { index: i + 1 })).join('')}</div>
  </div>
</section>
<section class="gallery-section" id="gallery" data-tone="paper" aria-labelledby="gallery-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal><div><p class="eyebrow">Gallery</p><h2 class="display" id="gallery-title">Finished work</h2></div></header>
    <div class="filters" role="group" aria-label="Filter gallery">${tags
      .map((t, i) => `<button class="filter" type="button" data-filter="${t}" aria-pressed="${i === 0}">${t}</button>`)
      .join('')}</div>
    <ul class="gallery gallery--masonry" role="list" data-gallery>${gallery
      .map(([n, tag]) => `<li class="gallery__item" data-tag="${tag}" data-reveal>${shot(n, { sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw' })}</li>`)
      .join('')}</ul>
  </div>
</section>
${contactBand({ heading: 'Want results like these?' })}
`,
  };
}

// ---------- About ----------
function about() {
  return {
    key: 'about',
    path: '/about/',
    title: `About ${business.name} | Canberra Painters & Decorators`,
    description: `Meet Aaron Dorman, owner of ${business.name}: painting, restoration, plaster repairs and decorative marble and rock-effect finishes in Canberra, ACT.`,
    image: 'stairwell',
    preload: 'stairwell-3',
    schema: [breadcrumb([['Home', '/'], ['About', '/about/']])],
    body: `
${pageHero({
  eyebrow: 'About',
  title: 'Craft, care &amp; a passion for finishes',
  lede: 'A Canberra painting and decorating business built on careful preparation and premium results.',
  image: 'stairwell-3',
  actions: btn('Request a quote', '/contact/'),
  crumbs: [['Home', '/'], ['About', '/about/']],
})}
<section class="about" data-tone="paper" aria-labelledby="about-title">
  <div class="wrap about__grid">
    <div class="about__media" data-scene>
      <div class="about__img layer">${img('marble-feature-wall', { sizes: '(min-width: 960px) 44vw, 92vw' })}</div>
      <div class="about__img about__img--small layer">${img('deck-after', { sizes: '(min-width: 960px) 20vw, 44vw' })}</div>
    </div>
    <div class="about__copy" data-reveal>
      <p class="eyebrow">Meet the owner</p>
      <h2 class="display" id="about-title">Hi, I’m Aaron</h2>
      <p class="about__lead">Aaron Dorman is the owner of ${esc(business.name)}, based in Calwell, Canberra.</p>
      <p>Aaron paints homes inside and out, restores roofs, decks and timber, coats garage floors and driveways, and repairs plaster, from patching holes to fixing large cracks. He also creates decorative natural rock-effect and marble-effect finishes for pillars and feature walls.</p>
      <p>Whatever the job, the approach is the same: prepare properly, protect your home, and finish every surface to a standard you’ll be proud of.</p>
      <div class="hero-actions">${btn('Talk about your project', '/contact/')}${btn('See the work', '/projects/', { variant: 'dark' })}</div>
    </div>
  </div>
</section>
<section class="values" data-tone="charcoal" aria-labelledby="values-title">
  <div class="wrap">
    <header class="section-head section-head--center" data-reveal><p class="eyebrow eyebrow--light">What we stand for</p><h2 class="display" id="values-title">Values behind every finish</h2></header>
    <ul class="highlights__list" role="list">
      <li data-reveal><div class="highlight" data-tilt><span class="highlight__num">01</span><h3>Honest advice</h3><p>Straightforward recommendations on the right approach and products for your job.</p></div></li>
      <li data-reveal><div class="highlight" data-tilt><span class="highlight__num">02</span><h3>Attention to detail</h3><p>Crisp lines, smooth surfaces and finishes that look right up close.</p></div></li>
      <li data-reveal><div class="highlight" data-tilt><span class="highlight__num">03</span><h3>Creative finishes</h3><p>From classic colour to marble and rock effects that make a statement.</p></div></li>
    </ul>
  </div>
</section>
${processSteps()}
<section class="services-home" data-tone="paper" aria-labelledby="about-services">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal><div><p class="eyebrow">Services</p><h2 class="display" id="about-services">How we can help</h2></div></header>
    ${serviceCards()}
  </div>
</section>
${contactBand()}
`,
  };
}

// ---------- Contact ----------
function contact() {
  return {
    key: 'contact',
    path: '/contact/',
    title: `Contact & Quotes | ${business.name} Canberra`,
    description: `Request a painting or decorating quote in Canberra. Call ${business.phoneDisplay}, WhatsApp or email ${business.name}. Located at ${addressLine()}.`,
    image: 'house-after',
    preload: 'brick-home-front',
    schema: [breadcrumb([['Home', '/'], ['Contact', '/contact/']])],
    body: `
${pageHero({
  eyebrow: 'Contact',
  title: 'Tell us about your project',
  lede: 'Call, message or email with a few details and photos of the job to get your quote started.',
  image: 'brick-home-front',
  crumbs: [['Home', '/'], ['Contact', '/contact/']],
})}
<section class="contact-page" data-tone="paper" aria-labelledby="contact-title">
  <div class="wrap contact-page__grid">
    <div class="contact-page__info">
      <h2 class="display" id="contact-title">Get in touch</h2>
      <ul class="contact-list" role="list">
        <li data-reveal><a class="contact-line contact-line--primary" href="${business.phoneHref}" data-tilt>${icon('phone', 24)}<span><strong>Call now</strong><span>${business.phoneDisplay}</span></span></a></li>
        <li data-reveal><a class="contact-line" href="${business.whatsapp}" target="_blank" rel="noopener" data-tilt>${icon('whatsapp', 24)}<span><strong>WhatsApp</strong><span>Send photos of the job</span></span><span class="visually-hidden"> (opens in a new tab)</span></a></li>
        <li data-reveal><a class="contact-line" href="mailto:${business.email}" data-tilt>${icon('mail', 24)}<span><strong>Email</strong><span class="break">${business.email}</span></span></a></li>
        <li data-reveal><a class="contact-line" href="${business.directions}" target="_blank" rel="noopener" data-tilt>${icon('pin', 24)}<span><strong>Get directions</strong><span>${esc(addressLine())}</span></span><span class="visually-hidden"> (opens Google Maps in a new tab)</span></a></li>
      </ul>
    </div>
    <form class="quote-form" data-quote-form novalidate aria-labelledby="form-title" data-reveal>
      <h2 class="h2" id="form-title">Quick quote request</h2>
      <p class="quote-form__note">Fill this in and send it straight to us by WhatsApp or email.</p>
      <div class="field"><label for="q-name">Your name</label><input id="q-name" name="name" autocomplete="name" required></div>
      <div class="field-row">
        <div class="field"><label for="q-phone">Phone</label><input id="q-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="q-suburb">Suburb</label><input id="q-suburb" name="suburb" autocomplete="address-level2"></div>
      </div>
      <div class="field"><label for="q-service">Service</label>
        <select id="q-service" name="service"><option value="">Choose a service</option>${services.map((s) => `<option>${esc(s.title)}</option>`).join('')}<option>Something else</option></select>
      </div>
      <div class="field"><label for="q-message">About the job</label><textarea id="q-message" name="message" rows="5" required placeholder="What needs doing, rough size, timing…"></textarea></div>
      <p class="quote-form__error" data-form-error role="alert" hidden>Please add your name and a few details about the job.</p>
      <div class="quote-form__actions">
        <button class="btn btn--accent" type="submit" value="whatsapp"><span class="btn__label">Send via WhatsApp</span><span class="btn__icon">${icon('whatsapp', 18)}</span></button>
        <button class="btn btn--dark" type="submit" value="email"><span class="btn__label">Send via email</span><span class="btn__icon">${icon('mail', 18)}</span></button>
      </div>
    </form>
  </div>
</section>
<section class="area" data-tone="sand" aria-labelledby="find-title">
  <div class="wrap area__grid">
    <div class="area__copy" data-reveal>
      <p class="eyebrow">Find us</p>
      <h2 class="display" id="find-title">Calwell, Canberra</h2>
      <address class="lede">${esc(business.address.street)}<br>${esc(business.address.suburb)} ${business.address.state} ${business.address.postcode}</address>
      <p>Painting and decorating for homes and businesses across the ACT.</p>
    </div>
    ${mapBlock()}
  </div>
</section>
`,
  };
}

// ---------- Blog ----------
function blogIndex() {
  return {
    key: 'blog',
    path: '/blog/',
    title: `Blog: Colour, Paint & Decorating Tips | ${business.name}`,
    description: 'Ideas and advice on paint colours, exterior painting in Canberra, decorative marble finishes, timber care, plaster repairs and floor coatings.',
    image: 'living-green-2',
    preload: 'living-green-2',
    schema: [
      breadcrumb([['Home', '/'], ['Blog', '/blog/']]),
      { '@context': 'https://schema.org', '@type': 'Blog', name: `${business.name} blog`, blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, datePublished: p.date, url: site(`/blog/${p.slug}/`) })) },
    ],
    body: `
${pageHero({
  eyebrow: 'Blog',
  title: 'Colour, paint &amp; decoration',
  lede: 'Ideas, advice and inspiration for Canberra homes.',
  image: 'living-green-2',
  crumbs: [['Home', '/'], ['Blog', '/blog/']],
})}
<section class="journal" data-tone="paper" aria-labelledby="posts-title">
  <div class="wrap">
    <h2 class="visually-hidden" id="posts-title">Articles</h2>
    ${blogCards(posts)}
  </div>
</section>
${contactBand()}
`,
  };
}

function blogPost(p) {
  const service = services.find((s) => s.slug === p.service);
  const others = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  return {
    key: 'post',
    path: `/blog/${p.slug}/`,
    title: `${p.title} | ${business.name}`,
    description: p.description,
    image: p.image,
    preload: p.image,
    ogType: 'article',
    schema: [
      breadcrumb([['Home', '/'], ['Blog', '/blog/'], [p.title, `/blog/${p.slug}/`]]),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.description,
        datePublished: p.date,
        dateModified: p.date,
        author: { '@type': 'Organization', name: business.name },
        publisher: { '@type': 'Organization', name: business.name },
        image: site(`/images/${p.image}.jpg`),
        mainEntityOfPage: site(`/blog/${p.slug}/`),
      },
    ],
    body: `
${pageHero({
  eyebrow: `${formatDate(p.date)} · ${p.readTime} min read`,
  title: esc(p.title),
  image: p.image,
  crumbs: [['Home', '/'], ['Blog', '/blog/'], [p.title, `/blog/${p.slug}/`]],
})}
<article class="post" data-tone="paper">
  <div class="wrap post__grid">
    <div class="post__body prose">${p.body}</div>
    <aside class="post__aside" aria-label="Related service">
      <div class="aside-card" data-tilt>
        ${img(service.hero, { sizes: '(min-width: 960px) 24vw, 92vw' })}
        <p class="eyebrow">Related service</p>
        <h2 class="h3">${esc(service.title)}</h2>
        <p>${esc(service.short)}</p>
        ${btn('Learn more', `/services/${service.slug}/`, { variant: 'dark', cls: 'btn--small' })}
      </div>
    </aside>
  </div>
</article>
<section class="journal" data-tone="sand" aria-labelledby="more-title">
  <div class="wrap">
    <header class="section-head section-head--split" data-reveal><div><p class="eyebrow">Keep reading</p><h2 class="h2" id="more-title">More articles</h2></div>${btn('All articles', '/blog/', { variant: 'dark' })}</header>
    ${blogCards(others)}
  </div>
</section>
${contactBand()}
`,
  };
}

function notFound() {
  return {
    key: 'notfound',
    path: '/404.html',
    file: '404.html',
    noindex: true,
    title: `Page not found | ${business.name}`,
    description: 'Sorry, this page could not be found. Explore painting, restoration and decorative finishes services in Canberra instead.',
    preload: 'marble-swirl-detail',
    body: `
${pageHero({
  eyebrow: '404',
  title: 'This page has been painted over',
  lede: 'The page you were looking for isn’t here. Try one of these instead.',
  image: 'marble-swirl-detail',
  actions: btn('Go to the homepage', '/') + btn('Our services', '/services/', { variant: 'ghost' }),
})}`,
  };
}

export function allPages() {
  return [home(), servicesIndex(), ...services.map(servicePage), projects(), about(), contact(), blogIndex(), ...posts.map(blogPost), notFound()];
}
