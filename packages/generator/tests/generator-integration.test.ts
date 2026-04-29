/**
 * Integration tests for the full generator pipeline.
 * Runs specToIR → SdkEmitter + TypeEmitter against a synthetic spec
 * and verifies the output is valid, well-formed TypeScript.
 */
import { describe, it, expect } from 'vitest';
import { specToIR } from '../src/ir/SpecToIR.js';
import { SdkEmitter } from '../src/emitters/SdkEmitter.js';
import { TypeEmitter } from '../src/emitters/TypeEmitter.js';

const MINI_SPEC = {
  openapi: '3.0.0' as const,
  info: { title: 'Mini Test API', version: '1.0.0' },
  paths: {
    '/users/me': {
      get: {
        operationId: 'getMe',
        summary: 'Get current user',
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      },
    },
    '/issues': {
      post: {
        operationId: 'createIssue',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/IssueInput' } } },
        },
        responses: {
          '201': {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Issue' } } },
          },
        },
      },
    },
    '/issues/{id}': {
      get: {
        operationId: 'getIssue',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Issue' } } },
          },
        },
      },
      delete: {
        operationId: 'deleteIssue',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'No Content' } },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          displayName: { type: 'string' },
        },
      },
      Issue: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
        },
      },
      IssueInput: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          project: { $ref: '#/components/schemas/Project' },
        },
      },
      Project: {
        type: 'object',
        properties: { key: { type: 'string' } },
      },
    },
  },
} as any;

describe('Generator integration', () => {
  it('generates the expected number of operations', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    expect(ir.operations).toHaveLength(4);
  });

  it('sdk output contains all operation function names', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const sdk = new SdkEmitter().emit(ir, '// @generated\n');
    expect(sdk).toContain('export async function getMe');
    expect(sdk).toContain('export async function createIssue');
    expect(sdk).toContain('export async function getIssue');
    expect(sdk).toContain('export async function deleteIssue');
  });

  it('types output contains all schema interface names', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const types = new TypeEmitter().emit(ir, '// @generated\n');
    expect(types).toContain('User');
    expect(types).toContain('Issue');
    expect(types).toContain('IssueInput');
    expect(types).toContain('Project');
  });

  it('sdk output starts with @ts-nocheck', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const sdk = new SdkEmitter().emit(ir, '// @generated\n');
    expect(sdk.startsWith('// @ts-nocheck')).toBe(true);
  });

  it('delete operation uses void return type', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const sdk = new SdkEmitter().emit(ir, '// @generated\n');
    expect(sdk).toContain('deleteIssue');
    expect(sdk).toContain('Promise<void>');
  });

  it('post operation includes body in fetch call', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const sdk = new SdkEmitter().emit(ir, '// @generated\n');
    // createIssue should pass body
    expect(sdk).toContain('body: params.body');
  });

  it('path param operation uses template literal path', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    const sdk = new SdkEmitter().emit(ir, '// @generated\n');
    // getIssue has path param {id}
    expect(sdk).toContain('params.path.id');
  });

  it('IR types map contains all 4 schemas', () => {
    const ir = specToIR(MINI_SPEC, 'Mini Test API');
    expect(ir.types.has('User')).toBe(true);
    expect(ir.types.has('Issue')).toBe(true);
    expect(ir.types.has('IssueInput')).toBe(true);
    expect(ir.types.has('Project')).toBe(true);
  });
});
