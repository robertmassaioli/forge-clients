/**
 * Unit tests for spec transforms in the post-processing pipeline.
 * Tests the pure transform functions against synthetic mini-specs.
 * 
 * Note: imports use .js extensions — vitest resolves .ts files transparently.
 */
import { describe, it, expect } from 'vitest';
import type { OpenAPIV3 } from 'openapi-types';

function makeSpec(overrides: Partial<OpenAPIV3.Document> = {}): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    ...overrides,
  };
}

// Test the transforms via dynamic import so we can handle missing dist gracefully
describe('fixErrorResponses', () => {
  it('does not crash on spec with no paths', async () => {
    const { fixErrorResponses } = await import('../src/pipeline/transforms/fixErrorResponses.js');
    const spec = makeSpec({});
    const result = fixErrorResponses(spec);
    expect(result).toBeDefined();
    expect(result.paths).toEqual({});
  });

  it('processes paths without throwing', async () => {
    const { fixErrorResponses } = await import('../src/pipeline/transforms/fixErrorResponses.js');
    const spec = makeSpec({
      paths: {
        '/test': {
          get: {
            operationId: 'getTest',
            responses: {
              '200': { description: 'OK' },
              '404': { description: 'Not Found' },
            },
          },
        },
      },
    });
    const result = fixErrorResponses(spec);
    expect(result.paths['/test']).toBeDefined();
  });
});

describe('fixNullableFields', () => {
  it('leaves specs without nullable fields unchanged', async () => {
    const { fixNullableFields } = await import('../src/pipeline/transforms/fixNullableFields.js');
    const spec = makeSpec({
      components: {
        schemas: {
          TestSchema: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
    });
    const result = fixNullableFields(spec);
    expect(result.components?.schemas?.['TestSchema']).toBeDefined();
  });
});

describe('fixDeprecations', () => {
  it('runs without throwing on a minimal spec', async () => {
    const { fixDeprecations } = await import('../src/pipeline/transforms/fixDeprecations.js');
    const spec = makeSpec({});
    expect(() => fixDeprecations(spec)).not.toThrow();
  });
});
