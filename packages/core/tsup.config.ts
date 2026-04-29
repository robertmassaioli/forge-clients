import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // DTS disabled: @forge/api is a Forge runtime package not available at build time.
  // Type declarations are generated separately via `tsc --declaration --emitDeclarationOnly`
  // using the tsconfig.build.json which excludes @forge/api from type checking.
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['@forge/api', '@forge/bridge'],
});
