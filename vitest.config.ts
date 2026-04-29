import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Root vitest config — runs tests across all packages by globbing all test files.
// Each package also has its own vitest.config.ts for per-package runs.
//
// Aliases redirect workspace package imports to their TypeScript source so that
// tests run without requiring a prior `pnpm build` step (important for CI).
export default defineConfig({
  resolve: {
    alias: {
      '@forge-clients/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@forge-clients/jira': resolve(__dirname, 'packages/jira/src/index.ts'),
      '@forge-clients/confluence': resolve(__dirname, 'packages/confluence/src/index.ts'),
      '@forge-clients/specs': resolve(__dirname, 'packages/specs/src/index.ts'),
    },
  },
  test: {
    include: [
      'packages/*/tests/**/*.test.ts',
      'packages/*/src/__tests__/**/*.test.ts',
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
