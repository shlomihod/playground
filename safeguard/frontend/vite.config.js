import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/playground/safeguard/' : '/',
  build: {
    target: 'esnext',
  },
  server: {
    fs: { allow: ['..', '../..', '../../..'] },
  },
});
