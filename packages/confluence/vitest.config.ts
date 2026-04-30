import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      // Redirect workspace package imports to their source — avoids needing
      // a prior `pnpm build` step before running tests in CI.
      { find: '@forge-clients/core', replacement: resolve(__dirname, '../core/src/index.ts') },
      // Sub-path exports — map to source so tests don't require a prior build
      { find: '@forge-clients/confluence/v1', replacement: resolve(__dirname, 'src/v1/index.ts') },
      { find: '@forge-clients/confluence/v2', replacement: resolve(__dirname, 'src/v2/index.ts') },
      { find: '@forge-clients/confluence', replacement: resolve(__dirname, 'src/index.ts') },
    ],
  },
  test: {
    name: 'confluence',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
  },
});
