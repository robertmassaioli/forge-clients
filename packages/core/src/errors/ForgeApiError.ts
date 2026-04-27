/**
 * Base error class for all @forge-clients API errors.
 * Subclasses are thrown for specific HTTP status codes.
 */

export class ForgeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly path: string,
  ) {
    super(`Forge API error ${status} at ${path}`);
    this.name = 'ForgeApiError';
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }

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

export class BadRequestError extends ForgeApiError {
  constructor(
    body: { errorMessages?: string[]; errors?: Record<string, string> },
    path: string,
  ) {
    super(400, body, path);
    this.name = 'BadRequestError';
  }
  get errorMessages(): string[] {
    return (this.body as { errorMessages?: string[] }).errorMessages ?? [];
  }
  get fieldErrors(): Record<string, string> {
    return (this.body as { errors?: Record<string, string> }).errors ?? {};
  }
}

export class UnauthorizedError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(401, body, path);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(403, body, path);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(404, body, path);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ForgeApiError {
  constructor(body: unknown, path: string) {
    super(409, body, path);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ForgeApiError {
  /** Seconds to wait before retrying, if the Retry-After header was present */
  public readonly retryAfterSeconds: number | null;

  constructor(body: unknown, path: string, retryAfter: string | null) {
    super(429, body, path);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
  }
}
