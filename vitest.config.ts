import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      // The angular entry point imports 'boredload' as a bare specifier
      // (required by ng-packagr's entry-point boundary rules) — alias it
      // back to source for tests, since it isn't installed as a real
      // dependency of itself.
      { find: 'boredload', replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
      // boredload-game.controller.ts also imports '../../index.mjs' — a
      // literal path that's only correct relative to ng-packagr's bundled
      // output location (dist/angular/fesm2022/), not this source file's
      // own location. Redirect that exact specifier back to source too.
      {
        find: /^\.\.\/\.\.\/index\.mjs$/,
        replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['examples/**', 'dist/**', 'scripts/**', 'src/test/**'],
    },
  },
});
