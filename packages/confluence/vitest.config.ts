import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Redirect workspace package imports to their source — avoids needing
      // a prior `pnpm build` step before running tests in CI.
      '@forge-clients/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    name: 'confluence',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
  },
});
