// End-to-end checks with Playwright (Chromium) against the built site.
// Usage: npm run build && npm test
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const SITE = 'http://localhost:4317';
const pages = JSON.parse(readFileSync('dist/pages.json', 'utf8'));
let passes = 0, failures = 0;
const check = (cond, msg) => {
  if (cond) { passes++; console.log(`  ✓ ${msg}`); } else { failures++; console.log(`  ✗ ${msg}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function touchSwipe(cdp, x, y, dx, dy, steps = 12) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }] });
    await sleep(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function settle(page) {
  await sleep(150);
  let last = -1, stable = 0;
  for (let i = 0; i < 60 && stable < 2; i++) {
    const y = await page.evaluate(() => scrollY);
    stable = y === last ? stable + 1 : 0;
    last = y;
    await sleep(100);
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
const scrollTo = async (page, y) => { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await settle(page); };
const topOf = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
const local = (u) => u.startsWith(SITE);

async function crawl(browser) {
  console.log('\nAll pages (desktop 1440×900)');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const titles = new Set(), descs = new Set();
  const known = new Set(pages.map((p) => p.path));
  const links = new Set();
  let allOk = true;
  for (const p of pages) {
    const errors = [];
    const onErr = (e) => errors.push(e.message || String(e));
    const onCon = (m) => m.type() === 'error' && !/maps|google/i.test(m.text()) && errors.push(m.text());
    const onRes = (r) => local(r.url()) && r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`);
    page.on('pageerror', onErr); page.on('console', onCon); page.on('response', onRes);
    await page.goto(SITE + p.path, { waitUntil: 'load' });
    await sleep(300);
    const info = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      h1: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      imgsOk: [...document.querySelectorAll('main img')].every((i) => i.getAttribute('width') && i.getAttribute('height') && i.hasAttribute('alt')),
      text: document.body.innerText,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } }),
      robots: document.querySelector('meta[name=robots]')?.content,
    }));
    page.off('pageerror', onErr); page.off('console', onCon); page.off('response', onRes);
    const problems = [];
    if (!info.title || titles.has(info.title)) problems.push('title missing/duplicate');
    if (info.desc.length < 50 || descs.has(info.desc)) problems.push('description missing/duplicate');
    if (info.h1 !== 1) problems.push(`${info.h1} h1s`);
    if (info.overflow > 0) problems.push(`overflow ${info.overflow}px`);
    if (!info.imgsOk) problems.push('image without size/alt');
    if (p.path !== '/about/' && /Aaron|Dorman/.test(info.text)) problems.push('owner name outside About');
    if (info.ld.some((x) => x === null)) problems.push('invalid JSON-LD');
    if (!info.ld.some((x) => x?.['@type'] === 'HousePainter' && x.address?.streetAddress === '26 Wettenhall Circuit')) problems.push('LocalBusiness schema missing');
    if (errors.length) problems.push(errors.join('; '));
    titles.add(info.title); descs.add(info.desc);
    info.links.filter((h) => h.startsWith('/')).forEach((h) => links.add(h.split('#')[0]));
    if (problems.length) allOk = false;
    check(!problems.length, `${p.path} ${problems.length ? '— ' + problems.join(', ') : ''}`);
    if (p.path === '/about/') check(/Aaron Dorman is the owner/.test(info.text), 'About introduces Aaron Dorman as owner');
    if (p.path.startsWith('/services/') && p.path !== '/services/') check(info.ld.some((x) => x?.['@type'] === 'FAQPage') && info.ld.some((x) => x?.['@type'] === 'Service'), `${p.path} has Service + FAQ schema`);
    if (p.path.startsWith('/blog/') && p.path !== '/blog/') check(info.ld.some((x) => x?.['@type'] === 'BlogPosting'), `${p.path} has BlogPosting schema`);
    if (p.noindex) check(info.robots === 'noindex', '404 page is noindex');
  }
  const broken = [...links].filter((h) => h && !known.has(h) && !existsSync('dist' + h));
  check(broken.length === 0, `all internal links resolve (${links.size} checked)${broken.length ? ': ' + broken.join(', ') : ''}`);
  check(existsSync('dist/robots.txt') && existsSync('dist/.htaccess') && existsSync('dist/404.html'), 'robots.txt, .htaccess and 404.html present');
  await page.close();
  return allOk;
}

