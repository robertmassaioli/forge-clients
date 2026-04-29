# Testing the Generator

Tests for `@forge-clients/generator` — `SpecToIR`, `TypeEmitter`, `SdkEmitter`,
spec transforms, and patch application. These tests use real spec files from
`packages/specs/src/cleaned/` and synthetic mini-specs for targeted unit tests.

**Key advantage:** The generator is pure TypeScript with no Forge runtime dependencies.
It reads JSON specs from disk and writes TypeScript files. Both inputs and outputs are
testable without any mocking.

---

## 5.1 SpecToIR

`SpecToIR` converts an OpenAPI spec into the Intermediate Representation. Tests use
small synthetic OpenAPI specs — not the full Jira spec — to keep tests fast and focused.

```typescript
// packages/generator/src/ir/SpecToIR.test.ts
import { describe, it, expect } from 'vitest';
import { SpecToIR } from './SpecToIR.js';
import type { OpenAPIV3 } from 'openapi-types';

/** Minimal valid OpenAPI v3 spec for testing */
function makeSpec(overrides: Partial<OpenAPIV3.Document> = {}): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    components: { schemas: {} },
    ...overrides,
  };
}

describe('SpecToIR', () => {
  describe('basic operation extraction', () => {
    it('extracts a simple GET operation', () => {
      const spec = makeSpec({
        paths: {
          '/rest/api/3/myself': {
            get: {
              operationId: 'getCurrentUser',
              summary: 'Get current user',
              responses: {
                '200': {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
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
          },
        },
      });

      const ir = new SpecToIR(spec).convert();

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
              responses: {
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/CreatedIssue' },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            IssueInput: { type: 'object', properties: { summary: { type: 'string' } } },
            CreatedIssue: { type: 'object', properties: { id: { type: 'string' }, key: { type: 'string' } } },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      const op = ir.operations[0]!;

      expect(op.operationId).toBe('createIssue');
      expect(op.method).toBe('POST');
      expect(op.requestBody).toBeDefined();
    });

    it('extracts path parameters', () => {
      const spec = makeSpec({
        paths: {
          '/rest/api/3/issue/{issueIdOrKey}': {
            get: {
              operationId: 'getIssue',
              parameters: [
                { name: 'issueIdOrKey', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'fields', in: 'query', schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      const op = ir.operations[0]!;

      const pathParams = op.parameters.filter((p) => p.in === 'path');
      const queryParams = op.parameters.filter((p) => p.in === 'query');
      expect(pathParams).toHaveLength(1);
      expect(pathParams[0]!.name).toBe('issueIdOrKey');
      expect(pathParams[0]!.required).toBe(true);
      expect(queryParams).toHaveLength(1);
      expect(queryParams[0]!.name).toBe('fields');
    });

    it('extracts all operations from a multi-path spec', () => {
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

      const ir = new SpecToIR(spec).convert();
      expect(ir.operations).toHaveLength(4);
    });
  });

  describe('type extraction', () => {
    it('extracts named schema types', () => {
      const spec = makeSpec({
        components: {
          schemas: {
            Issue: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                key: { type: 'string' },
              },
            },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      expect(ir.types.has('Issue')).toBe(true);
    });

    it('handles nested object schemas', () => {
      const spec = makeSpec({
        components: {
          schemas: {
            Project: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                lead: {
                  type: 'object',
                  properties: { accountId: { type: 'string' } },
                },
              },
            },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      expect(ir.types.has('Project')).toBe(true);
    });

    it('handles $ref schema references', () => {
      const spec = makeSpec({
        components: {
          schemas: {
            Issue: {
              type: 'object',
              properties: {
                project: { $ref: '#/components/schemas/Project' },
              },
            },
            Project: {
              type: 'object',
              properties: { key: { type: 'string' } },
            },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      expect(ir.types.has('Issue')).toBe(true);
      expect(ir.types.has('Project')).toBe(true);
    });

    it('handles enum types', () => {
      const spec = makeSpec({
        components: {
          schemas: {
            IssueType: {
              type: 'string',
              enum: ['Bug', 'Task', 'Story'],
            },
          },
        },
      });

      const ir = new SpecToIR(spec).convert();
      const issueTypeIR = ir.types.get('IssueType');
      expect(issueTypeIR).toBeDefined();
      expect(issueTypeIR?.kind).toBe('enum');
    });
  });

  describe('operationId sanitization', () => {
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

      const ir = new SpecToIR(spec).convert();
      expect(ir.operations[0]!.operationId).not.toContain('.');
    });
  });
});
```

