/**
 * Downloads raw Atlassian OpenAPI specs to packages/specs/src/raw/.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SpecTarget } from './specs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(__dirname, '..', '..', '..', '..');

export async function downloadSpec(
  target: SpecTarget,
  opts: { force?: boolean | undefined; dryRun?: boolean | undefined } = {},
): Promise<'downloaded' | 'skipped'> {
  const outPath = resolve(repoRoot, target.rawPath);

  if (!opts.force && !opts.dryRun && existsSync(outPath)) {
    return 'skipped';
  }

  if (opts.dryRun) {
    console.log(`  [dry-run] Would download: ${target.downloadUrl} -> ${target.rawPath}`);
    return 'skipped';
  }

  console.log(`  Downloading: ${target.downloadUrl}`);

  const response = await fetch(target.downloadUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': '@forge-clients/generator spec-pipeline',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download ${target.id}: HTTP ${response.status} ${response.statusText}\n` +
      `URL: ${target.downloadUrl}`,
    );
  }

  const text = await response.text();

  // Validate it's parseable JSON before writing
  try {
    JSON.parse(text);
  } catch {
    throw new Error(`Downloaded spec for ${target.id} is not valid JSON`);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text, 'utf-8');

  return 'downloaded';
}

export async function downloadAllSpecs(
  targets: SpecTarget[],
  opts: { force?: boolean; dryRun?: boolean } = {},
): Promise<void> {
  const results = await Promise.allSettled(
    targets.map(t => downloadSpec(t, opts)),
  );

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const target = targets[i]!;
    if (result.status === 'fulfilled') {
      if (result.value === 'downloaded') downloaded++;
      else skipped++;
    } else {
      failed++;
      console.error(`  ERROR downloading ${target.id}: ${(result.reason as Error).message}`);
    }
  }

  console.log(`  Downloaded: ${downloaded}, Skipped (cached): ${skipped}, Failed: ${failed}`);
  if (failed > 0) throw new Error(`${failed} spec(s) failed to download`);
}
