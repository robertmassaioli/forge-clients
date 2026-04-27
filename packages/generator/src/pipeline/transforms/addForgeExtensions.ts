/**
 * Injects Forge-specific OpenAPI extensions into the spec:
 *
 * x-forge-scopes        — OAuth scopes required for asApp and asUser
 * x-forge-pagination    — pagination pattern (offset | cursor | none)
 * x-forge-contexts      — which Forge contexts support this endpoint
 * x-forge-rate-limit-cost — estimated cost tier for rate limiting
 *
 * These extensions are consumed by the generator to produce better
 * Forge-idiomatic client code.
 */

import type { OpenAPIV3 } from 'openapi-types';

/** Maps common Jira scopes to operationId patterns */
const SCOPE_PATTERNS: Array<{
  pattern: RegExp;
  asApp: string[];
  asUser: string[];
}> = [
  { pattern: /^get|^list|^search|^find/i, asApp: ['read:jira-work'], asUser: ['read:jira-work'] },
  { pattern: /^create|^add/i,             asApp: ['write:jira-work'], asUser: ['write:jira-work'] },
  { pattern: /^update|^edit|^set/i,       asApp: ['write:jira-work'], asUser: ['write:jira-work'] },
  { pattern: /^delete|^remove/i,          asApp: ['write:jira-work'], asUser: ['write:jira-work'] },
  { pattern: /Project/i,                  asApp: ['manage:jira-project'], asUser: ['manage:jira-project'] },
  { pattern: /User|Account/i,             asApp: ['read:jira-user'], asUser: ['read:jira-user'] },
  { pattern: /Configuration|Setting/i,    asApp: ['manage:jira-configuration'], asUser: [] },
  { pattern: /Webhook/i,                  asApp: ['manage:jira-webhook'], asUser: [] },
];

/** Endpoint patterns that use offset-based pagination */
const OFFSET_PAGINATION_PATTERNS = [
  /search/i, /list/i, /getAll/i, /getComments/i, /getWorklogs/i,
  /getChangeLogs/i, /getAttachments/i, /getLinks/i,
];

/** Endpoint patterns that use cursor-based pagination (mainly Confluence v2) */
const CURSOR_PAGINATION_PATTERNS = [
  /getPages/i, /getChildren/i, /getDescendants/i, /getAncestors/i,
  /getLabels/i, /getAttachments/i,
];

export function addForgeExtensions(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  for (const pathItem of Object.values(spec.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject & Record<string, unknown> | undefined;
      if (!op?.operationId) continue;

      const id = op.operationId;

      // Add x-forge-scopes
      if (!op['x-forge-scopes']) {
        const scopes = resolveScopes(id);
        op['x-forge-scopes'] = scopes;
      }

      // Add x-forge-pagination
      if (!op['x-forge-pagination']) {
        op['x-forge-pagination'] = resolvePagination(id, method);
      }

      // Add x-forge-contexts — all contexts supported by default
      if (!op['x-forge-contexts']) {
        op['x-forge-contexts'] = ['forge-function', 'forge-container', 'forge-bridge'];
      }

      // Add x-forge-rate-limit-cost
      if (!op['x-forge-rate-limit-cost']) {
        op['x-forge-rate-limit-cost'] = method === 'get' ? 'standard' : 'high';
      }
    }
  }
  return spec;
}

function resolveScopes(operationId: string): { asApp: string[]; asUser: string[] } {
  const asApp = new Set<string>();
  const asUser = new Set<string>();

  for (const { pattern, asApp: appScopes, asUser: userScopes } of SCOPE_PATTERNS) {
    if (pattern.test(operationId)) {
      appScopes.forEach(s => asApp.add(s));
      userScopes.forEach(s => asUser.add(s));
    }
  }

  // Default fallback
  if (asApp.size === 0) asApp.add('read:jira-work');

  return { asApp: [...asApp], asUser: [...asUser] };
}

function resolvePagination(operationId: string, method: string): 'offset' | 'cursor' | 'none' {
  if (method !== 'get') return 'none';
  if (CURSOR_PAGINATION_PATTERNS.some(p => p.test(operationId))) return 'cursor';
  if (OFFSET_PAGINATION_PATTERNS.some(p => p.test(operationId))) return 'offset';
  return 'none';
}
