/**
 * Ensures all mutation endpoints (POST/PUT/PATCH) that have a request body
 * declare application/json as the content type. Some Atlassian endpoints
 * omit the content type declaration, causing generators to skip the body.
 */

import type { OpenAPIV3 } from 'openapi-types';

export function fixContentTypes(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  for (const pathItem of Object.values(spec.paths ?? {})) {
    if (!pathItem) continue;
    for (const method of ['post', 'put', 'patch'] as const) {
      const op = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!op?.requestBody) continue;

      const rb = op.requestBody as OpenAPIV3.RequestBodyObject;
      if (!rb.content) {
        rb.content = {
          'application/json': { schema: { type: 'object' } },
        };
      } else if (!rb.content['application/json']) {
        // Has content but not application/json — add it alongside existing types
        rb.content['application/json'] = { schema: { type: 'object' } };
      }
    }
  }
  return spec;
}
