import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the monorepo */
export const repoRoot = resolve(__dirname, '../../../../..');

export interface SpecTarget {
  /** Short identifier used for filenames and CLI --only flag */
  id: string;
  /** Human-readable name */
  name: string;
  /** Download URL for the raw OpenAPI spec */
  downloadUrl: string;
  /** Path relative to repoRoot for the raw downloaded spec */
  rawPath: string;
  /** Path relative to repoRoot for the cleaned output spec */
  cleanedPath: string;
  /** Path relative to repoRoot for the diff output */
  diffPath: string;
  /** Which @forge-clients package this spec belongs to */
  targetPackage: 'jira' | 'confluence';
}

export const SPEC_TARGETS: SpecTarget[] = [
  {
    id: 'jira-v3',
    name: 'Jira Cloud REST API v3',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json',
    rawPath: 'packages/specs/src/raw/jira-v3.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-v3.json',
    diffPath: 'packages/specs/src/diffs/jira-v3.diff.json',
    targetPackage: 'jira',
  },
  {
    id: 'jira-v2',
    name: 'Jira Cloud REST API v2',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/platform/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/jira-v2.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-v2.json',
    diffPath: 'packages/specs/src/diffs/jira-v2.diff.json',
    targetPackage: 'jira',
  },
  {
    id: 'jira-software',
    name: 'Jira Software Cloud REST API',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/software/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/jira-software.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-software.json',
    diffPath: 'packages/specs/src/diffs/jira-software.diff.json',
    targetPackage: 'jira',
  },
  {
    id: 'jira-sm',
    name: 'Jira Service Management Cloud REST API',
    downloadUrl: 'https://developer.atlassian.com/cloud/jira/service-desk/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/jira-sm.json',
    cleanedPath: 'packages/specs/src/cleaned/jira-sm.json',
    diffPath: 'packages/specs/src/diffs/jira-sm.diff.json',
    targetPackage: 'jira',
  },
  {
    id: 'confluence-v1',
    name: 'Confluence Cloud REST API v1',
    downloadUrl: 'https://developer.atlassian.com/cloud/confluence/swagger.v3.json',
    rawPath: 'packages/specs/src/raw/confluence-v1.json',
    cleanedPath: 'packages/specs/src/cleaned/confluence-v1.json',
    diffPath: 'packages/specs/src/diffs/confluence-v1.diff.json',
    targetPackage: 'confluence',
  },
  {
    id: 'confluence-v2',
    name: 'Confluence Cloud REST API v2',
    downloadUrl: 'https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json?_v=1.8486.0',
    rawPath: 'packages/specs/src/raw/confluence-v2.json',
    cleanedPath: 'packages/specs/src/cleaned/confluence-v2.json',
    diffPath: 'packages/specs/src/diffs/confluence-v2.diff.json',
    targetPackage: 'confluence',
  },
];
