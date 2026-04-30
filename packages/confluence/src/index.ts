/**
 * @forge-clients/confluence
 *
 * Type-safe Confluence Cloud REST API client for Atlassian Forge Apps.
 * Defaults to the v2 API (current recommended version).
 *
 * Sub-path imports for tree-shaking (recommended for Forge apps):
 *   import { getPages } from '@forge-clients/confluence/v2';
 *   import { getContent } from '@forge-clients/confluence/v1';
 *
 * Generated from the Confluence Cloud OpenAPI specification.
 * DO NOT EDIT — regenerate using: pnpm generate
 */

// Re-export v2 as the default API surface
export * from './v2/index.js';

// Named namespace re-export for explicit v1 access
export * as ConfluenceV1 from './v1/index.js';
