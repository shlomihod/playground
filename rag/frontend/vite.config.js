import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/playground/rag/' : '/',
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
});
