// End-to-end checks with Playwright (Chromium).
// Usage: npm run build && npm test
// Starts `vite preview` (built site) and `vite` (dev server, for the slider fixture).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const SITE = 'http://localhost:4317';
const DEV = 'http://localhost:4318';
let failures = 0;
let passes = 0;
const check = (cond, msg) => {
  if (cond) { passes++; console.log(`  ✓ ${msg}`); }
  else { failures++; console.log(`  ✗ ${msg}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Real touch-event swipe (finger moves by dx/dy) through the DevTools protocol.
async function touchSwipe(cdp, x, y, dx, dy, steps = 12) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }] });
    await sleep(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

function serve(args, url) {
  const p = spawn('npx', ['vite', ...args], { stdio: 'ignore' });
  return (async () => {
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(url)).ok) return p; } catch {}
      await sleep(250);
    }
    throw new Error(`server did not start: ${url}`);
  })();
}

async function settle(page) {
  // Wait until scrolling (including smooth anchor scrolling) has started and stopped.
  await sleep(150);
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 60 && stable < 2; i++) {
    const y = await page.evaluate(() => scrollY);
    stable = y === last ? stable + 1 : 0;
    last = y;
    await sleep(100);
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const scrollTo = async (page, y) => {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await settle(page);
};

const headingVisibleBelowHeader = (page, id) =>
  page.evaluate((sel) => {
    const h = document.querySelector(`${sel} h2`);
    const header = document.querySelector('.site-header__bar').getBoundingClientRect();
    const r = h.getBoundingClientRect();
    return { ok: r.top >= header.bottom - 1 && r.bottom <= innerHeight, top: Math.round(r.top), headerBottom: Math.round(header.bottom) };
  }, id);

async function desktop(browser) {
  console.log('\nDesktop 1440×900');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(SITE, { waitUntil: 'networkidle' });

  // Metadata & content
  check((await page.title()).includes('A.D painting & Special FX.'), 'page title names the business');
  const desc = await page.getAttribute('meta[name="description"]', 'content');
  check(/house painting/i.test(desc) && /marble/i.test(desc) && /plaster/i.test(desc), 'meta description lists real services');
  check(await page.locator('link[rel="icon"][href="favicon.svg"]').count() === 1, 'favicon linked');
  check((await page.textContent('h1')).trim() === 'House painting and decorative finishes', 'hero headline exact');
  check((await page.textContent('.hero__brand')).trim() === 'A.D painting & Special FX.', 'business name exact in hero');
  for (const name of ['Request a quote', 'View projects']) {
    check(await page.locator('.hero__actions a', { hasText: name }).isVisible(), `hero action "${name}" visible`);
  }
  const services = await page.$$eval('.service__title', (els) => els.map((e) => e.textContent.trim()));
  check(services.length === 6, `six services listed (${services.join(' | ')})`);
  check((await page.textContent('#finishes h2')).trim() === 'Rock and marble effects', 'decorative heading exact');
  check((await page.textContent('#contact h2')).trim() === 'Tell Aaron about your project', 'contact heading exact');
  check(await page.locator('#about', { hasText: 'Aaron Dorman' }).count() === 1, 'About names Aaron Dorman');

  // Images
  const imgInfo = await page.$$eval('img', (imgs) => imgs.map((i) => ({ w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading'), cls: i.className, inLightbox: !!i.closest('dialog') })));
  check(imgInfo.filter((i) => !i.inLightbox).every((i) => i.w && i.h), 'every image reserves width/height');
  check(imgInfo.find((i) => i.cls.includes('hero__img')).loading === 'eager', 'hero image loads eagerly');
  check(await page.$$eval('.gallery img, .pair img', (a) => a.every((i) => i.loading === 'lazy')), 'gallery images lazy-load');
  check(await page.$eval('.hero__img', (i) => i.complete && i.naturalWidth > 0), 'hero image displayed');

  // Layout
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');

  // Opening scene: hold, depth and reversibility
  const vh = 900;
  const probe = () =>
    page.evaluate(() => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero__img')).transform);
      const c = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero__content')).transform);
      return {
        y: scrollY,
        stageTop: Math.round(document.querySelector('.hero__stage').getBoundingClientRect().top),
        servicesTop: Math.round(document.querySelector('.services').getBoundingClientRect().top),
        imgY: +m.m42.toFixed(1), imgScale: +m.a.toFixed(4), contentY: +c.m42.toFixed(1),
      };
    });
  await scrollTo(page, 0);
  const a0 = await probe();
  await scrollTo(page, 270);
  const a1 = await probe();
  check(a1.stageTop === 0, 'photo holds in view during the opening scroll');
  check(a1.servicesTop < a0.servicesTop && a1.servicesTop < vh, `next section rises over the photo (${a0.servicesTop}px → ${a1.servicesTop}px)`);
  check(a1.contentY < a0.contentY - 40, `headline moves upward (${a0.contentY} → ${a1.contentY})`);
  const fg = a0.servicesTop - a1.servicesTop; const bg = Math.abs((a1.stageTop + a1.imgY) - (a0.stageTop + a0.imgY));
  check(bg < fg * 0.5, `photo moves slower than the foreground (photo ${bg}px vs section ${fg}px)`);
  await scrollTo(page, 900);
  const a2 = await probe();
  const sheetTransform = await page.$eval('.sheet', (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
  check(Math.abs(sheetTransform - 1) < 0.001, 'services sheet fully settled after the opening scene');
  // reverse
  await scrollTo(page, 270);
  const b1 = await probe();
  check(Math.abs(b1.imgY - a1.imgY) < 1 && Math.abs(b1.contentY - a1.contentY) < 1 && b1.servicesTop === a1.servicesTop, 'scrolling back reverses the scene exactly');
  await scrollTo(page, 0);
  const b0 = await probe();
  check(Math.abs(b0.contentY - a0.contentY) < 1 && Math.abs(b0.imgScale - a0.imgScale) < 0.001, 'scene returns to its starting state at the top');
  check(a2.y === 900, 'no scroll trapping while passing the opening scene');

  // Native wheel & keyboard scrolling, no snapping
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 600);
  await settle(page);
  const yWheel = await page.evaluate(() => scrollY);
  check(yWheel > 300, `mouse wheel scrolls the page (${yWheel}px)`);
  await sleep(700);
  check((await page.evaluate(() => scrollY)) === yWheel, 'no forced snapping after wheel scroll');
  await page.mouse.wheel(0, -600);
  await settle(page);
  check((await page.evaluate(() => scrollY)) < yWheel, 'wheel scrolling upward works');
  await page.focus('body');
  await page.keyboard.press('PageDown');
  await settle(page);
  check((await page.evaluate(() => scrollY)) > 0, 'keyboard PageDown scrolls');
  await scrollTo(page, 0);

  // Hero buttons usable through the scene
  await scrollTo(page, 200);
  await page.click('.hero__actions a:has-text("View projects")');
  await settle(page);
  const pv = await headingVisibleBelowHeader(page, '#projects');
  check(pv.ok, `"View projects" lands with heading visible (heading ${pv.top}px, header ${pv.headerBottom}px)`);
  await scrollTo(page, 0);
  await page.click('.hero__actions a:has-text("Request a quote")');
  await settle(page);
  const qv = await headingVisibleBelowHeader(page, '#contact');
  check(qv.ok, `"Request a quote" leads to the contact section (${qv.top}px)`);

  // Header navigation links
  for (const id of ['services', 'projects', 'about', 'contact']) {
    await scrollTo(page, 0);
    await page.click(`.site-nav__list a[href="#${id}"]`);
    await settle(page);
    const r = await headingVisibleBelowHeader(page, `#${id}`);
    check(r.ok, `nav "${id}" lands with heading below header (${r.top}px vs ${r.headerBottom}px)`);
  }
  // Header quote action works from deep in the page
  await page.click('.site-header__quote');
  await settle(page);
  check((await headingVisibleBelowHeader(page, '#contact')).ok, 'header "Request a quote" works');

  // Services: sticky photo and active service
  const servicesTop = await page.evaluate(() => document.querySelector('.services__list').getBoundingClientRect().top + scrollY);
  const timberTop = await page.evaluate(() => document.querySelector('[data-service="3"]').getBoundingClientRect().top + scrollY);
  await scrollTo(page, timberTop - 300);
  await sleep(300);
  const sticky = await page.evaluate(() => {
    const r = document.querySelector('.services__visual').getBoundingClientRect();
    return { top: Math.round(r.top), active: document.querySelector('.services__pic.is-active').dataset.servicePic };
  });
  check(sticky.top > 60 && sticky.top < 120, `service photo stays in view (${sticky.top}px from top)`);
  check(sticky.active === '3', `photo follows the service being read (active ${sticky.active})`);
  check(servicesTop > 0, 'services list rendered');

  // Decorative finishes: detail rises faster than the wide view
  const finTop = await page.evaluate(() => document.getElementById('finishes').getBoundingClientRect().top + scrollY);
  const layerY = () => page.evaluate(() => ['.finishes__wide', '.finishes__detail'].map((s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m42));
  await scrollTo(page, finTop - 700);
  const [w1, d1] = await layerY();
  await scrollTo(page, finTop + 100);
  const [w2, d2] = await layerY();
  check(Math.abs(d2 - d1) > Math.abs(w2 - w1) * 2, `close-up moves faster than wide view (${(d1 - d2).toFixed(0)}px vs ${(w1 - w2).toFixed(0)}px extra)`);
  check(await page.locator('.finishes__note').isVisible(), 'illustrative textures are labelled as such');

  // Lightbox
  await scrollTo(page, await page.evaluate(() => document.querySelector('.gallery').getBoundingClientRect().top + scrollY - 200));
  const opener = page.locator('.gallery [data-shot]').first();
  await opener.focus();
  await page.keyboard.press('Enter');
  await sleep(300);
  check(await page.$eval('[data-lightbox]', (d) => d.open), 'photo opens enlarged (keyboard)');
  await page.waitForFunction(() => document.querySelector('[data-lightbox-img]').naturalWidth > 0);
  const lb = await page.evaluate(() => ({
    src: document.querySelector('[data-lightbox-img]').currentSrc,
    cap: document.querySelector('[data-lightbox-caption]').textContent,
    count: document.querySelector('[data-lightbox-count]').textContent,
    w: document.querySelector('[data-lightbox-img]').getBoundingClientRect().width,
  }));
  check(lb.src.includes('weatherboard-in-progress-2000') && lb.w > 900, `enlarged image is the large version (${Math.round(lb.w)}px wide)`);
  check(lb.cap.includes('Weatherboard'), 'enlarged photo has its caption');
  await page.keyboard.press('ArrowRight');
  check((await page.textContent('[data-lightbox-count]')).startsWith('6 /'), 'arrow key moves to the next photo');
  await page.keyboard.press('Escape');
  await sleep(200);
  check(!(await page.$eval('[data-lightbox]', (d) => d.open)), 'Escape closes the enlarged photo');
  check(await page.evaluate(() => document.activeElement === document.querySelector('.gallery [data-shot]')), 'focus returns to the photo that was opened');
  await page.click('.pair [data-shot] >> nth=1');
  await sleep(200);
  check(await page.$eval('[data-lightbox]', (d) => d.open), 'before/after photos open with a click');
  await page.click('[data-lightbox-close]');
  await sleep(200);
  check(await page.evaluate(() => document.activeElement === document.querySelectorAll('.pair [data-shot]')[1]), 'close button returns focus to the opened photo');
  const pairs = await page.$$eval('.pair', (els) => els.map((e) => [e.querySelector('h3').textContent.trim(), !!e.querySelector('.label:not(.label--after)'), !!e.querySelector('.label--after')]));
  check(pairs.length === 2 && pairs.every(([, b, a]) => b && a), `before/after projects labelled (${pairs.map((p) => p[0]).join(', ')})`);

  // Before/after projects assemble with scroll and reverse
  const pairState = () => page.$eval('.pair--portrait', (el) => {
    const m = (s) => new DOMMatrixReadOnly(getComputedStyle(el.querySelector(s)).transform);
    const b = m('.pair__item--before'), a = m('.pair__item--after');
    return { bx: Math.round(b.m41), ay: Math.round(a.m42), by: Math.round(b.m42), clip: getComputedStyle(el.querySelector('.pair__item--after img')).clipPath };
  });
  const pTop = await page.evaluate(() => document.querySelector('.pair--portrait').getBoundingClientRect().top + scrollY);
  await scrollTo(page, pTop - 800);
  const e1 = await pairState();
  await scrollTo(page, pTop - 150);
  const e2 = await pairState();
  check(e1.bx < -20 && e1.ay > e1.by && e2.bx === 0 && e2.ay === 0, `photos swing in and settle (before x ${e1.bx}→${e2.bx}px, after rises ${e1.ay}px)`);
  check(e1.clip.includes('%') && !/inset\(0px 0px 0px 0%\)|^none$/.test(e1.clip) && /0%\)|none/.test(e2.clip), `after photo wipes into view (${e1.clip} → ${e2.clip})`);
  await scrollTo(page, pTop - 800);
  const e3 = await pairState();
  check(e3.bx === e1.bx && e3.ay === e1.ay, 'scrolling back reverses the before/after animation');

  // Contact links
  const hrefs = await page.$$eval('#contact a', (as) => as.map((a) => a.getAttribute('href')));
  for (const h of ['tel:+61424740100', 'https://wa.me/61424740100', 'mailto:adpaintingdecorating@gmail.com', 'https://share.google/Tq917jS7W9hm3iNKE']) {
    check(hrefs.includes(h), `contact link ${h}`);
  }
  check((await page.textContent('#contact')).includes('0424 740 100'), 'phone number displayed');
  for (const name of ['Call Aaron', 'WhatsApp Aaron', 'Email Aaron', 'Get directions']) {
    check(await page.locator('#contact a', { hasText: name }).isVisible(), `"${name}" visible`);
  }

  // Footer social links from config
  const social = await page.$$eval('.social a', (as) => as.map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')]));
  check(social.length === 3 && social.every(([n, h]) => n && h === '/'), `social icons point to / (${social.map((s) => s[0]).join(', ')})`);

  // Focus visibility
  await page.reload({ waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.classList.contains('skip-link') && document.activeElement.getBoundingClientRect().top >= 0), 'skip link appears on first Tab');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check(outline !== 'none', `keyboard focus is visible (outline ${outline})`);
  const unnamed = await page.$$eval('a, button, [role="slider"]', (els) => els.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim())).length);
  check(unnamed === 0, 'all interactive elements have accessible names');

  check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join('; ') : ''}`);
  await page.close();
}

async function reducedMotion(browser) {
  console.log('\nReduced motion');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  check(!(await page.evaluate(() => document.documentElement.classList.contains('motion'))), 'motion layer disabled');
  const r = await page.evaluate(() => ({
    hero: document.querySelector('.hero').offsetHeight,
    stage: document.querySelector('.hero__stage').offsetHeight,
    img: getComputedStyle(document.querySelector('.hero__img')).transform,
  }));
  check(r.hero === r.stage, 'no scroll hold in the opening scene');
  check(r.img === 'none', 'photos are not transformed');
  await scrollTo(page, 3000);
  const t = await page.$$eval('.finishes__detail, .finishes__wide, .service > *', (els) => els.every((e) => getComputedStyle(e).transform === 'none'));
  check(t, 'decorative and service content sit in a stable layout');
  check(await page.locator('.service').count() === 6 && await page.locator('[data-shot]').count() === 6, 'same content present');
  await ctx.close();
}

async function mobile(browser) {
  console.log('\nMobile (iPhone 13)');
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(SITE, { waitUntil: 'networkidle' });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');
  check(await page.locator('.hero__actions a', { hasText: 'Request a quote' }).isVisible(), 'hero quote button visible');
  const heroBox = await page.locator('.hero__title').boundingBox();
  check(heroBox.x >= 15, `hero text keeps the side gutter (${heroBox.x.toFixed(0)}px)`);

  // Touch scrolling through the scene and back
  const cdp = await ctx.newCDPSession(page);
  const swipe = (x, y, dx, dy) => touchSwipe(cdp, x, y, dx, dy);
  await swipe(195, 500, 0, -500);
  await settle(page);
  const y1 = await page.evaluate(() => scrollY);
  const hold1 = await page.evaluate(() => +getComputedStyle(document.querySelector('.hero')).getPropertyValue('--hold'));
  check(y1 > 200, `touch swipe scrolls the page (${y1}px)`);
  check(hold1 > 0.2, `scene follows touch scroll (progress ${hold1.toFixed(2)})`);
  await swipe(195, 300, 0, 500);
  await settle(page);
  const hold0 = await page.evaluate(() => +getComputedStyle(document.querySelector('.hero')).getPropertyValue('--hold'));
  check((await page.evaluate(() => scrollY)) < y1 && hold0 < hold1, 'scene reverses when swiping back up');

  // Menu
  await scrollTo(page, 0);
  await page.tap('[data-nav-toggle]');
  await sleep(300);
  check(await page.locator('[data-nav-list] a[href="#services"]').isVisible(), 'menu opens');
  check(await page.locator('.site-nav__quote a').isVisible(), 'menu includes "Request a quote"');
  await page.keyboard.press('Escape');
  await sleep(300);
  check(!(await page.locator('[data-nav-list] a[href="#services"]').isVisible()), 'Escape closes the menu');
  check(await page.evaluate(() => document.activeElement.matches('[data-nav-toggle]')), 'focus returns to menu button');
  for (const id of ['services', 'projects', 'about', 'contact']) {
    await scrollTo(page, 0);
    await page.tap('[data-nav-toggle]');
    await sleep(300);
    await page.tap(`[data-nav-list] a[href="#${id}"]`);
    await settle(page);
    const r = await headingVisibleBelowHeader(page, `#${id}`);
    check(r.ok, `menu "${id}" lands with heading visible (${r.top}px vs ${r.headerBottom}px)`);
    check(!(await page.locator('[data-nav-list]').evaluate((e) => e.classList.contains('is-open'))), `menu closes after choosing "${id}"`);
  }
  // Lightbox on touch
  await page.locator('.gallery [data-shot]').nth(1).scrollIntoViewIfNeeded();
  await page.locator('.gallery [data-shot]').nth(1).tap();
  await sleep(300);
  const fits = await page.evaluate(() => { const r = document.querySelector('[data-lightbox-img]').getBoundingClientRect(); return r.width <= innerWidth && r.height <= innerHeight; });
  check(await page.$eval('[data-lightbox]', (d) => d.open) && fits, 'enlarged photo fits the phone screen');
  await page.tap('[data-lightbox-next]');
  check((await page.textContent('[data-lightbox-count]')).startsWith('1 /'), 'next button wraps around the gallery');
  await page.tap('[data-lightbox-close]');
  await sleep(200);
  check(!(await page.$eval('[data-lightbox]', (d) => d.open)), 'close button closes the photo');
  check(errors.length === 0, 'no page errors');
  await ctx.close();
}

