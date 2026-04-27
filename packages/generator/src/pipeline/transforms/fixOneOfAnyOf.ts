/**
 * Fixes malformed oneOf/anyOf schemas where:
 * - Single-entry arrays are flattened to the direct type
 * - Overlapping primitive types are deduped
 */

import type { OpenAPIV3 } from 'openapi-types';

export function fixOneOfAnyOf(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  fixSchemasInComponents(spec);
  fixSchemasInPaths(spec);
  return spec;
}

function fixSchemasInComponents(spec: OpenAPIV3.Document): void {
  for (const schema of Object.values(spec.components?.schemas ?? {})) {
    if (schema) fixSchema(schema as OpenAPIV3.SchemaObject);
  }
}

function fixSchemasInPaths(spec: OpenAPIV3.Document): void {
  for (const pathItem of Object.values(spec.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!op) continue;
      // Fix request body schemas
      const rb = op.requestBody as OpenAPIV3.RequestBodyObject | undefined;
      for (const mediaType of Object.values(rb?.content ?? {})) {
        if (mediaType?.schema) fixSchema(mediaType.schema as OpenAPIV3.SchemaObject);
      }
      // Fix response schemas
      for (const response of Object.values(op.responses ?? {})) {
        const r = response as OpenAPIV3.ResponseObject;
        for (const mediaType of Object.values(r?.content ?? {})) {
          if (mediaType?.schema) fixSchema(mediaType.schema as OpenAPIV3.SchemaObject);
        }
      }
    }
  }
}

function fixSchema(schema: OpenAPIV3.SchemaObject): void {
  // Flatten single-entry oneOf/anyOf
  for (const key of ['oneOf', 'anyOf'] as const) {
    const variants = schema[key];
    if (variants?.length === 1 && variants[0]) {
      const single = variants[0] as OpenAPIV3.SchemaObject;
      Object.assign(schema, single);
      delete schema[key];
    }
  }

  // Deduplicate primitive types in anyOf/oneOf
  for (const key of ['oneOf', 'anyOf'] as const) {
    const variants = schema[key];
    if (variants && variants.length > 1) {
      const seen = new Set<string>();
      schema[key] = variants.filter(v => {
        const s = v as OpenAPIV3.SchemaObject;
        const sig = s.type ?? JSON.stringify(v);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }
  }

  // Recurse into object properties
  for (const propSchema of Object.values(schema.properties ?? {})) {
    fixSchema(propSchema as OpenAPIV3.SchemaObject);
  }
  if ('items' in schema && schema.items) fixSchema(schema.items as OpenAPIV3.SchemaObject);
}
