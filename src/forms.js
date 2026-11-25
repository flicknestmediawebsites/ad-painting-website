// Gallery filters and the quick quote form (sent via WhatsApp or email, no server needed).
const WHATSAPP = 'https://wa.me/61424740100';
const EMAIL = 'adpaintingdecorating@gmail.com';

export function initFilters() {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const items = [...document.querySelectorAll('[data-gallery] [data-tag]')];
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const f = b.dataset.filter;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      items.forEach((it) => it.classList.toggle('is-hidden', f !== 'All' && it.dataset.tag !== f));
      window.dispatchEvent(new Event('resize')); // refresh scroll effects
    })
  );
}

export function initQuoteForm() {
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;
  const error = form.querySelector('[data-form-error]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim() || !data.message?.trim()) {
      error.hidden = false;
      (data.name?.trim() ? form.message : form.name).focus();
      return;
    }
    error.hidden = true;
    const text = [
      'Quote request',
      `Name: ${data.name.trim()}`,
      data.phone && `Phone: ${data.phone}`,
      data.suburb && `Suburb: ${data.suburb}`,
      data.service && `Service: ${data.service}`,
      '',
      data.message.trim(),
    ]
      .filter((l) => l !== undefined && l !== false && l !== null)
      .join('\n');
    const via = e.submitter?.value || 'whatsapp';
    const url =
      via === 'email'
        ? `mailto:${EMAIL}?subject=${encodeURIComponent(`Quote request${data.service ? ` – ${data.service}` : ''}`)}&body=${encodeURIComponent(text)}`
        : `${WHATSAPP}?text=${encodeURIComponent(text)}`;
    form.dataset.lastUrl = url;
    if (via === 'email') window.location.href = url;
    else window.open(url, '_blank', 'noopener');
  });
}