async function mobileCrawl(browser) {
  console.log('\nAll pages (iPhone 13)');
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const bad = [];
  for (const p of pages) {
    await page.goto(SITE + p.path, { waitUntil: 'load' });
    const r = await page.evaluate(() => ({ o: document.documentElement.scrollWidth - innerWidth, h1: document.querySelector('h1').getBoundingClientRect() }));
    if (r.o > 0 || r.h1.left < 15 || r.h1.right > 390 - 15) bad.push(`${p.path} (overflow ${r.o}, h1 ${Math.round(r.h1.left)}–${Math.round(r.h1.right)})`);
  }
  check(!bad.length, `no sideways scrolling and headings keep the gutter on every page${bad.length ? ': ' + bad.join(', ') : ''}`);
  await ctx.close();
}

async function home(browser) {
  console.log('\nHomepage scroll experience (desktop)');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(SITE + '/', { waitUntil: 'networkidle' });
  const probe = () => page.evaluate(() => {
    const m = (s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform);
    return {
      stageTop: Math.round(document.querySelector('.hero__stage').getBoundingClientRect().top),
      sheetTop: Math.round(document.querySelector('.statement').getBoundingClientRect().top),
      mediaY: +m('.hero__media').m42.toFixed(1), contentY: +m('.hero__content').m42.toFixed(1), floatY: +m('.hero__float--b').m42.toFixed(1),
      bg: getComputedStyle(document.querySelector('.page-bg')).backgroundColor, ink: document.documentElement.dataset.ink,
    };
  });
  check(await page.evaluate(() => document.documentElement.classList.contains('tones')), 'scroll colour system active');
  await scrollTo(page, 0); const a0 = await probe();
  await scrollTo(page, 250); const a1 = await probe();
  check(a1.stageTop === 0, 'hero photo holds in view at the start of scrolling');
  check(a1.sheetTop < a0.sheetTop && a1.sheetTop < 900, `next section rises over the hero (${a0.sheetTop} → ${a1.sheetTop}px)`);
  check(a1.contentY < a0.contentY - 30, 'headline moves upward');
  check(a1.floatY < a1.mediaY - 20, `floating photos move faster than the background (float ${a1.floatY}px, photo ${a1.mediaY}px)`);
  await scrollTo(page, 0); const b0 = await probe();
  check(Math.abs(b0.contentY - a0.contentY) < 1 && Math.abs(b0.mediaY - a0.mediaY) < 1, 'scene reverses exactly when scrolling back up');

  // Colour effect: page background changes through the sections
  const colours = {};
  for (const sel of ['.statement', '.finishes', '.wall', '.process']) {
    await scrollTo(page, (await topOf(page, sel)) + 200);
    colours[sel] = await probe();
  }
  check(colours['.finishes'].bg === 'rgb(23, 22, 20)' && colours['.finishes'].ink === 'light', 'background turns charcoal with light text for Special FX');
  check(colours['.wall'].bg === 'rgb(44, 58, 49)' && colours['.wall'].ink === 'light', 'background turns forest green for the photo wall');
  check(colours['.process'].ink === 'dark' && colours['.process'].bg === 'rgb(233, 224, 209)', 'background returns to warm sand with dark text');
  const midY = (await topOf(page, '.finishes')) - 900 * 0.55 + 900 * 0.12;
  await scrollTo(page, midY);
  const mid = await probe();
  check(!['rgb(23, 22, 20)', 'rgb(233, 224, 209)', 'rgb(244, 239, 231)'].includes(mid.bg), `colours blend smoothly between sections (${mid.bg})`);

  // Text contrast stays readable during a blend
  const contrastOk = await page.evaluate(() => {
    const parse = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const L = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const bg = L(parse(getComputedStyle(document.querySelector('.page-bg')).backgroundColor));
    const els = [...document.querySelectorAll('main > [data-tone]:not(.contact-band) h2')].filter((h) => { const r = h.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; });
    return els.every((h) => { const fg = L(parse(getComputedStyle(h).color)); const [a, b] = [fg, bg].sort((x, y) => y - x); return (a + .05) / (b + .05) >= 3; });
  });
  check(contrastOk, 'headings keep at least 3:1 contrast mid-transition');

  // Decorative cards move at different depths; photo wall rows move in opposite directions
  const fin = await topOf(page, '.finishes');
  const cardY = () => page.evaluate(() => ['.finishes__card--main', '.finishes__card--b'].map((s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m42));
  await scrollTo(page, fin - 600); const [m1, d1] = await cardY();
  await scrollTo(page, fin + 300); const [m2, d2] = await cardY();
  check(Math.abs(d2 - d1) > Math.abs(m2 - m1) * 2, 'close-up finish cards rise faster than the main photo');
  const wall = await topOf(page, '.wall');
  const rowX = () => page.evaluate(() => ['.wall__row--a', '.wall__row--b'].map((s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m41));
  await scrollTo(page, wall - 600); const [ra1, rb1] = await rowX();
  await scrollTo(page, wall + 200); const [ra2, rb2] = await rowX();
  check(ra2 < ra1 && rb2 > rb1, 'photo wall rows slide in opposite directions with scroll');

  // Native scrolling
  await scrollTo(page, 0);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 700);
  await settle(page);
  const yw = await page.evaluate(() => scrollY);
  check(yw > 300, `mouse wheel scrolls normally (${yw}px)`);
  await sleep(600);
  check((await page.evaluate(() => scrollY)) === yw, 'no snapping or scroll trapping');

  // Hover effects
  await scrollTo(page, 0);
  const btn = page.locator('.hero-actions .btn').first();
  const before = await btn.evaluate((b) => getComputedStyle(b).transform);
  await btn.hover(); await sleep(450);
  const after = await btn.evaluate((b) => getComputedStyle(b).transform);
  check(before !== after, 'buttons lift on hover');
  await scrollTo(page, (await topOf(page, '.service-cards')) - 100);
  const card = page.locator('.service-card').first();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 4 }); await sleep(200);
  check(await card.evaluate((c) => getComputedStyle(c).transform !== 'none' && c.style.getPropertyValue('--ry') !== '0deg'), 'service cards tilt in 3D under the pointer');

  // Quote buttons and contact links
  const hrefs = await page.$$eval('.contact-band a', (a) => a.map((x) => x.getAttribute('href')));
  for (const h of ['tel:+61424740100', 'https://wa.me/61424740100', 'mailto:adpaintingdecorating@gmail.com']) check(hrefs.includes(h), `contact link ${h}`);
  check(await page.$$eval('.hero .hero-actions a', (a) => a.map((x) => x.getAttribute('href')).join()) === '/contact/,/projects/', 'hero actions go to Contact and Projects');
  check((await page.$$eval('.social a', (a) => a.map((x) => x.getAttribute('href')))).every((h) => h === '/'), 'social icons point to / until profile links are supplied');

  // Keyboard
  await page.reload({ waitUntil: 'load' });
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.classList.contains('skip-link')), 'skip link is first on Tab');
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), 'keyboard focus is visible');
  await page.close();
}

