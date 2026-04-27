/**
 * Converts a dereferenced OpenAPI v3 Document into the @forge-clients IR.
 *
 * This is the parsing layer — it handles all the OpenAPI complexity
 * (allOf, anyOf, oneOf, $ref resolution, parameter extraction) and
 * produces a clean, normalised IRSpec for the emitters to consume.
 */

import type { OpenAPIV3 } from 'openapi-types';
import type {
  IRSpec, IROperation, IRParameter, IRTypeRef, IRType, IRProperty, IRNamedType,
} from './IRTypes.js';

export function specToIR(spec: OpenAPIV3.Document, title: string): IRSpec {
  const types = new Map<string, IRNamedType>();

  // Register all component schemas as named types
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    const irType = schemaToIRType(schema as OpenAPIV3.SchemaObject, types);
    const desc = (schema as OpenAPIV3.SchemaObject).description;
    types.set(name, { name, type: irType, ...(desc !== undefined ? { description: desc } : {}) });
  }

  const operations: IROperation[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;

    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!op?.operationId) continue;

      operations.push(operationToIR(op, path, method, types));
    }
  }

  return { title, version: spec.info.version, operations, types };
}

function operationToIR(
  op: OpenAPIV3.OperationObject,
  path: string,
  method: string,
  types: Map<string, IRNamedType>,
): IROperation {
  const parameters = (op.parameters ?? []) as OpenAPIV3.ParameterObject[];

  const pathParams: IRParameter[] = parameters
    .filter(p => p.in === 'path')
    .map(p => paramToIR(p, types));

  const queryParams: IRParameter[] = parameters
    .filter(p => p.in === 'query')
    .map(p => paramToIR(p, types));

  // Resolve success type
  const successEntry = Object.entries(op.responses ?? {})
    .find(([code]) => code.startsWith('2'));
  const successType: IRTypeRef = successEntry
    ? responseToIRTypeRef(successEntry[1] as OpenAPIV3.ResponseObject, types)
    : { kind: 'inline', type: { kind: 'void' } };

  // Resolve error types
  const errorTypes: Record<string, IRTypeRef> = {};
  for (const [code, response] of Object.entries(op.responses ?? {})) {
    if (!code.startsWith('2')) {
      errorTypes[code] = responseToIRTypeRef(response as OpenAPIV3.ResponseObject, types);
    }
  }

  // Resolve request body
  let requestBody: IRTypeRef | undefined;
  if (op.requestBody) {
    const rb = op.requestBody as OpenAPIV3.RequestBodyObject;
    const schema = rb.content?.['application/json']?.schema;
    if (schema) {
      requestBody = { kind: 'inline', type: schemaToIRType(schema as OpenAPIV3.SchemaObject, types) };
    }
  }

  // Extract Forge extensions
  const ext = op as Record<string, unknown>;
  const rawScopes = ext['x-forge-scopes'] as { asApp?: string[]; asUser?: string[] } | undefined;
  const forgeScopes = {
    asApp: rawScopes?.asApp ?? [],
    asUser: rawScopes?.asUser ?? [],
  };

  const rawPagination = ext['x-forge-pagination'] as string | undefined;
  const pagination: IROperation['pagination'] =
    rawPagination === 'offset' ? 'offset'
    : rawPagination === 'cursor' ? 'cursor'
    : 'none';

  const rawContexts = ext['x-forge-contexts'] as string[] | undefined;
  const contexts: IROperation['contexts'] = (rawContexts as IROperation['contexts']) ?? [
    'forge-function', 'forge-container', 'forge-bridge',
  ];

  return {
    operationId: op.operationId!,
    method: method.toUpperCase() as IROperation['method'],
    path,
    ...(op.summary !== undefined ? { summary: op.summary } : {}),
    ...(op.description !== undefined ? { description: op.description } : {}),
    deprecated: op.deprecated ?? false,
    pathParams,
    queryParams,
    requestBody,
    successType,
    errorTypes,
    forgeScopes,
    pagination,
    contexts,
  };
}

function paramToIR(p: OpenAPIV3.ParameterObject, types: Map<string, IRNamedType>): IRParameter {
  return {
    name: p.name,
    required: p.required ?? false,
    type: { kind: 'inline', type: schemaToIRType((p.schema ?? {}) as OpenAPIV3.SchemaObject, types) },
    ...(p.description !== undefined ? { description: p.description } : {}),
    deprecated: p.deprecated ?? false,
  };
}

function responseToIRTypeRef(
  response: OpenAPIV3.ResponseObject,
  types: Map<string, IRNamedType>,
): IRTypeRef {
  const schema = response.content?.['application/json']?.schema;
  if (!schema) return { kind: 'inline', type: { kind: 'void' } };

  if ('$ref' in schema) {
    const name = (schema as OpenAPIV3.ReferenceObject).$ref.split('/').pop() ?? 'unknown';
    return { kind: 'named', name };
  }

  return { kind: 'inline', type: schemaToIRType(schema as OpenAPIV3.SchemaObject, types) };
}

export function schemaToIRType(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  types: Map<string, IRNamedType>,
): IRType {
  if ('$ref' in schema) {
    const name = schema.$ref.split('/').pop() ?? 'unknown';
    return { kind: 'ref', name };
  }

  const s = schema as OpenAPIV3.SchemaObject;

  // Handle composition keywords
  if (s.allOf) {
    const composed = s.allOf.map(sub => schemaToIRType(sub as OpenAPIV3.SchemaObject, types));
    return composed.length === 1 ? composed[0]! : { kind: 'intersection', types: composed };
  }
  if (s.oneOf ?? s.anyOf) {
    const variants = (s.oneOf ?? s.anyOf)!.map(sub => schemaToIRType(sub as OpenAPIV3.SchemaObject, types));
    return variants.length === 1 ? variants[0]! : { kind: 'union', types: variants };
  }

  switch (s.type) {
    case 'string':
      if (s.enum) return { kind: 'union', types: s.enum.map((v: unknown) => ({ kind: 'literal', value: v as string })) };
      return { kind: 'string' };
    case 'integer':
    case 'number':
      return { kind: 'number' };
    case 'boolean':
      return { kind: 'boolean' };
    case 'array':
      return { kind: 'array', items: schemaToIRType((s.items ?? {}) as OpenAPIV3.SchemaObject, types) };
    case 'object':
    default: {
      if (s.additionalProperties === true || (s.additionalProperties && typeof s.additionalProperties === 'object')) {
        const valueType = typeof s.additionalProperties === 'object'
          ? schemaToIRType(s.additionalProperties as OpenAPIV3.SchemaObject, types)
          : { kind: 'unknown' as const };
        return { kind: 'record', values: valueType };
      }

      const required = new Set(s.required ?? []);
      const properties: IRProperty[] = Object.entries(s.properties ?? {}).map(([name, propSchema]) => {
        const ps = propSchema as OpenAPIV3.SchemaObject;
        return {
          name,
          required: required.has(name),
          readonly: ps.readOnly ?? false,
          type: schemaToIRType(ps, types),
          ...(ps.description !== undefined ? { description: ps.description } : {}),
          deprecated: ps.deprecated ?? false,
        };
      });

      const hasAdditional = Boolean(s.additionalProperties);
      return { kind: 'object', properties, additionalProperties: hasAdditional };
    }
  }
}
