import type { OpenAPIV3 } from 'openapi-types';

/**
 * Deduplicates operationIds in the Jira Service Management Cloud REST API spec.
 *
 * The JSM spec reuses the same operationId for operations that exist at both
 * a global resource root AND scoped under a serviceDesk or requestType resource.
 *
 * We use a direct object-property approach (not JSON Patch) because the path
 * keys contain curly-brace template variables like {serviceDeskId} which are
 * not reliably handled by JSON Pointer ~1 encoding in fast-json-patch.
 *
 * Naming strategy: short context prefix derived from the resource scope:
 *   - "Global"          — operation at the root resource (no scope parent)
 *   - "ForServiceDesk"  — scoped under /servicedesk/{serviceDeskId}/
 *   - "ForOrg"          — scoped under /organization/{organizationId}/
 *   - "ForRequestType"  — scoped under /requesttype/{requestTypeId}/
 *
 * This keeps names under 35 characters vs. appending the full path segment
 * which would produce unusable 80+ character identifiers.
 */

interface OpIdPatch {
  path: string;
  method: string;
  newOperationId: string;
}

const OPERATION_ID_PATCHES: OpIdPatch[] = [
  // getArticles: global vs serviceDesk-scoped
  { path: '/rest/servicedeskapi/knowledgebase/article',                                                             method: 'get',    newOperationId: 'getArticlesGlobal' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/knowledgebase/article',                                 method: 'get',    newOperationId: 'getArticlesForServiceDesk' },
  // getOrganizations: global vs serviceDesk-scoped
  { path: '/rest/servicedeskapi/organization',                                                                       method: 'get',    newOperationId: 'getOrganizationsGlobal' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/organization',                                           method: 'get',    newOperationId: 'getOrganizationsForServiceDesk' },
  // getPropertiesKeys: org-scoped vs requestType-scoped
  { path: '/rest/servicedeskapi/organization/{organizationId}/property',                                             method: 'get',    newOperationId: 'getPropertiesKeysForOrg' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property',                   method: 'get',    newOperationId: 'getPropertiesKeysForRequestType' },
  // getProperty: org-scoped vs requestType-scoped
  { path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',                               method: 'get',    newOperationId: 'getPropertyForOrg' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',     method: 'get',    newOperationId: 'getPropertyForRequestType' },
  // setProperty: org-scoped vs requestType-scoped
  { path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',                               method: 'put',    newOperationId: 'setPropertyForOrg' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',     method: 'put',    newOperationId: 'setPropertyForRequestType' },
  // deleteProperty: org-scoped vs requestType-scoped
  { path: '/rest/servicedeskapi/organization/{organizationId}/property/{propertyKey}',                               method: 'delete', newOperationId: 'deletePropertyForOrg' },
  { path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/requesttype/{requestTypeId}/property/{propertyKey}',     method: 'delete', newOperationId: 'deletePropertyForRequestType' },
];

/**
 * Pipeline transform that fixes duplicate operationIds in the JSM spec.
 * Import and add to the transforms array for the jira-sm spec target.
 */
export function deduplicateJiraSmOperationIds(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  const paths = spec.paths as Record<string, Record<string, OpenAPIV3.OperationObject>> | undefined;
  if (!paths) return spec;

  let fixed = 0;
  for (const patch of OPERATION_ID_PATCHES) {
    const pathItem = paths[patch.path];
    if (!pathItem) {
      console.warn(`  [jira-sm] path not found: ${patch.path}`);
      continue;
    }
    const op = pathItem[patch.method];
    if (!op) {
      console.warn(`  [jira-sm] op not found: ${patch.method.toUpperCase()} ${patch.path}`);
      continue;
    }
    const old = op.operationId;
    op.operationId = patch.newOperationId;
    console.log(`  [jira-sm] ${old} → ${patch.newOperationId}`);
    fixed++;
  }
  console.log(`  [jira-sm] Fixed ${fixed}/${OPERATION_ID_PATCHES.length} operationIds`);
  return spec;
}
