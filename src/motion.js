// Scroll-linked choreography. Everything derives from the current scroll
// position on each frame, so effects play forwards and backwards with the
// visitor's own scrolling (nothing is hijacked or snapped).
// Measured elements publish CSS custom properties; their children carry the transforms.

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const TONES = {
  paper: [244, 239, 231],
  sand: [233, 224, 209],
  charcoal: [23, 22, 20],
  forest: [44, 58, 49],
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  return [...el.querySelectorAll('.w')];
}

export function initMotion() {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  root.classList.add('tones');

  const heroes = [...document.querySelectorAll('[data-hero]')].map((el) => ({ el, stage: el.firstElementChild }));
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const wordGroups = [...document.querySelectorAll('[data-words]')].map((el) => ({ el, words: splitWords(el), last: [] }));
  // Solid sections (contact band, footer) keep their own colour, so they are left out of the blend.
  const toneEls = [...document.querySelectorAll('main > [data-tone]:not(.contact-band)')];
  const bg = document.querySelector('.page-bg');
  let lastBg = '';
  let queued = false;

  function update() {
    queued = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    // ---- read ----
    const heroData = heroes.map(({ el, stage }) => ({ holdPx: el.offsetHeight - stage.offsetHeight, top: el.offsetTop }));
    const sceneRects = scenes.map((el) => el.getBoundingClientRect());
    const revealTops = reveals.map((el) => el.getBoundingClientRect().top);
    const wordTops = wordGroups.map((g) => g.el.getBoundingClientRect().top);
    const toneRects = toneEls.map((el) => el.getBoundingClientRect());

    // ---- write ----
    heroes.forEach(({ el }, i) => {
      const { holdPx, top } = heroData[i];
      const local = y - top;
      const hold = holdPx > 1 ? clamp(local / holdPx) : clamp(local / (vh * 0.7));
      const out = clamp((local - Math.max(holdPx, 0)) / vh);
      el.style.setProperty('--hold', hold.toFixed(4));
      el.style.setProperty('--out', out.toFixed(4));
    });

    sceneRects.forEach((r, i) => scenes[i].style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(4)));
    revealTops.forEach((top, i) => reveals[i].style.setProperty('--r', clamp((vh - top) / (vh * 0.32)).toFixed(3)));

    wordGroups.forEach((g, gi) => {
      const progress = clamp((vh * 0.88 - wordTops[gi]) / (vh * 0.62));
      const n = g.words.length;
      g.words.forEach((w, i) => {
        const v = clamp(progress * (n + 4) - i).toFixed(2);
        if (g.last[i] !== v) {
          w.style.setProperty('--w', v);
          g.last[i] = v;
        }
      });
    });

    // Page colour: tone of the section at the middle of the screen, blended near boundaries.
    if (bg && toneRects.length) {
      const probe = vh * 0.55;
      const band = vh * 0.25;
      // Sections can overlap (sheets rising over a sticky hero), so the last one that has started wins.
      let i = 0;
      toneRects.forEach((r, k) => { if (r.top <= probe) i = k; });
      const cur = TONES[toneEls[i].dataset.tone] || TONES.paper;
      let color = cur;
      if (i > 0) {
        const t = clamp((probe - toneRects[i].top) / band);
        color = mix(TONES[toneEls[i - 1].dataset.tone] || TONES.paper, cur, t);
      }
      const css = `rgb(${color.join(' ')})`;
      if (css !== lastBg) {
        bg.style.setProperty('--bg', css);
        lastBg = css;
        // Relative luminance decides whether section text is dark or light.
        const [r, g, b] = color.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        const ink = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? 'dark' : 'light';
        if (root.dataset.ink !== ink) root.dataset.ink = ink;
      }
    }
  }

  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  update();

  // Gentle pointer parallax for the home hero (desktop pointers only).
  const scene = document.querySelector('.hero');
  if (scene && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const step = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      scene.style.setProperty('--mx', cx.toFixed(3));
      scene.style.setProperty('--my', cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    scene.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(step);
    });
    scene.addEventListener('pointerleave', () => {
      tx = ty = 0;
      if (!raf) raf = requestAnimationFrame(step);
    });
  }
}

// 3D tilt with a soft glare on cards (mouse/trackpad only).
export function initTilt() {
  if (!document.documentElement.classList.contains('motion')) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}
