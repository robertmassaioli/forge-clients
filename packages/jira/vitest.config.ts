import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'jira',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
  },
});
