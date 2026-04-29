/**
 * @forge-clients/jira
 *
 * Type-safe Jira Cloud REST API client for Atlassian Forge Apps.
 * Defaults to the v3 API (current recommended version).
 *
 * Sub-path imports for tree-shaking (recommended for Forge apps):
 *   import { getIssue } from '@forge-clients/jira/v3';
 *   import { getIssue } from '@forge-clients/jira/v2';
 *   import { getBoard } from '@forge-clients/jira/software';
 *   import { getQueue } from '@forge-clients/jira/service-management';
 *
 * Generated from the Jira Cloud OpenAPI specification.
 * DO NOT EDIT — regenerate using: pnpm generate
 */

// Re-export v3 as the default API surface
export * from './v3/index.js';

// Named namespace re-exports for explicit versioned access
export * as JiraV2 from './v2/index.js';
export * as JiraSoftware from './software/index.js';
export * as JiraSM from './service-management/index.js';
