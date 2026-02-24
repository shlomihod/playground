import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/playground/react/' : '/',
  build: {
    target: 'esnext',
  },
});
