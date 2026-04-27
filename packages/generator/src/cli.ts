#!/usr/bin/env node
/**
 * @forge-clients/generator CLI
 * forge-clients-gen update-specs      Download and process Atlassian OpenAPI specs
 * forge-clients-gen generate          Generate TypeScript clients from cleaned specs
 */
import { Command } from 'commander';
import { runSpecPipeline } from './pipeline/run.js';

const program = new Command();

program
  .name('forge-clients-gen')
  .description('Generator CLI for @forge-clients Jira and Confluence REST API clients')
  .version('0.1.0');

program
  .command('update-specs')
  .description('Download and process the latest Atlassian OpenAPI specs')
  .option('--force', 'Force re-download even if raw specs are cached')
  .option('--dry-run', 'Show what would change without writing cleaned specs')
  .option('--skip-download', 'Skip download step — use existing cached raw specs')
  .option('--only <specs>', 'Comma-separated list of spec IDs to process (e.g. jira-v3,confluence-v2)')
  .action(async (options: {
    force?: boolean;
    dryRun?: boolean;
    skipDownload?: boolean;
    only?: string;
  }) => {
    try {
      await runSpecPipeline({
        force: options.force,
        dryRun: options.dryRun,
        skipDownload: options.skipDownload,
        only: options.only ? options.only.split(',').map(s => s.trim()) : undefined,
      });
    } catch (err) {
      console.error('\n❌ Pipeline failed:', (err as Error).message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate TypeScript clients from the cleaned OpenAPI specs (run update-specs first)')
  .option('--spec <spec>', 'Which spec to generate (jira-v3, jira-v2, confluence-v2, confluence-v1, all)', 'all')
  .action((_options: { spec: string }) => {
    console.log('generate — implementation lives in the option-specific branches');
    console.log('Run this command from the implement/option-2 or implement/option-4 branch.');
    process.exit(0);
  });

program.parse();
