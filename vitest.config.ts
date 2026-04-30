import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Root vitest config — runs tests across all packages by globbing all test files.
// Each package also has its own vitest.config.ts for per-package runs.
//
// Aliases redirect workspace package imports to their TypeScript source so that
// tests run without requiring a prior `pnpm build` step (important for CI).
export default defineConfig({
  resolve: {
    alias: [
      // Sub-path imports must come BEFORE their root package aliases,
      // otherwise the root alias matches first and the sub-path is never reached.
      { find: '@forge-clients/jira/v3', replacement: resolve(__dirname, 'packages/jira/src/v3/index.ts') },
      { find: '@forge-clients/jira/v2', replacement: resolve(__dirname, 'packages/jira/src/v2/index.ts') },
      { find: '@forge-clients/jira/software', replacement: resolve(__dirname, 'packages/jira/src/software/index.ts') },
      { find: '@forge-clients/jira/service-management', replacement: resolve(__dirname, 'packages/jira/src/service-management/index.ts') },
      { find: '@forge-clients/confluence/v1', replacement: resolve(__dirname, 'packages/confluence/src/v1/index.ts') },
      { find: '@forge-clients/confluence/v2', replacement: resolve(__dirname, 'packages/confluence/src/v2/index.ts') },
      // Root package aliases
      { find: '@forge-clients/core', replacement: resolve(__dirname, 'packages/core/src/index.ts') },
      { find: '@forge-clients/jira', replacement: resolve(__dirname, 'packages/jira/src/index.ts') },
      { find: '@forge-clients/confluence', replacement: resolve(__dirname, 'packages/confluence/src/index.ts') },
      { find: '@forge-clients/specs', replacement: resolve(__dirname, 'packages/specs/src/index.ts') },
    ],
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
