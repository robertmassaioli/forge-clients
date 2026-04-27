import type { SpecPatch } from './types.js';

/** Targeted patches for the Jira Cloud REST API v2 spec. */
export const jiraV2Patches: SpecPatch[] = [
  {
    description: 'Mark leadAccountId as deprecated in v2 project creation',
    path: ['components', 'schemas', 'CreateProjectDetails', 'properties', 'leadAccountId'],
    operation: 'merge',
    value: {
      deprecated: true,
      'x-forge-note': 'Use `lead` field instead.',
    },
  },
];
