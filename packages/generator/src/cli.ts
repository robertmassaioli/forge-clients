/**
 * @forge-clients/generator CLI
 *
 * Usage:
 *   forge-clients-gen generate          Generate clients from cleaned specs
 *   forge-clients-gen update-specs      Download and patch the latest Atlassian specs
 *   forge-clients-gen --help            Show help
 */
import { Command } from 'commander';

const program = new Command();

program
  .name('forge-clients-gen')
  .description('Generator CLI for @forge-clients Jira and Confluence REST API clients')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate TypeScript clients from the cleaned OpenAPI specs')
  .option('--spec <spec>', 'Which spec to generate (jira-v3, jira-v2, confluence-v2, confluence-v1, all)', 'all')
  .option('--out <dir>', 'Output directory (overrides default package paths)')
  .action((_options: { spec: string; out?: string }) => {
    // Implementation pending — see generator implementation phase
    console.log('generate command — implementation pending');
    process.exit(0);
  });

program
  .command('update-specs')
  .description('Download the latest Atlassian OpenAPI specs and apply post-processing pipeline')
  .option('--dry-run', 'Show what would change without writing files')
  .action((_options: { dryRun?: boolean }) => {
    // Implementation pending — see generator implementation phase
    console.log('update-specs command — implementation pending');
    process.exit(0);
  });

program.parse();
