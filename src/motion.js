// Scroll-linked choreography. Everything is derived from the current scroll
// position on each frame, so the scene plays forwards and backwards with the
// visitor's own wheel, touch or keyboard scrolling (nothing is hijacked).
//
// Measured elements never carry the transforms themselves; they publish CSS
// custom properties that their children use, so measurements stay stable.

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function initMotion() {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('[data-hero]');
  const stage = hero?.querySelector('.hero__stage');
  const services = document.querySelector('.services');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const reveals = [...document.querySelectorAll('[data-reveal]')];

  let queued = false;

  function update() {
    queued = false;
    if (!root.classList.contains('motion')) return;
    const vh = window.innerHeight;
    const y = window.scrollY;

    // Read phase
    const holdPx = hero.offsetHeight - stage.offsetHeight;
    const servicesTop = services.getBoundingClientRect().top;
    const sceneRects = scenes.map((el) => el.getBoundingClientRect());
    const revealTops = reveals.map((el) => el.getBoundingClientRect().top);

    // Write phase
    const hold = holdPx > 1 ? clamp(y / holdPx) : clamp(y / (vh * 0.7));
    const out = clamp((y - Math.max(holdPx, 0)) / vh);
    hero.style.setProperty('--hold', hold.toFixed(4));
    hero.style.setProperty('--out', out.toFixed(4));

    const rise = clamp((vh - servicesTop) / (vh * 0.65));
    services.style.setProperty('--rise', rise.toFixed(4));

    sceneRects.forEach((r, i) => {
      const p = clamp((vh - r.top) / (vh + r.height));
      scenes[i].style.setProperty('--p', p.toFixed(4));
    });

    revealTops.forEach((top, i) => {
      const r = clamp((vh - top) / (vh * 0.3));
      reveals[i].style.setProperty('--r', r.toFixed(3));
    });
  }

  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };

  const applyPreference = () => {
    root.classList.toggle('motion', !reduce.matches);
    if (reduce.matches) {
      [hero, services, ...scenes, ...reveals].forEach((el) => el?.removeAttribute('style'));
    }
    request();
  };

  if (!hero || !stage || !services) return;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  reduce.addEventListener?.('change', applyPreference);
  update();
}

// Highlights the service whose text is in the middle of the viewport and shows
// its photo in the sticky frame (desktop layout).
export function initServices() {
  const items = [...document.querySelectorAll('[data-service]')];
  const pics = [...document.querySelectorAll('[data-service-pic]')];
  if (!items.length) return;
  const setActive = (index) => {
    items.forEach((el) => el.classList.toggle('is-active', el.dataset.service === index));
    pics.forEach((el) => el.classList.toggle('is-active', el.dataset.servicePic === index));
  };
  setActive('0');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.service));
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  items.forEach((el) => io.observe(el));
}
