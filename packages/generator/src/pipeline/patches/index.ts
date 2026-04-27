export { applyPatches } from './types.js';
export type { SpecPatch } from './types.js';
export { jiraV3Patches } from './jira-v3.js';
export { jiraV2Patches } from './jira-v2.js';
export { confluenceV2Patches } from './confluence-v2.js';
export { confluenceV1Patches } from './confluence-v1.js';

import { jiraV3Patches } from './jira-v3.js';
import { jiraV2Patches } from './jira-v2.js';
import { confluenceV2Patches } from './confluence-v2.js';
import { confluenceV1Patches } from './confluence-v1.js';
import type { SpecPatch } from './types.js';

export const PATCHES_BY_SPEC: Record<string, SpecPatch[]> = {
  'jira-v3': jiraV3Patches,
  'jira-v2': jiraV2Patches,
  'confluence-v2': confluenceV2Patches,
  'confluence-v1': confluenceV1Patches,
  'jira-software': [],
  'jira-sm': [],
};
