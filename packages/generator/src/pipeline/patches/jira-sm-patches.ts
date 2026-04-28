import type { SpecPatch } from './types.js';

/**
 * Targeted patches for the Jira Service Management Cloud REST API spec.
 *
 * Fixes 6 pairs of duplicate operationIds using short context-aware prefixes:
 *   - "Global"          — operation at the root resource level
 *   - "ForServiceDesk"  — operation scoped under a specific serviceDesk
 *   - "ForOrg"          — operation scoped under an organization
 *   - "ForRequestType"  — operation scoped under a request type
 *
 * Naming rationale: prefixes are kept short (1-2 words) rather than
 * appending the full path segment. Full path suffix would produce names
 * like "getArticlesRestServicedeskapiServicedeskServiceDeskIdKnowledgebaseArticle"
 * which are unusable. Context prefixes stay under 35 characters total.
 */
export const jiraSmPatches: SpecPatch[] = [
  // getArticles: global vs serviceDesk-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1knowledgebase~1article/get/operationId',
    op: 'replace',
    value: 'getArticlesGlobal',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1knowledgebase~1article/get/operationId',
    op: 'replace',
    value: 'getArticlesForServiceDesk',
  },
  // getOrganizations: global vs serviceDesk-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1organization/get/operationId',
    op: 'replace',
    value: 'getOrganizationsGlobal',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1organization/get/operationId',
    op: 'replace',
    value: 'getOrganizationsForServiceDesk',
  },
  // getPropertiesKeys: org-scoped vs requestType-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1organization~1{organizationId}~1property/get/operationId',
    op: 'replace',
    value: 'getPropertiesKeysForOrg',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1requesttype~1{requestTypeId}~1property/get/operationId',
    op: 'replace',
    value: 'getPropertiesKeysForRequestType',
  },
  // getProperty: org-scoped vs requestType-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1organization~1{organizationId}~1property~1{propertyKey}/get/operationId',
    op: 'replace',
    value: 'getPropertyForOrg',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1requesttype~1{requestTypeId}~1property~1{propertyKey}/get/operationId',
    op: 'replace',
    value: 'getPropertyForRequestType',
  },
  // setProperty: org-scoped vs requestType-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1organization~1{organizationId}~1property~1{propertyKey}/put/operationId',
    op: 'replace',
    value: 'setPropertyForOrg',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1requesttype~1{requestTypeId}~1property~1{propertyKey}/put/operationId',
    op: 'replace',
    value: 'setPropertyForRequestType',
  },
  // deleteProperty: org-scoped vs requestType-scoped
  {
    path: '/paths/~1rest~1servicedeskapi~1organization~1{organizationId}~1property~1{propertyKey}/delete/operationId',
    op: 'replace',
    value: 'deletePropertyForOrg',
  },
  {
    path: '/paths/~1rest~1servicedeskapi~1servicedesk~1{serviceDeskId}~1requesttype~1{requestTypeId}~1property~1{propertyKey}/delete/operationId',
    op: 'replace',
    value: 'deletePropertyForRequestType',
  },
];
