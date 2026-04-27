/**
 * Generates a human-readable diff summary between raw and cleaned specs.
 * Written to packages/specs/src/diffs/ for review after each pipeline run.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(__dirname, '..', '..', '..', '..');

export interface DiffSummary {
  specId: string;
  addedPaths: string[];
  removedPaths: string[];
  modifiedPaths: string[];
  addedSchemas: string[];
  removedSchemas: string[];
  timestamp: string;
}

export function generateDiff(
  specId: string,
  rawSpec: Record<string, unknown>,
  cleanedSpec: Record<string, unknown>,
): DiffSummary {
  const rawPaths = new Set(Object.keys((rawSpec['paths'] as Record<string, unknown>) ?? {}));
  const cleanedPaths = new Set(Object.keys((cleanedSpec['paths'] as Record<string, unknown>) ?? {}));

  const rawSchemas = new Set(Object.keys(
    ((rawSpec['components'] as Record<string, unknown>)?.['schemas'] as Record<string, unknown>) ?? {}
  ));
  const cleanedSchemas = new Set(Object.keys(
    ((cleanedSpec['components'] as Record<string, unknown>)?.['schemas'] as Record<string, unknown>) ?? {}
  ));

  return {
    specId,
    addedPaths: [...cleanedPaths].filter(p => !rawPaths.has(p)),
    removedPaths: [...rawPaths].filter(p => !cleanedPaths.has(p)),
    modifiedPaths: [...cleanedPaths].filter(p => rawPaths.has(p) &&
      JSON.stringify((rawSpec['paths'] as Record<string, unknown>)[p]) !==
      JSON.stringify((cleanedSpec['paths'] as Record<string, unknown>)[p])
    ),
    addedSchemas: [...cleanedSchemas].filter(s => !rawSchemas.has(s)),
    removedSchemas: [...rawSchemas].filter(s => !cleanedSchemas.has(s)),
    timestamp: new Date().toISOString(),
  };
}

export function writeDiff(summary: DiffSummary): void {
  const outDir = resolve(repoRoot, 'packages/specs/src/diffs');
  mkdirSync(outDir, { recursive: true });

  const outPath = resolve(outDir, `${summary.specId}.diff.json`);
  writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`  Diff written: ${outPath}`);
  console.log(`    Added paths: ${summary.addedPaths.length}`);
  console.log(`    Removed paths: ${summary.removedPaths.length}`);
  console.log(`    Modified paths: ${summary.modifiedPaths.length}`);
  console.log(`    Added schemas: ${summary.addedSchemas.length}`);
  console.log(`    Removed schemas: ${summary.removedSchemas.length}`);
}
