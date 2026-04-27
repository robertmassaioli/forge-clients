/**
 * Ensures all mutation endpoints have 400, 401, 403, 429 error response schemas.
 * Many Atlassian endpoints only document the success response.
 */

import type { OpenAPIV3 } from 'openapi-types';

const ERROR_RESPONSE_SCHEMA: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    errorMessages: { type: 'array', items: { type: 'string' } },
    errors: { type: 'object', additionalProperties: { type: 'string' } },
    status: { type: 'number' },
    message: { type: 'string' },
  },
};

const RATE_LIMIT_SCHEMA: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    retryAfter: { type: 'number' },
  },
};

export function fixErrorResponses(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  // Register canonical error schemas in components
  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};

  spec.components.schemas['ErrorResponse'] = ERROR_RESPONSE_SCHEMA;
  spec.components.schemas['RateLimitError'] = RATE_LIMIT_SCHEMA;

  const errorRef = (code: string): OpenAPIV3.ResponseObject => ({
    description: getErrorDescription(code),
    content: {
      'application/json': {
        schema: {
          $ref: code === '429'
            ? '#/components/schemas/RateLimitError'
            : '#/components/schemas/ErrorResponse',
        },
      },
    },
  });

  for (const pathItem of Object.values(spec.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!op) continue;

      op.responses = op.responses ?? {};

      // Always add 401 and 429
      if (!op.responses['401']) op.responses['401'] = errorRef('401');
      if (!op.responses['429']) op.responses['429'] = errorRef('429');

      // Add 400 and 403 to mutation endpoints
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        if (!op.responses['400']) op.responses['400'] = errorRef('400');
        if (!op.responses['403']) op.responses['403'] = errorRef('403');
      }

      // Add 404 to endpoints with path parameters
      const hasPathParams = (op.parameters ?? [])
        .some(p => (p as OpenAPIV3.ParameterObject).in === 'path');
      if (hasPathParams && !op.responses['404']) {
        op.responses['404'] = errorRef('404');
      }
    }
  }

  return spec;
}

function getErrorDescription(code: string): string {
  const descriptions: Record<string, string> = {
    '400': 'Bad request — the request was malformed or contains invalid parameters.',
    '401': 'Unauthorized — authentication credentials are missing or invalid.',
    '403': 'Forbidden — the authenticated user does not have permission to perform this action.',
    '404': 'Not found — the requested resource does not exist.',
    '429': 'Too many requests — rate limit exceeded. See Retry-After header.',
  };
  return descriptions[code] ?? `HTTP ${code} error`;
}
