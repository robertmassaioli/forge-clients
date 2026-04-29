// @forge-clients/core
// Re-exports all public API surface areas

export * from './adapters/index.js';
export * from './client/index.js';

// Test utilities — exported for use in tests of generated client packages
export { MockForgeAdapter } from './test-utils/MockForgeAdapter.js';
export type { RecordedCall } from './test-utils/MockForgeAdapter.js';
export * from './errors/index.js';
export * from './pagination/index.js';
export * from './retry/index.js';
export * from './auth/index.js';
