import type { SpecPatch } from './types.js';

/**
 * Targeted patches for the Confluence Cloud REST API v2 spec.
 * See ai-planning/02-openapi-spec-assessment.md for full catalogue.
 */
export const confluenceV2Patches: SpecPatch[] = [
  {
    description: 'Add x-forge-note about documented vs actual response discrepancies',
    path: ['info'],
    operation: 'merge',
    value: {
      'x-forge-note': 'Atlassian officially notes that documented responses may differ slightly from actual responses, particularly for calls requiring custom enrichers (e.g. _links and _expandable properties).',
    },
  },
  {
    description: 'Mark audit endpoint pagination as limited to 1000 records',
    path: ['paths', '/wiki/rest/api/audit'],
    operation: 'merge',
    value: {
      'x-forge-pagination-max': 1000,
      'x-forge-pagination-mode': 'offset-only',
      'x-forge-note': 'This endpoint is capped at 1000 records per request. There is no cursor-based pagination available.',
    },
  },
];
