/**
 * Unit tests for SdkEmitter — generates sdk.gen.ts from the IR.
 * Uses specToIR on synthetic specs to build IR inputs for the emitter.
 */
import { describe, it, expect } from 'vitest';
import { specToIR } from '../src/ir/SpecToIR.js';
import { SdkEmitter } from '../src/emitters/SdkEmitter.js';
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

function emitSdk(spec: Partial<OpenAPIV3.Document>): string {
  const ir = specToIR(makeSpec(spec), 'Test');
  return new SdkEmitter().emit(ir, '// @generated\n');
}

describe('SdkEmitter', () => {
  describe('file structure', () => {
    it('starts with @ts-nocheck directive', () => {
      const output = emitSdk({});
      expect(output.startsWith('// @ts-nocheck')).toBe(true);
    });

    it('imports ForgeApiError from @forge-clients/core', () => {
      const output = emitSdk({});
      // ts-morph emits double-quoted imports
      expect(output).toContain('@forge-clients/core');
      expect(output).toContain('ForgeApiError');
    });

    it('imports BoundClient type from @forge-clients/core', () => {
      const output = emitSdk({});
      expect(output).toContain('BoundClient');
    });

    it('re-exports from types.gen.js', () => {
      const output = emitSdk({});
      expect(output).toContain("from './types.gen.js'");
    });
  });

  describe('GET operation — no params', () => {
    it('generates a named export async function', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: {
              operationId: 'getCurrentUser',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      expect(output).toContain('export async function getCurrentUser');
    });

    it('uses GET method in fetch call', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: { operationId: 'getCurrentUser', responses: { '200': { description: 'OK' } } },
          },
        },
      });
      expect(output).toContain("method: 'GET'");
    });

    it('hardcodes the path as a string literal', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: { operationId: 'getCurrentUser', responses: { '200': { description: 'OK' } } },
          },
        },
      });
      expect(output).toContain("'/rest/api/3/myself'");
    });

    it('does not generate a Params interface when no params', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: { operationId: 'getCurrentUser', responses: { '200': { description: 'OK' } } },
          },
        },
      });
      expect(output).not.toContain('GetCurrentUserParams');
    });

    it('function takes only client param when no params', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: { operationId: 'getCurrentUser', responses: { '200': { description: 'OK' } } },
          },
        },
      });
      expect(output).toContain('getCurrentUser(client: BoundClient)');
    });
  });

  describe('GET operation — with path params', () => {
    it('generates a Params interface with path property', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/issue/{issueIdOrKey}': {
            get: {
              operationId: 'getIssue',
              parameters: [{ name: 'issueIdOrKey', in: 'path', required: true, schema: { type: 'string' } }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      expect(output).toContain('GetIssueParams');
      expect(output).toContain('path:');
      expect(output).toContain('issueIdOrKey');
    });

    it('interpolates path param in template literal', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/issue/{issueIdOrKey}': {
            get: {
              operationId: 'getIssue',
              parameters: [{ name: 'issueIdOrKey', in: 'path', required: true, schema: { type: 'string' } }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      expect(output).toContain('params.path.issueIdOrKey');
    });
  });

  describe('POST operation — with request body', () => {
    it('generates Params interface with body property', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/issue': {
            post: {
              operationId: 'createIssue',
              requestBody: {
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/IssueInput' } },
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
      expect(output).toContain('CreateIssueParams');
      expect(output).toContain('body');
    });

    it('uses POST method', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/issue': {
            post: {
              operationId: 'createIssue',
              requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/IssueInput' } } },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
        components: {
          schemas: { IssueInput: { type: 'object', properties: { summary: { type: 'string' } } } },
        },
      });
      expect(output).toContain("method: 'POST'");
    });

    it('passes body in fetch call', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/issue': {
            post: {
              operationId: 'createIssue',
              requestBody: {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/IssueInput' } } },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
        components: {
          schemas: { IssueInput: { type: 'object', properties: { summary: { type: 'string' } } } },
        },
      });
      expect(output).toContain('body: params.body');
    });
  });

  describe('DELETE operation — 204 void', () => {
    it('generates async function that returns Promise<void>', () => {
      const output = emitSdk({
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
      expect(output).toContain('export async function deleteIssue');
      expect(output).toContain('Promise<void>');
    });

    it('does not generate a return statement for void operations', () => {
      const output = emitSdk({
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
      // void functions should not call response.json()
      expect(output).not.toMatch(/deleteIssue[\s\S]*?response\.json/);
    });
  });

  describe('error handling', () => {
    it('throws ForgeApiError on non-ok response', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/myself': {
            get: { operationId: 'getCurrentUser', responses: { '200': { description: 'OK' } } },
          },
        },
      });
      expect(output).toContain('ForgeApiError.fromResponse');
      expect(output).toContain('!response.ok');
    });
  });

  describe('query params', () => {
    it('generates queryParams object for functions with query params', () => {
      const output = emitSdk({
        paths: {
          '/rest/api/3/search': {
            get: {
              operationId: 'searchIssues',
              parameters: [
                { name: 'jql', in: 'query', schema: { type: 'string' } },
                { name: 'maxResults', in: 'query', schema: { type: 'integer' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      expect(output).toContain('queryParams');
      expect(output).toContain('jql: params.jql');
      expect(output).toContain('maxResults: params.maxResults');
    });
  });
});