---

## 5.2 Spec Transforms

Each transform in `packages/specs/src/transforms/` is a pure function `(spec) => spec`.
Unit test each transform with a minimal spec that exercises the transform's target pattern.

```typescript
// packages/specs/src/transforms/fixNullableFields.test.ts
import { describe, it, expect } from 'vitest';
import { fixNullableFields } from './fixNullableFields.js';
import type { OpenAPIV3 } from 'openapi-types';

describe('fixNullableFields', () => {
  it('converts x-nullable: true to nullable: true', () => {
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1' },
      paths: {},
      components: {
        schemas: {
          MyType: {
            type: 'object',
            properties: {
              optionalField: {
                type: 'string',
                'x-nullable': true,
              } as OpenAPIV3.SchemaObject,
            },
          },
        },
      },
    };

    const result = fixNullableFields(spec);
    const field = result.components!.schemas!['MyType'] as OpenAPIV3.SchemaObject;
    const prop = field.properties!['optionalField'] as OpenAPIV3.SchemaObject;
    expect(prop.nullable).toBe(true);
  });

  it('does not modify fields without x-nullable', () => {
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1' },
      paths: {},
      components: {
        schemas: {
          MyType: {
            type: 'object',
            properties: {
              requiredField: { type: 'string' },
            },
          },
        },
      },
    };

    const result = fixNullableFields(spec);
    const field = result.components!.schemas!['MyType'] as OpenAPIV3.SchemaObject;
    const prop = field.properties!['requiredField'] as OpenAPIV3.SchemaObject;
    expect(prop.nullable).toBeUndefined();
  });
});
```

```typescript
// packages/specs/src/transforms/fixDeprecations.test.ts
import { describe, it, expect } from 'vitest';
import { fixDeprecations } from './fixDeprecations.js';

describe('fixDeprecations', () => {
  it('marks deprecated operations', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1' },
      paths: {
        '/legacy': {
          get: {
            operationId: 'legacyOp',
            'x-deprecated': true,
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as any;

    const result = fixDeprecations(spec);
    expect(result.paths['/legacy'].get.deprecated).toBe(true);
  });
});
```

---

## 5.3 Patch Application

```typescript
// packages/specs/src/patches/patchEngine.test.ts
import { describe, it, expect } from 'vitest';
import { applyPatches } from './patchEngine.js';
import type { OpenAPIV3 } from 'openapi-types';

describe('applyPatches', () => {
  it('renames an operationId', () => {
    const spec = {
      openapi: '3.0.0', info: { title: 'Test', version: '1' },
      paths: {
        '/test': {
          get: { operationId: 'old_name_get', responses: { '200': { description: 'OK' } } },
        },
      },
    } as OpenAPIV3.Document;

    const result = applyPatches(spec, [
      { op: 'replace', path: '/paths/~1test/get/operationId', value: 'newName' },
    ]);

    expect((result.paths['/test']?.get as any).operationId).toBe('newName');
  });

  it('adds a missing required property', () => {
    const spec = {
      openapi: '3.0.0', info: { title: 'Test', version: '1' },
      paths: {},
      components: {
        schemas: {
          MySchema: { type: 'object', properties: { id: { type: 'string' } } },
        },
      },
    } as OpenAPIV3.Document;

    const result = applyPatches(spec, [
      { op: 'add', path: '/components/schemas/MySchema/required', value: ['id'] },
    ]);

    const schema = result.components!.schemas!['MySchema'] as OpenAPIV3.SchemaObject;
    expect(schema.required).toContain('id');
  });
});
```

---

## 5.4 SdkEmitter Output Snapshot Tests

For the emitters, use snapshot tests — verify the generated TypeScript output matches
expected strings. Snapshots are committed to git and reviewed on change.

