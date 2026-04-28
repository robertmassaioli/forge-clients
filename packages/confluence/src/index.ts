/**
 * @forge-clients/confluence
 *
 * Type-safe Confluence Cloud REST API client for Atlassian Forge Apps.
 * Currently ships the v1 API. The Confluence v2 API spec is not available
 * as a direct JSON download from developer.atlassian.com; it can only be
 * downloaded via the "meatball menu" on the docs page. A v2 spec will be
 * added when a reliable download URL or community-maintained copy is available.
 *
 * For explicit version imports:
 *   import { ... } from '@forge-clients/confluence/v1';
 *
 * Generated from the Confluence Cloud OpenAPI specification.
 * DO NOT EDIT — regenerate using: pnpm generate
 */

// Re-export v1 as the default (only available) API
export * from './v1/index.js';