async function compareFixture(browser) {
  console.log('\nBefore/after slider (fixture)');
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await page.goto(`${DEV}/tests/fixtures/compare.html`, { waitUntil: 'networkidle' });
  const handle = page.locator('.compare__handle');
  const val = () => handle.getAttribute('aria-valuenow').then(Number);
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  check((await val()) === 52, 'Arrow Right moves the divider');
  await page.keyboard.press('Home');
  check((await val()) === 0, 'Home moves divider to the start');
  await page.keyboard.press('End');
  check((await val()) === 100, 'End moves divider to the end');
  await page.keyboard.press('PageDown');
  check((await val()) === 90, 'Page Down moves in larger steps');
  const clip = await page.$eval('.compare__before', (e) => getComputedStyle(e).clipPath);
  check(clip.includes('10%'), `before photo clipped to the divider (${clip})`);
  check(await page.locator('.compare .label', { hasText: 'Before' }).isVisible() && await page.locator('.compare .label', { hasText: 'After' }).isVisible(), 'Before/After labels visible');

  await page.locator('.compare').scrollIntoViewIfNeeded();
  await settle(page);
  const box = await page.locator('.compare__frame').boundingBox();
  const cdp = await ctx.newCDPSession(page);
  // Vertical swipe starting on the photo scrolls the page and leaves the divider alone.
  const before = await val();
  const y0 = await page.evaluate(() => scrollY);
  await touchSwipe(cdp, box.x + box.width / 2, box.y + box.height / 2, 6, -300);
  await settle(page);
  const y1 = await page.evaluate(() => scrollY);
  check(y1 > y0 + 100, `vertical swipe on the slider still scrolls the page (${y1 - y0}px)`);
  const after = await val();
  check(Math.abs(after - before) <= 3, `vertical swipe leaves the divider in place (${before}% → ${after}%)`);
  // Horizontal touch drag moves the divider.
  await page.locator('.compare').evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await settle(page);
  const box2 = await page.locator('.compare__frame').boundingBox();
  await touchSwipe(cdp, box2.x + box2.width * 0.8, box2.y + box2.height / 2, -220, 4);
  await sleep(200);
  const dragged = await val();
  check(dragged < 60, `horizontal touch drag moves the divider (now ${dragged}%)`);
  await ctx.close();

  // Mouse drag on desktop
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page2.goto(`${DEV}/tests/fixtures/compare.html`, { waitUntil: 'networkidle' });
  await page2.locator('.compare').scrollIntoViewIfNeeded();
  const b = await page2.locator('.compare__frame').boundingBox();
  await page2.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page2.mouse.down();
  await page2.mouse.move(b.x + b.width * 0.25, b.y + b.height / 2, { steps: 8 });
  await page2.mouse.up();
  const v = Number(await page2.locator('.compare__handle').getAttribute('aria-valuenow'));
  check(v >= 23 && v <= 27, `mouse drag moves the divider (${v}%)`);
  await page2.close();
}

const preview = await serve(['preview', '--port', '4317', '--strictPort'], SITE);
const dev = await serve(['--port', '4318', '--strictPort'], DEV);
const browser = await chromium.launch();
try {
  await desktop(browser);
  await reducedMotion(browser);
  await mobile(browser);
  await compareFixture(browser);
} catch (e) {
  failures++;
  console.error(e);
} finally {
  await browser.close();
  preview.kill();
  dev.kill();
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
