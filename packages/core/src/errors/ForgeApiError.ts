/**
 * Base error class for all `@forge-clients` API errors.
 * Subclasses are thrown for specific HTTP status codes.
 */

/**
 * Base class for all HTTP errors thrown by `@forge-clients` API calls.
 * Subclasses are thrown for specific HTTP status codes.
 *
 * @example
 * ```typescript
 * import { NotFoundError, ForbiddenError } from '@forge-clients/core';
 *
 * try {
 *   const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     console.log('Issue not found');
 *   } else if (err instanceof ForbiddenError) {
 *     console.log('No permission to view this issue');
 *   }
 * }
 * ```
 */
export class ForgeApiError extends Error {
  /**
   * @param status - The HTTP status code returned by the API
   * @param body   - The parsed JSON response body (or `{}` if parsing failed)
   * @param path   - The API path that was requested
   */
  constructor(
    /** The HTTP status code returned by the API */
    public readonly status: number,
    /** The parsed JSON response body */
    public readonly body: unknown,
    /** The API path that returned this error */
    public readonly path: string,
  ) {
    super(`Forge API error ${status} at ${path}`);
    this.name = 'ForgeApiError';
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Parse an error `Response` and return the appropriate typed subclass.
   * Used internally by generated client functions after receiving a non-2xx response.
   *
   * @param response - The non-2xx `Response` from the API
   * @param path     - The API path that was requested (for error messages)
   */
  static async fromResponse(response: Response, path: string): Promise<ForgeApiError> {
    const body = await response.json().catch(() => ({}));
    switch (response.status) {
      case 400: return new BadRequestError(body, path);
      case 401: return new UnauthorizedError(body, path);
      case 403: return new ForbiddenError(body, path);
      case 404: return new NotFoundError(body, path);
      case 409: return new ConflictError(body, path);
      case 429: return new RateLimitError(
        body,
        path,
        response.headers.get('Retry-After'),
      );
      default:  return new ForgeApiError(response.status, body, path);
    }
  }
}

/**
 * Thrown when the API returns HTTP 400 Bad Request.
 * Typically indicates malformed request parameters or invalid field values.
 * Inspect `errorMessages` and `fieldErrors` for details from the Atlassian API.
 */
export class BadRequestError extends ForgeApiError {
  constructor(
    body: { errorMessages?: string[]; errors?: Record<string, string> },
    path: string,
  ) {
    super(400, body, path);
    this.name = 'BadRequestError';
  }
  /** Top-level error messages from the API response body */
  get errorMessages(): string[] {
    return (this.body as { errorMessages?: string[] }).errorMessages ?? [];
  }
  /** Per-field validation errors from the API response body */
  get fieldErrors(): Record<string, string> {
    return (this.body as { errors?: Record<string, string> }).errors ?? {};
  }
}

/**
 * Thrown when the API returns HTTP 401 Unauthorized.
 * Typically indicates that the request was not authenticated, or the token has expired.
 */
export class UnauthorizedError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(401, body, path);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Thrown when the API returns HTTP 403 Forbidden.
 * The app or user does not have the required permissions for this operation.
 * Check the app's OAuth scopes and the user's product permissions.
 */
export class ForbiddenError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(403, body, path);
    this.name = 'ForbiddenError';
  }
}

/**
 * Thrown when the API returns HTTP 404 Not Found.
 * The requested resource (issue, page, project, etc.) does not exist,
 * or the app/user does not have permission to see it.
 */
export class NotFoundError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(404, body, path);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when the API returns HTTP 409 Conflict.
 * Typically indicates a concurrent modification conflict or a duplicate resource.
 */
export class ConflictError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(409, body, path);
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when the API returns HTTP 429 Too Many Requests.
 * Use {@link withRetry} to automatically handle rate limit errors with exponential backoff.
 */
export class RateLimitError extends ForgeApiError {
  /** Seconds to wait before retrying, parsed from the `Retry-After` response header. `null` if the header was absent. */
  public readonly retryAfterSeconds: number | null;

  constructor(body: unknown, path: string, retryAfter: string | null) {
    super(429, body, path);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
  }
}
