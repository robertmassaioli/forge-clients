import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests live in tests/ not co-located with source
    include: ['tests/**/*.test.ts'],
    // Use tsconfig.test.json which includes both src/ and tests/
    typecheck: { tsconfig: './tsconfig.test.json' },
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
