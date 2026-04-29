/**
 * Validates that the cleaned OpenAPI specs are well-formed.
 * These tests run against the actual spec files on disk.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SPECS = [
  'jira-v3',
  'jira-v2',
  'jira-software',
  'jira-sm',
  'confluence-v1',
];

const SPECS_DIR = join(import.meta.dirname, '../src/cleaned');

describe('Cleaned OpenAPI specs', () => {
  for (const specName of SPECS) {
    describe(specName, () => {
      let spec: Record<string, unknown>;

      it('is valid JSON', () => {
        const content = readFileSync(join(SPECS_DIR, `${specName}.json`), 'utf-8');
        expect(() => { spec = JSON.parse(content); }).not.toThrow();
      });

      it('has required OpenAPI fields', () => {
        const content = readFileSync(join(SPECS_DIR, `${specName}.json`), 'utf-8');
        spec = JSON.parse(content);
        expect(spec['openapi']).toBeDefined();
        expect(spec['info']).toBeDefined();
        expect(spec['paths']).toBeDefined();
      });

      it('has at least one path defined', () => {
        const content = readFileSync(join(SPECS_DIR, `${specName}.json`), 'utf-8');
        spec = JSON.parse(content);
        const paths = spec['paths'] as Record<string, unknown>;
        expect(Object.keys(paths).length).toBeGreaterThan(0);
      });

      it('has no duplicate operationIds', () => {
        const content = readFileSync(join(SPECS_DIR, `${specName}.json`), 'utf-8');
        spec = JSON.parse(content);
        const paths = spec['paths'] as Record<string, Record<string, { operationId?: string }>>;
        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const path of Object.values(paths)) {
          for (const op of Object.values(path)) {
            if (op?.operationId) {
              if (seen.has(op.operationId)) duplicates.push(op.operationId);
              seen.add(op.operationId);
            }
          }
        }
        expect(duplicates).toEqual([]);
      });
    });
  }
});
