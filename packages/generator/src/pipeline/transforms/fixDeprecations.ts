/**
 * Marks known deprecated endpoints with deprecated:true and adds
 * x-forge-successor extension pointing to the replacement endpoint.
 */

import type { OpenAPIV3 } from 'openapi-types';

interface DeprecationRule {
  operationId: string;
  successor?: string;
  note?: string;
}

const DEPRECATION_RULES: DeprecationRule[] = [
  {
    operationId: 'getIssuePickerResource',
    note: 'Use searchForIssuesUsingJqlPost instead for better performance',
  },
  {
    operationId: 'searchForIssuesUsingJql',
    successor: 'searchForIssuesUsingJqlPost',
    note: 'POST /rest/api/3/search/jql is preferred over GET for large JQL queries',
  },
  {
    operationId: 'getCreateIssueMeta',
    note: 'Removed in Jira 9.0 due to performance issues. Use getIssueType and getFields instead.',
  },
];

const RULES_BY_ID = new Map(DEPRECATION_RULES.map(r => [r.operationId, r]));

export function fixDeprecations(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  for (const pathItem of Object.values(spec.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject & Record<string, unknown> | undefined;
      if (!op?.operationId) continue;

      const rule = RULES_BY_ID.get(op.operationId);
      if (!rule) continue;

      op.deprecated = true;
      if (rule.successor) op['x-forge-successor'] = rule.successor;
      if (rule.note) op['x-forge-deprecation-note'] = rule.note;
    }
  }
  return spec;
}
