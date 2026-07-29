import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'scripts/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],
    // CSS is not applied in tests. jsdom has no layout engine and does not
    // evaluate media queries, so a responsive rule like the sidebar's
    // `visibility: hidden` below 64rem would apply unconditionally and remove
    // the navigation from the accessibility tree at every viewport. These are
    // semantic tests; responsive appearance needs a real browser.
    css: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
