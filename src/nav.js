export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const list = document.querySelector('[data-nav-list]');
  if (!toggle || !list) return;

  const setOpen = (open, { focusToggle = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.site-nav__toggle-label').textContent = open ? 'Close' : 'Menu';
    list.classList.toggle('is-open', open);
    if (focusToggle) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && list.classList.contains('is-open')) setOpen(false, { focusToggle: true });
  });
  document.addEventListener('click', (e) => {
    if (list.classList.contains('is-open') && !e.target.closest('.site-nav')) setOpen(false);
  });
  window.matchMedia('(min-width: 860px)').addEventListener?.('change', () => setOpen(false));

  // Mark the nav link for the section currently in view (none over the opening scene).
  const links = [...list.querySelectorAll('a[href^="#"]:not([data-no-current])')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
  let queued = false;
  const update = () => {
    queued = false;
    const line = window.innerHeight * 0.4;
    let current = -1;
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top <= line) current = i;
    });
    links.forEach((a, i) => (i === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  };
  const request = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}
