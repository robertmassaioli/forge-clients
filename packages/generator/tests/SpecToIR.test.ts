/**
 * Unit tests for SpecToIR — converts OpenAPI specs to the forge-clients IR.
 * Uses small synthetic specs rather than the full Jira/Confluence specs.
 */
import { describe, it, expect } from 'vitest';
import { specToIR } from '../src/ir/SpecToIR.js';
import type { OpenAPIV3 } from 'openapi-types';

function makeSpec(overrides: Partial<OpenAPIV3.Document> = {}): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    components: { schemas: {} },
    ...overrides,
  };
}

describe('specToIR — basic operation extraction', () => {
  it('extracts a simple GET operation', () => {
    const spec = makeSpec({
      paths: {
        '/rest/api/3/myself': {
          get: {
            operationId: 'getCurrentUser',
            summary: 'Get current user',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    });

    const ir = specToIR(spec, 'Test');
    expect(ir.operations).toHaveLength(1);
    const op = ir.operations[0]!;
    expect(op.operationId).toBe('getCurrentUser');
    expect(op.method).toBe('GET');
    expect(op.path).toBe('/rest/api/3/myself');
  });

  it('extracts POST operation with request body', () => {
    const spec = makeSpec({
      paths: {
        '/rest/api/3/issue': {
          post: {
            operationId: 'createIssue',
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/IssueInput' },
                },
              },
            },
            responses: { '201': { description: 'Created' } },
          },
        },
      },
      components: {
        schemas: {
          IssueInput: { type: 'object', properties: { summary: { type: 'string' } } },
        },
      },
    });

    const ir = specToIR(spec, 'Test');
    const op = ir.operations[0]!;
    expect(op.operationId).toBe('createIssue');
    expect(op.method).toBe('POST');
    expect(op.requestBody).toBeDefined();
  });

  it('extracts path and query parameters separately', () => {
    const spec = makeSpec({
      paths: {
        '/rest/api/3/issue/{issueIdOrKey}': {
          get: {
            operationId: 'getIssue',
            parameters: [
              { name: 'issueIdOrKey', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'fields', in: 'query', schema: { type: 'string' } },
              { name: 'expand', in: 'query', schema: { type: 'string' } },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    });

    const ir = specToIR(spec, 'Test');
    const op = ir.operations[0]!;
    expect(op.pathParams).toHaveLength(1);
    expect(op.pathParams[0]!.name).toBe('issueIdOrKey');
    expect(op.pathParams[0]!.required).toBe(true);
    expect(op.queryParams).toHaveLength(2);
    expect(op.queryParams.map(p => p.name)).toContain('fields');
    expect(op.queryParams.map(p => p.name)).toContain('expand');
  });

  it('extracts all HTTP methods from multi-path spec', () => {
    const spec = makeSpec({
      paths: {
        '/a': { get: { operationId: 'getA', responses: { '200': { description: 'OK' } } } },
        '/b': { post: { operationId: 'createB', responses: { '201': { description: 'Created' } } } },
        '/c/{id}': {
          get: { operationId: 'getC', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
          delete: { operationId: 'deleteC', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'No Content' } } },
        },
      },
    });

    const ir = specToIR(spec, 'Test');
    expect(ir.operations).toHaveLength(4);
    expect(ir.operations.map(o => o.operationId)).toContain('getA');
    expect(ir.operations.map(o => o.operationId)).toContain('createB');
    expect(ir.operations.map(o => o.operationId)).toContain('getC');
    expect(ir.operations.map(o => o.operationId)).toContain('deleteC');
  });

  it('skips operations without operationId', () => {
    const spec = makeSpec({
      paths: {
        '/a': {
          get: { operationId: 'getA', responses: { '200': { description: 'OK' } } },
          post: { responses: { '201': { description: 'Created' } } }, // no operationId
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.operations).toHaveLength(1);
  });

  it('marks deprecated operations', () => {
    const spec = makeSpec({
      paths: {
        '/legacy': {
          get: {
            operationId: 'legacyOp',
            deprecated: true,
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.operations[0]!.deprecated).toBe(true);
  });
});

describe('specToIR — type extraction', () => {
  it('extracts named schema types', () => {
    const spec = makeSpec({
      components: {
        schemas: {
          Issue: { type: 'object', properties: { id: { type: 'string' }, key: { type: 'string' } } },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.types.has('Issue')).toBe(true);
  });

  it('handles multiple named schemas', () => {
    const spec = makeSpec({
      components: {
        schemas: {
          Issue: { type: 'object', properties: { id: { type: 'string' } } },
          Project: { type: 'object', properties: { key: { type: 'string' } } },
          User: { type: 'object', properties: { accountId: { type: 'string' } } },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.types.has('Issue')).toBe(true);
    expect(ir.types.has('Project')).toBe(true);
    expect(ir.types.has('User')).toBe(true);
  });

  it('handles string enum types', () => {
    const spec = makeSpec({
      components: {
        schemas: {
          Status: { type: 'string', enum: ['open', 'closed', 'in-progress'] },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    const statusIR = ir.types.get('Status');
    expect(statusIR).toBeDefined();
    expect(statusIR?.type.kind).toBe('union');
  });

  it('resolves 2xx success response type as named ref', () => {
    const spec = makeSpec({
      paths: {
        '/rest/api/3/myself': {
          get: {
            operationId: 'getCurrentUser',
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
        },
      },
      components: {
        schemas: { User: { type: 'object', properties: { accountId: { type: 'string' } } } },
      },
    });
    const ir = specToIR(spec, 'Test');
    const op = ir.operations[0]!;
    expect(op.successType.kind).toBe('named');
    if (op.successType.kind === 'named') {
      expect(op.successType.name).toBe('User');
    }
  });

  it('uses void success type for operations with no response body', () => {
    const spec = makeSpec({
      paths: {
        '/rest/api/3/issue/{id}': {
          delete: {
            operationId: 'deleteIssue',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { '204': { description: 'No Content' } },
          },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    const op = ir.operations[0]!;
    expect(op.successType.kind).toBe('inline');
    if (op.successType.kind === 'inline') {
      expect(op.successType.type.kind).toBe('void');
    }
  });
});

describe('specToIR — operationId sanitization', () => {
  it('converts dot-notation operationIds to camelCase', () => {
    const spec = makeSpec({
      paths: {
        '/rest': {
          get: {
            operationId: 'PluginResource.getPlugin_get',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.operations[0]!.operationId).not.toContain('.');
    // Dot-notation: take segment after last dot = "getPlugin_get", camelCase → "getPluginGet"
    expect(ir.operations[0]!.operationId).toBe('getPluginGet');
  });

  it('lowercases the first character of the sanitized operationId', () => {
    const spec = makeSpec({
      paths: {
        '/rest': {
          get: {
            operationId: 'GetSomething',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    });
    const ir = specToIR(spec, 'Test');
    expect(ir.operations[0]!.operationId[0]).toBe(ir.operations[0]!.operationId[0]?.toLowerCase());
  });
});

describe('specToIR — IR metadata', () => {
  it('includes title and version from spec info', () => {
    const spec = makeSpec();
    spec.info.title = 'My API';
    spec.info.version = '3.0';
    const ir = specToIR(spec, 'My API');
    expect(ir.title).toBe('My API');
    expect(ir.version).toBe('3.0');
  });
});
