// @forge-clients/generator — shared spec pipeline
export { runSpecPipeline } from './pipeline/run.js';
export { downloadSpec, downloadAllSpecs } from './pipeline/download.js';
export { applyTransforms } from './pipeline/transforms/index.js';
export { applyPatches, PATCHES_BY_SPEC } from './pipeline/patches/index.js';
export { generateDiff, writeDiff } from './pipeline/diff.js';
export { SPEC_TARGETS } from './pipeline/specs.js';
export type { SpecTarget } from './pipeline/specs.js';
export type { PipelineOptions } from './pipeline/run.js';
export type { SpecPatch } from './pipeline/patches/types.js';
export type { GeneratorOptions } from './types/GeneratorOptions.js';
