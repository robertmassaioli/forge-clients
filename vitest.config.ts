import { defineConfig } from 'vitest/config';

// Root vitest config — runs tests across all packages by globbing all test files.
// Each package also has its own vitest.config.ts for per-package runs.
export default defineConfig({
  test: {
    include: [
      'packages/*/tests/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'packages/*/src/**/*.test.ts',
        'packages/*/src/**/index.ts',
        'packages/*/src/test-utils/**',
        'packages/*/src/cli.ts',
        '**/*.gen.ts',
      ],
    },
  },
});
