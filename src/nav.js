export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const list = document.querySelector('[data-nav-list]');
  const subToggle = document.querySelector('.submenu-toggle');
  const submenu = document.getElementById('services-menu');
  if (!toggle || !list) return;

  const setOpen = (open, { focusToggle = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.site-nav__toggle-label').textContent = open ? 'Close' : 'Menu';
    list.classList.toggle('is-open', open);
    if (focusToggle) toggle.focus();
  };
  const setSub = (open) => {
    if (!subToggle || !submenu) return;
    subToggle.setAttribute('aria-expanded', String(open));
    submenu.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  subToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    setSub(subToggle.getAttribute('aria-expanded') !== 'true');
  });
  list.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      setOpen(false);
      setSub(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (submenu?.classList.contains('is-open')) {
      setSub(false);
      subToggle.focus();
    } else if (list.classList.contains('is-open')) setOpen(false, { focusToggle: true });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-nav')) {
      setOpen(false);
      setSub(false);
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener?.('change', () => {
    setOpen(false);
    setSub(false);
  });
}
