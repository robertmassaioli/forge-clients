import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'specs',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.json', 'src/**/index.ts'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
