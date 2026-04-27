/**
 * Main spec pipeline orchestrator.
 *
 * For each spec target:
 * 1. Download raw spec (unless cached)
 * 2. Parse and validate with swagger-parser
 * 3. Apply automated transforms
 * 4. Apply targeted patches for known defects
 * 5. Generate diff between raw and cleaned
 * 6. Write cleaned spec to packages/specs/src/cleaned/
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { SPEC_TARGETS } from './specs.js';
import type { SpecTarget } from './specs.js';
import { downloadSpec, repoRoot } from './download.js';
import { applyTransforms } from './transforms/index.js';
import { applyPatches, PATCHES_BY_SPEC } from './patches/index.js';
import { generateDiff, writeDiff } from './diff.js';

export interface PipelineOptions {
  /** Whether to force re-download even if raw spec is cached */
  force?: boolean | undefined;
  /** Only process these spec IDs (default: all) */
  only?: string[] | undefined;
  /** Write diffs but don't write cleaned specs */
  dryRun?: boolean | undefined;
  /** Skip the download step (use existing raw specs) */
  skipDownload?: boolean | undefined;
}

export async function runSpecPipeline(opts: PipelineOptions = {}): Promise<void> {
  const targets = opts.only
    ? SPEC_TARGETS.filter(t => opts.only!.includes(t.id))
    : SPEC_TARGETS;

  if (targets.length === 0) {
    throw new Error(`No matching spec targets for: ${opts.only?.join(', ')}`);
  }

  console.log(`\nRunning spec pipeline for ${targets.length} spec(s)...\n`);

  for (const target of targets) {
    await processSpec(target, opts);
  }

  console.log('\n✅ Spec pipeline complete.');
}

async function processSpec(target: SpecTarget, opts: PipelineOptions): Promise<void> {
  console.log(`\n📋 Processing: ${target.title}`);

  // Step 1: Download
  if (!opts.skipDownload) {
    const result = await downloadSpec(target, { force: opts.force, dryRun: opts.dryRun });
    console.log(`  Download: ${result}`);
  }

  const rawPath = resolve(repoRoot, target.rawPath);

  // Step 2: Parse and validate
  console.log('  Parsing and validating...');
  let spec: OpenAPIV3.Document;
  try {
    spec = await SwaggerParser.dereference(rawPath) as OpenAPIV3.Document;
    console.log(`  Valid OpenAPI spec: ${Object.keys(spec.paths ?? {}).length} paths`);
  } catch (err) {
    console.error(`  ERROR: Failed to parse ${target.id}: ${(err as Error).message}`);
    throw err;
  }

  // Keep a copy of the raw spec for diffing
  const rawSpecForDiff = JSON.parse(readFileSync(rawPath, 'utf-8')) as Record<string, unknown>;

  // Step 3: Apply automated transforms
  console.log('  Applying transforms...');
  spec = applyTransforms(spec);

  // Step 4: Apply targeted patches
  const patches = PATCHES_BY_SPEC[target.patchFile] ?? [];
  if (patches.length > 0) {
    console.log(`  Applying ${patches.length} patch(es)...`);
    applyPatches(spec as unknown as Record<string, unknown>, patches);
  }

  // Step 5: Generate diff
  const cleanedSpecObj = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;
  const diff = generateDiff(target.id, rawSpecForDiff, cleanedSpecObj);
  writeDiff(diff);

  // Step 6: Write cleaned spec
  if (!opts.dryRun) {
    const cleanedPath = resolve(repoRoot, target.cleanedPath);
    mkdirSync(resolve(cleanedPath, '..'), { recursive: true });
    writeFileSync(cleanedPath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log(`  Cleaned spec written: ${target.cleanedPath}`);
  } else {
    console.log('  [dry-run] Would write cleaned spec');
  }
}
