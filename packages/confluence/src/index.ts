/**
 * @forge-clients/confluence
 *
 * Type-safe Confluence Cloud REST API client for Atlassian Forge Apps.
 * Defaults to the v2 API (current recommended version).
 *
 * For explicit version imports:
 *   import { ... } from '@forge-clients/confluence/v2';
 *   import { ... } from '@forge-clients/confluence/v1';
 *
 * Generated from the Confluence Cloud OpenAPI specification.
 * DO NOT EDIT — regenerate using: pnpm generate
 */

// Re-export v2 as the default API
export * from './v2/index.js';

// Re-export v1 under a namespace for consumers who need it explicitly
export * as ConfluenceV1 from './v1/index.js';
