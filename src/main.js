import './styles.css';
import { initMotion, initServices } from './motion.js';
import { initNav } from './nav.js';
import { initLightbox } from './lightbox.js';
import { initCompare } from './compare.js';

initNav();
initMotion();
initServices();
initLightbox();
initCompare();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