async function navigation(browser) {
  console.log('\nNavigation');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(SITE + '/services/house-painting/', { waitUntil: 'load' });
  check(await page.getAttribute('.site-nav__list a[href="/services/"]', 'aria-current') === 'page', 'current section highlighted in the header');
  await page.click('.submenu-toggle');
  check(await page.locator('#services-menu a').first().isVisible(), 'services dropdown opens');
  check((await page.$$eval('#services-menu a', (a) => a.length)) === 6, 'dropdown lists all six services');
  await page.keyboard.press('Escape');
  await page.mouse.move(10, 600);
  await sleep(350);
  check(!(await page.locator('#services-menu').evaluate((e) => e.classList.contains('is-open'))) && (await page.evaluate(() => document.activeElement.classList.contains('submenu-toggle'))), 'Escape closes the dropdown and returns focus');
  await page.click('.site-header__quote');
  await page.waitForURL('**/contact/');
  check(true, 'header "Request a quote" opens the Contact page');
  await page.close();

  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await ctx.newPage();
  await m.goto(SITE + '/', { waitUntil: 'load' });
  await m.tap('[data-nav-toggle]'); await sleep(300);
  check(await m.locator('.site-nav__quote a').isVisible(), 'mobile menu opens with a quote action');
  await m.tap('.submenu-toggle'); await sleep(200);
  check(await m.locator('#services-menu a[href="/services/timber-restoration/"]').isVisible(), 'mobile menu expands the services list');
  await m.tap('#services-menu a[href="/services/timber-restoration/"]');
  await m.waitForURL('**/services/timber-restoration/');
  check((await m.textContent('h1')).includes('Timber restoration'), 'service page opens from the mobile menu');
  await m.tap('[data-nav-toggle]'); await sleep(250);
  await m.keyboard.press('Escape'); await sleep(300);
  check(!(await m.locator('[data-nav-list]').evaluate((e) => e.classList.contains('is-open'))), 'Escape closes the mobile menu');
  await ctx.close();
}

