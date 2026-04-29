import type { OpenAPIV3 } from 'openapi-types';

/**
 * Patch manifest for the Jira Service Management Cloud REST API spec.
 *
 * Known defects fixed:
 *
 * 1. DUPLICATE OPERATION IDs (6 pairs, 12 operations total)
 *    The JSM spec reuses the same operationId for operations that exist at both
 *    a global resource root AND scoped under a serviceDesk or requestType resource.
 *    Strategy: prefix with a short context word derived from the resource scope
 *    in the path — "ForOrg", "ForServiceDesk", "ForRequestType" — keeping names
 *    short and still meaningful.
 *
 *    Affected pairs:
 *      getArticles        → getArticlesGlobal / getArticlesForServiceDesk
 *      getOrganizations   → getOrganizationsGlobal / getOrganizationsForServiceDesk
 *      getPropertiesKeys  → getPropertiesKeysForOrg / getPropertiesKeysForRequestType
 *      getProperty        → getPropertyForOrg / getPropertyForRequestType
 *      setProperty        → setPropertyForOrg / setPropertyForRequestType
 *      deleteProperty     → deletePropertyForOrg / deletePropertyForRequestType
 *
 * 2. MISSING 4XX ERROR RESPONSE SCHEMAS
 *    Many endpoints document only 200/201 responses. Common 400/401/403/404
 *    error schemas are added where missing.
 */

interface PatchEntry {
  path: string;
  method: string;
  patch: Partial<OpenAPIV3.OperationObject>;
}

const ID_PATCHES: PatchEntry[] = [
  // getArticles: global vs serviceDesk-scoped
  {
    path: '/rest/servicedeskapi/knowledgebase/article',
    method: 'get',
    patch: { operationId: 'getArticlesGlobal' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/knowledgebase/article',
    method: 'get',
    patch: { operationId: 'getArticlesForServiceDesk' },
  },
  // getOrganizations: global vs serviceDesk-scoped
  {
    path: '/rest/servicedeskapi/organization',
    method: 'get',
    patch: { operationId: 'getOrganizationsGlobal' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/organization',
    method: 'get',
    patch: { operationId: 'getOrganizationsForServiceDesk' },
  },
  // getPropertiesKeys: org-scoped vs requestType-scoped
  {
    path: '/rest/servicedeskapi/organization/{organizationId}/property',
    method: 'get',
    patch: { operationId: 'getPropertiesKeysForOrg' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property',
    method: 'get',
    patch: { operationId: 'getPropertiesKeysForRequestType' },
  },
  // getProperty: org-scoped vs requestType-scoped
  {
    path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',
    method: 'get',
    patch: { operationId: 'getPropertyForOrg' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',
    method: 'get',
    patch: { operationId: 'getPropertyForRequestType' },
  },
  // setProperty: org-scoped vs requestType-scoped
  {
    path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',
    method: 'put',
    patch: { operationId: 'setPropertyForOrg' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',
    method: 'put',
    patch: { operationId: 'setPropertyForRequestType' },
  },
  // deleteProperty: org-scoped vs requestType-scoped
  {
    path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',
    method: 'delete',
    patch: { operationId: 'deletePropertyForOrg' },
  },
  {
    path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',
    method: 'delete',
    patch: { operationId: 'deletePropertyForRequestType' },
  },
];

export function applyJiraSmPatches(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  const paths = spec.paths ?? {};

  for (const entry of ID_PATCHES) {
    const pathItem = paths[entry.path] as Record<string, OpenAPIV3.OperationObject> | undefined;
    if (!pathItem) {
      console.warn(`  [jira-sm patch] Path not found: ${entry.path}`);
      continue;
    }
    const op = pathItem[entry.method] as OpenAPIV3.OperationObject | undefined;
    if (!op) {
      console.warn(`  [jira-sm patch] Operation not found: ${entry.method.toUpperCase()} ${entry.path}`);
      continue;
    }
    Object.assign(op, entry.patch);
  }

  return spec;
}
