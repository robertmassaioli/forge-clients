/** Options for the programmatic generator API */
export interface GeneratorOptions {
  /** Which spec(s) to generate clients for */
  specs: Array<'jira-v3' | 'jira-v2' | 'confluence-v2' | 'confluence-v1' | 'jira-software' | 'jira-sm'>;
  /** Output directory for generated files. Defaults to the package src directories. */
  outputDir?: string;
  /** Whether to format generated files with Prettier */
  format?: boolean;
  /** Whether to run ESLint --fix on generated files */
  lint?: boolean;
}
