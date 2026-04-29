import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'generator',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/cli.ts'],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
