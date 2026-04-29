import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'confluence',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
  },
});
