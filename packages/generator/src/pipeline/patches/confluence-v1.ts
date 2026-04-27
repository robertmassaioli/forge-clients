import type { SpecPatch } from './types.js';

/** Targeted patches for the Confluence Cloud REST API v1 spec. */
export const confluenceV1Patches: SpecPatch[] = [
  {
    description: 'Mark v1 as deprecated in favour of v2',
    path: ['info'],
    operation: 'merge',
    value: {
      'x-forge-deprecated': true,
      'x-forge-successor': 'confluence-v2',
      'x-forge-note': 'Confluence REST API v1 is deprecated. Migrate to v2 for better performance and more accurate schemas.',
    },
  },
];
