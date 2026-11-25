// Enlarged photo viewer built on <dialog>: Escape closes (native), arrow keys
// move between photos, and focus returns to the photo that was opened.
export function initLightbox() {
  const dialog = document.querySelector('[data-lightbox]');
  const shots = [...document.querySelectorAll('[data-shot]')];
  if (!dialog || !shots.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('[data-lightbox-img]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const count = dialog.querySelector('[data-lightbox-count]');
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = (i + shots.length) % shots.length;
    const s = shots[index];
    img.src = s.dataset.full;
    img.width = Number(s.dataset.w);
    img.height = Number(s.dataset.h);
    img.alt = s.querySelector('img')?.alt || '';
    caption.textContent = s.dataset.caption || '';
    count.textContent = `${index + 1} / ${shots.length}`;
  };

  shots.forEach((shot, i) =>
    shot.addEventListener('click', () => {
      opener = shot;
      show(i);
      dialog.showModal();
      document.body.classList.add('has-lightbox');
      dialog.querySelector('[data-lightbox-close]').focus();
    })
  );

  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  // Clicking the dark area around the photo closes the viewer.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('lightbox__figure')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('has-lightbox');
    opener?.focus({ preventScroll: true });
  });
}
