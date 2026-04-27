/**
 * Spec target definitions — all Atlassian OpenAPI specs we download and process.
 */
export interface SpecTarget {
  id: string;
  title: string;
  /** URL to download the raw OpenAPI JSON spec from */
  downloadUrl: string;
  rawPath: string;
  cleanedPath: string;
  patchFile: string;
}

export const SPEC_TARGETS: SpecTarget[] = [
  {
    id: 'jira-v3',
    title: 'Jira Cloud REST API v3',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json',
    rawPath: 'packages/specs/src/raw/jira-v3.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-v3.json',
    patchFile: 'jira-v3',
  },
  {
    id: 'jira-v2',
    title: 'Jira Cloud REST API v2',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v2.v3.json',
    rawPath: 'packages/specs/src/raw/jira-v2.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-v2.json',
    patchFile: 'jira-v2',
  },
  {
    id: 'confluence-v2',
    title: 'Confluence Cloud REST API v2',
    downloadUrl: 'https://developer.atlassian.com/cloud/confluence/swagger-v2.v3.json',
    rawPath: 'packages/specs/src/raw/confluence-v2.json',
    cleanedPath: 'packages/specs/src/cleaned/confluence-v2.json',
    patchFile: 'confluence-v2',
  },
  {
    id: 'confluence-v1',
    title: 'Confluence Cloud REST API v1',
    downloadUrl: 'https://developer.atlassian.com/cloud/confluence/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/confluence-v1.json',
    cleanedPath: 'packages/specs/src/cleaned/confluence-v1.json',
    patchFile: 'confluence-v1',
  },
  {
    id: 'jira-software',
    title: 'Jira Software Cloud REST API',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/software/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/jira-software.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-software.json',
    patchFile: 'jira-software',
  },
  {
    id: 'jira-sm',
    title: 'Jira Service Management REST API',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/service-desk/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/jira-sm.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-sm.json',
    patchFile: 'jira-sm',
  },
];
