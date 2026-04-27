import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
    'errors/index': 'src/errors/index.ts',
    'pagination/index': 'src/pagination/index.ts',
    'retry/index': 'src/retry/index.ts',
    'auth/index': 'src/auth/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
