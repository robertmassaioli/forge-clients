import type { SpecPatch } from './types.js';

/**
 * Targeted patches for known defects in the Jira Cloud REST API v3 spec.
 * See ai-planning/02-openapi-spec-assessment.md for full catalogue.
 */
export const jiraV3Patches: SpecPatch[] = [
  {
    description: 'Mark leadAccountId as deprecated — silently ignored by the API',
    path: ['components', 'schemas', 'CreateProjectDetails', 'properties', 'leadAccountId'],
    operation: 'merge',
    value: {
      deprecated: true,
      'x-forge-note': 'leadAccountId is documented but silently ignored. Use `lead` field instead.',
    },
  },
  {
    description: 'Mark getCreateIssueMeta as removed — caused OOM in Jira 9+',
    path: ['paths', '/rest/api/3/issue/createmeta'],
    operation: 'merge',
    value: {
      'x-forge-note': 'This endpoint was removed in Jira 9.0 due to OOM issues with large projects. Use getIssueType and getFields separately.',
    },
  },
  {
    description: 'Add x-forge-note to self links about proxy URL differences',
    path: ['components', 'schemas', 'IssueBean', 'properties', 'self'],
    operation: 'merge',
    value: {
      'x-forge-note': 'The self URL format differs when accessed via the api.atlassian.com proxy vs direct site URL. Do not use self links for constructing API calls within Forge apps.',
    },
  },
  {
    description: 'Mark search GET endpoint as deprecated in favour of POST',
    path: ['paths', '/rest/api/3/search'],
    operation: 'merge',
    value: {
      'x-forge-deprecation-note': 'Prefer POST /rest/api/3/search/jql for large JQL queries to avoid URL length limits.',
    },
  },
];
