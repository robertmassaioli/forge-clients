/**
 * Adds nullable: true to fields that can be null based on naming conventions
 * and known patterns in Atlassian APIs (e.g. fields ending in 'OrNull').
 * Also ensures optional fields with no default are marked nullable where appropriate.
 */

import type { OpenAPIV3 } from 'openapi-types';

/** Known field names that can be null in Atlassian APIs */
const KNOWN_NULLABLE_FIELDS = new Set([
  'description', 'avatarId', 'assignee', 'reporter', 'priority',
  'resolution', 'resolutiondate', 'duedate', 'parent', 'subtasks',
  'comment', 'attachment', 'created', 'updated', 'customfield',
]);

export function fixNullableFields(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  for (const schema of Object.values(spec.components?.schemas ?? {})) {
    if (schema) applyNullable(schema as OpenAPIV3.SchemaObject);
  }
  return spec;
}

function applyNullable(schema: OpenAPIV3.SchemaObject): void {
  for (const [name, propSchema] of Object.entries(schema.properties ?? {})) {
    const ps = propSchema as OpenAPIV3.SchemaObject;
    const isKnownNullable = KNOWN_NULLABLE_FIELDS.has(name) ||
      name.toLowerCase().includes('null') ||
      name.toLowerCase().includes('optional');
    if (isKnownNullable && !ps.nullable) {
      ps.nullable = true;
    }
    applyNullable(ps);
  }
  if ('items' in schema && schema.items) applyNullable(schema.items as OpenAPIV3.SchemaObject);
}