```typescript
// packages/generator/src/emitters/SdkEmitter.test.ts
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { SdkEmitter } from './SdkEmitter.js';
import { SpecToIR } from '../ir/SpecToIR.js';
import type { OpenAPIV3 } from 'openapi-types';

function makeIR(spec: Partial<OpenAPIV3.Document>) {
  const fullSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1' },
    paths: {},
    components: { schemas: {} },
    ...spec,
  };
  return new SpecToIR(fullSpec).convert();
}

describe('SdkEmitter', () => {
  it('generates a named async function for a GET operation', () => {
    const ir = makeIR({
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
        schemas: {
          User: { type: 'object', properties: { accountId: { type: 'string' } } },
        },
      },
    });

    const project = new Project({ useInMemoryFileSystem: true });
    const emitter = new SdkEmitter(project);
    const file = emitter.emit(ir, 'test.ts');
    const text = file.getFullText();

    expect(text).toContain('export async function getCurrentUser');
    expect(text).toContain('adapter: ForgeAdapter');
    expect(text).toContain("path: '/rest/api/3/myself'");
    expect(text).toContain("method: 'GET'");
  });

  it('generates a Params interface for path parameters', () => {
    const ir = makeIR({
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

    const project = new Project({ useInMemoryFileSystem: true });
    const emitter = new SdkEmitter(project);
    const file = emitter.emit(ir, 'test.ts');
    const text = file.getFullText();

    expect(text).toContain('export interface GetIssueParams');
    expect(text).toContain('path: {');
    expect(text).toContain('issueIdOrKey: string');
  });

  it('generates body parameter in Params interface for POST', () => {
    const ir = makeIR({
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

    const project = new Project({ useInMemoryFileSystem: true });
    const emitter = new SdkEmitter(project);
    const file = emitter.emit(ir, 'test.ts');
    const text = file.getFullText();

    expect(text).toContain('export interface CreateIssueParams');
    expect(text).toContain('body?:');
    expect(text).toContain('Types.IssueInput');
  });

  it('emits @ts-nocheck at top of file', () => {
    const ir = makeIR({ paths: {} });
    const project = new Project({ useInMemoryFileSystem: true });
    const file = new SdkEmitter(project).emit(ir, 'test.ts');
    expect(file.getFullText()).toMatch(/^\/\/ @ts-nocheck/);
  });
});
```

---

## 5.5 Integration: Generator Produces Parseable TypeScript

A higher-level test: run the full generator pipeline against a small synthetic spec and
verify the output is valid TypeScript (no parse errors).

```typescript
// packages/generator/src/__tests__/generator-integration.test.ts
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { SpecToIR } from '../ir/SpecToIR.js';
import { TypeEmitter } from '../emitters/TypeEmitter.js';
import { SdkEmitter } from '../emitters/SdkEmitter.js';

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
      User: { type: 'object', properties: { accountId: { type: 'string' }, displayName: { type: 'string' } } },
      Issue: { type: 'object', properties: { id: { type: 'string' }, key: { type: 'string' } } },
      IssueInput: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          project: { $ref: '#/components/schemas/Project' },
        },
      },
      Project: { type: 'object', properties: { key: { type: 'string' } } },
    },
  },
} as any;

describe('Generator integration', () => {
  it('produces valid TypeScript from a synthetic spec', () => {
    const ir = new SpecToIR(MINI_SPEC).convert();
    const project = new Project({ useInMemoryFileSystem: true });

    const typeFile = new TypeEmitter(project).emit(ir, 'types.gen.ts');
    const sdkFile = new SdkEmitter(project).emit(ir, 'sdk.gen.ts');

    // Neither file should have parse diagnostics
    const typeDiags = typeFile.getPreEmitDiagnostics();
    const sdkDiags = sdkFile.getPreEmitDiagnostics();

    expect(typeDiags).toHaveLength(0);
    expect(sdkDiags).toHaveLength(0);
  });

  it('generates expected number of operations', () => {
    const ir = new SpecToIR(MINI_SPEC).convert();
    expect(ir.operations).toHaveLength(4); // getMe, createIssue, getIssue, deleteIssue
  });

  it('sdk.gen.ts exports all operations as named functions', () => {
    const ir = new SpecToIR(MINI_SPEC).convert();
    const project = new Project({ useInMemoryFileSystem: true });
    const sdkFile = new SdkEmitter(project).emit(ir, 'sdk.gen.ts');
    const text = sdkFile.getFullText();

    expect(text).toContain('export async function getMe');
    expect(text).toContain('export async function createIssue');
    expect(text).toContain('export async function getIssue');
    expect(text).toContain('export async function deleteIssue');
  });

  it('types.gen.ts exports all schema types as interfaces', () => {
    const ir = new SpecToIR(MINI_SPEC).convert();
    const project = new Project({ useInMemoryFileSystem: true });
    const typeFile = new TypeEmitter(project).emit(ir, 'types.gen.ts');
    const text = typeFile.getFullText();

    expect(text).toContain('export interface User');
    expect(text).toContain('export interface Issue');
    expect(text).toContain('export interface IssueInput');
    expect(text).toContain('export interface Project');
  });
});
```
