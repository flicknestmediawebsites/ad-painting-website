import { defineConfig } from 'vite';

// Vite bundles the CSS/JS (src/main.js); scripts/build-pages.mjs then renders
// every HTML page into dist/ using the asset names from the manifest.
export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2019',
    cssMinify: true,
    manifest: true,
    rollupOptions: { input: 'src/main.js' },
  },
});
