/**
 * @forge-clients/jira
 *
 * Type-safe Jira Cloud REST API client for Atlassian Forge Apps.
 * Defaults to the v3 API (current recommended version).
 *
 * For explicit version imports:
 *   import { ... } from '@forge-clients/jira/v3';
 *   import { ... } from '@forge-clients/jira/v2';
 *
 * Generated from the Jira Cloud OpenAPI specification.
 * DO NOT EDIT — regenerate using: pnpm generate
 */

// Re-export v3 as the default API
export * from './v3/index.js';

// Re-export v2 under a namespace for consumers who need it explicitly
export * as JiraV2 from './v2/index.js';
