import './styles.css';
import { initMotion, initTilt } from './motion.js';
import { initNav } from './nav.js';
import { initLightbox } from './lightbox.js';
import { initCompare } from './compare.js';
import { initFilters, initQuoteForm } from './forms.js';

initNav();
initMotion();
initTilt();
initLightbox();
initCompare();
initFilters();
initQuoteForm();

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