async function projects(browser) {
  console.log('\nProjects page');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(SITE + '/projects/', { waitUntil: 'load' });
  check((await page.locator('.pair').count()) === 13, '13 before & after projects');
  check((await page.locator('.pair .label').count()) === 26, 'every project labelled Before and After');
  check((await page.locator('main figcaption, .gallery__caption').count()) === 0, 'photos are shown without explanatory captions');

  // Slider keyboard
  const handle = page.locator('.compare__handle');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  check((await handle.getAttribute('aria-valuenow')) === '52', 'slider moves with arrow keys');
  await page.keyboard.press('Home');
  check((await handle.getAttribute('aria-valuenow')) === '0', 'Home key moves slider to start');

  // Pair animation reverses
  const sel = '.pair:nth-child(3)';
  const st = () => page.$eval(sel, (el) => Math.round(new DOMMatrixReadOnly(getComputedStyle(el.querySelector('.pair__item--before')).transform).m41));
  const t = await topOf(page, sel);
  await scrollTo(page, t - 850); const x1 = await st();
  await scrollTo(page, t - 120); const x2 = await st();
  await scrollTo(page, t - 850); const x3 = await st();
  check(x1 < -20 && x2 === 0 && Math.abs(x3 - x1) <= 3, `before/after photos swing in, settle and reverse (${x1} → ${x2} → ${x3}px)`);

  // Filters + lightbox
  await scrollTo(page, (await topOf(page, '#gallery')) - 80);
  await page.click('[data-filter="Timber"]');
  const vis = await page.$$eval('[data-gallery] [data-tag]', (els) => els.filter((e) => e.offsetParent).map((e) => e.dataset.tag));
  check(vis.length > 0 && vis.every((t) => t === 'Timber'), `filter shows only matching photos (${vis.length} timber)`);
  await page.click('[data-filter="All"]');
  const shot = page.locator('[data-gallery] [data-shot]').first();
  await shot.focus();
  await page.keyboard.press('Enter'); await sleep(300);
  check(await page.$eval('[data-lightbox]', (d) => d.open), 'photo opens larger');
  await page.waitForFunction(() => document.querySelector('[data-lightbox-img]').naturalWidth > 0);
  const c1 = await page.textContent('[data-lightbox-count]');
  await page.keyboard.press('ArrowRight');
  const c2 = await page.textContent('[data-lightbox-count]');
  check(c1 !== c2, `arrow keys move through photos (${c1} → ${c2})`);
  await page.keyboard.press('Escape'); await sleep(200);
  check(!(await page.$eval('[data-lightbox]', (d) => d.open)) && (await page.evaluate(() => document.activeElement === document.querySelector('[data-gallery] [data-shot]'))), 'Escape closes and focus returns to the photo');
  await page.close();

  // Touch behaviour of the slider
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await ctx.newPage();
  await m.goto(SITE + '/projects/', { waitUntil: 'load' });
  await m.locator('.compare').evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await settle(m);
  const cdp = await ctx.newCDPSession(m);
  let b = await m.locator('.compare__frame').boundingBox();
  const y0 = await m.evaluate(() => scrollY);
  await touchSwipe(cdp, b.x + b.width / 2, b.y + b.height / 2, 5, -250);
  await settle(m);
  check((await m.evaluate(() => scrollY)) > y0 + 80 && (await m.getAttribute('.compare__handle', 'aria-valuenow')) === '50', 'vertical swipe on the slider scrolls the page without moving it');
  await m.locator('.compare').evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await settle(m);
  b = await m.locator('.compare__frame').boundingBox();
  await touchSwipe(cdp, b.x + b.width * 0.8, b.y + b.height / 2, -200, 4);
  await sleep(150);
  check(Number(await m.getAttribute('.compare__handle', 'aria-valuenow')) < 50, 'horizontal drag moves the slider on touch');
  await ctx.close();
}

