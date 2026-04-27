// @forge-clients/generator — Option 4 (Custom TypeScript AST Generator)
export { specToIR } from './ir/SpecToIR.js';
export { TypeEmitter } from './emitters/TypeEmitter.js';
export { SdkEmitter } from './emitters/SdkEmitter.js';
export type { GeneratorOptions } from './types/GeneratorOptions.js';
export type { SpecPipeline } from './types/SpecPipeline.js';
export type { IRSpec, IROperation, IRType, IRTypeRef, IRProperty, IRNamedType } from './ir/IRTypes.js';
