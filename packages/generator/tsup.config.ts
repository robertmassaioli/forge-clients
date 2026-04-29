import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI bundle — shebang banner, no DTS needed
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    banner: { js: '#!/usr/bin/env node' },
  },
  // Library bundle — no shebang, with DTS
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: { resolve: true, tsconfig: './tsconfig.build.json' },
    sourcemap: true,
    clean: true,
    splitting: false,
    tsconfig: './tsconfig.build.json',
  },
]);