async function contact(browser) {
  console.log('\nContact page & quote form');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(SITE + '/contact/', { waitUntil: 'load' });
  const hrefs = await page.$$eval('.contact-list a', (a) => a.map((x) => x.getAttribute('href')));
  check(JSON.stringify(hrefs) === JSON.stringify(['tel:+61424740100', 'https://wa.me/61424740100', 'mailto:adpaintingdecorating@gmail.com', 'https://share.google/Tq917jS7W9hm3iNKE']), 'call, WhatsApp, email and directions links are exact');
  check((await page.textContent('main')).includes('26 Wettenhall Circuit') && (await page.textContent('main')).includes('Calwell ACT 2905'), 'address shown');
  check(await page.locator('iframe.map-card__frame').getAttribute('src').then((s) => s.includes('Wettenhall')), 'map embedded for the business address');
  await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; }; });
  await page.click('button[value="whatsapp"]');
  check(await page.isVisible('[data-form-error]'), 'form asks for missing details');
  await page.fill('#q-name', 'Sam');
  await page.fill('#q-phone', '0400 000 000');
  await page.selectOption('#q-service', { index: 4 });
  await page.fill('#q-message', 'Deck needs restoring & oiling');
  await page.click('button[value="whatsapp"]');
  const opened = await page.evaluate(() => window.__opened);
  check(opened?.startsWith('https://wa.me/61424740100?text=') && decodeURIComponent(opened).includes('Name: Sam') && decodeURIComponent(opened).includes('restoring & oiling'), 'WhatsApp message prepared with the form details');
  const mail = await page.evaluate(() => { const f = document.querySelector('[data-quote-form]'); const b = f.querySelector('button[value="email"]'); window.location.assign = () => {}; f.requestSubmit(b); return f.dataset.lastUrl; });
  check(mail.startsWith('mailto:adpaintingdecorating@gmail.com?subject=') && decodeURIComponent(mail).includes('Timber restoration'), 'email prepared with subject and details');
  await page.close();
}

async function reduced(browser) {
  console.log('\nReduced motion');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(SITE + '/', { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    motion: document.documentElement.classList.contains('motion'),
    hold: document.querySelector('.hero').offsetHeight - document.querySelector('.hero__stage').offsetHeight,
    t: getComputedStyle(document.querySelector('.hero__media')).transform,
    secs: document.querySelectorAll('main > section').length,
  }));
  check(!r.motion && r.hold === 0 && r.t === 'none', 'no scroll effects, hold or transforms');
  check(r.secs >= 10, `same long homepage content (${r.secs} sections)`);
  await page.goto(SITE + '/projects/', { waitUntil: 'load' });
  check(await page.$$eval('.pair__item', (els) => els.every((e) => getComputedStyle(e).transform === 'none')), 'before/after photos sit still');
  await ctx.close();
}

const server = spawn('npx', ['vite', 'preview', '--port', '4317', '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(SITE)).ok) break; } catch {} await sleep(250); }
const browser = await chromium.launch();
try {
  await crawl(browser);
  await mobileCrawl(browser);
  await home(browser);
  await navigation(browser);
  await projects(browser);
  await contact(browser);
  await reduced(browser);
} catch (e) {
  failures++;
  console.error(e);
} finally {
  await browser.close();
  server.kill();
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
