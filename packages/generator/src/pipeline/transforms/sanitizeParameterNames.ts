import type { OpenAPIV3 } from 'openapi-types';

/**
 * Sanitize parameter names that contain hyphens or other characters that are
 * not valid TypeScript identifiers. These must be renamed to camelCase so the
 * generated interfaces and function parameter objects are valid TypeScript.
 *
 * Known cases:
 *   - Confluence v1: "state-id" query param -> "stateId"
 *   - Any spec could theoretically have hyphenated param names
 *
 * The renamed parameter is documented in the JSDoc as "was: original-name"
 * so the original name is not lost.
 */
function hyphenToCamel(name: string): string {
  return name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function isInvalidIdentifier(name: string): boolean {
  return /[^a-zA-Z0-9_$]/.test(name);
}

function sanitizeSchema(schema: OpenAPIV3.SchemaObject): void {
  if (schema.properties) {
    const newProps: typeof schema.properties = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      const newKey = isInvalidIdentifier(key) ? hyphenToCamel(key) : key;
      newProps[newKey] = val;
    }
    schema.properties = newProps;
  }
  if ('items' in schema && schema.items) {
    sanitizeSchema(schema.items as OpenAPIV3.SchemaObject);
  }
  if (schema.allOf) schema.allOf.forEach(s => sanitizeSchema(s as OpenAPIV3.SchemaObject));
  if (schema.oneOf) schema.oneOf.forEach(s => sanitizeSchema(s as OpenAPIV3.SchemaObject));
  if (schema.anyOf) schema.anyOf.forEach(s => sanitizeSchema(s as OpenAPIV3.SchemaObject));
}

/**
 * Convert an arbitrary string to a valid camelCase TypeScript identifier.
 */
function toValidIdentifier(str: string): string {
  const words = str.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return 'unknown';
  return words[0]!.charAt(0).toLowerCase() + words[0]!.slice(1) +
    words.slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function sanitizeSchemaProperties(spec: OpenAPIV3.Document): void {
  const schemas = (spec.components as Record<string, unknown> | undefined)
    ?.schemas as Record<string, OpenAPIV3.SchemaObject> | undefined;
  if (!schemas) return;
  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!schema.properties) continue;
    const badProps = Object.keys(schema.properties).filter(k => isInvalidIdentifier(k));
    if (badProps.length === 0) continue;
    const newProps: typeof schema.properties = {};
    const oldRequired = schema.required ?? [];
    const newRequired: string[] = [];
    for (const [key, val] of Object.entries(schema.properties)) {
      const newKey = isInvalidIdentifier(key) ? toValidIdentifier(key) : key;
      newProps[newKey] = val;
      if (oldRequired.includes(key)) newRequired.push(newKey);
      if (isInvalidIdentifier(key)) {
        console.log(`  [sanitize-schema] "${schemaName}.${key}" -> "${newKey}"`);
      }
    }
    schema.properties = newProps;
    if (schema.required !== undefined) schema.required = newRequired;
  }
}

export function sanitizeParameterNames(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  sanitizeSchemaProperties(spec);
  let renamedCount = 0;

  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const) {
      const op = (pathItem as Record<string, OpenAPIV3.OperationObject>)[method];
      if (!op?.parameters) continue;

      op.parameters = op.parameters.map(param => {
        if ('$ref' in param) return param;
        if (!isInvalidIdentifier(param.name)) return param;
        const newName = hyphenToCamel(param.name);
        console.log(`  [sanitize] renamed param: "${param.name}" -> "${newName}" on ${method.toUpperCase()} ${JSON.stringify(param.in)}`);
        renamedCount++;
        return {
          ...param,
          name: newName,
          description: `${param.description ? param.description + '\n' : ''}(parameter was originally named \`${param.name}\` in the spec)`,
        };
      });
    }
  }

  if (renamedCount > 0) {
    console.log(`  [sanitize] Total renamed parameters: ${renamedCount}`);
  }

  return spec;
}
