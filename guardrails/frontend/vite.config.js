import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/playground/guardrails/' : '/',
  build: {
    target: 'esnext',
  },
  server: {
    fs: { allow: ['..', '../..', '../../..'] },
  },
});
