import { describe, it, expect } from 'vitest';
import {
  ForgeApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../../src/errors/ForgeApiError.js';

describe('ForgeApiError', () => {
  it('is an instance of Error and ForgeApiError', () => {
    const err = new ForgeApiError(500, { message: 'fail' }, '/test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ForgeApiError);
  });

  it('has correct status, body and path', () => {
    const body = { errorMessages: ['Issue not found'] };
    const err = new ForgeApiError(404, body, '/rest/api/3/issue/BAD-1');
    expect(err.status).toBe(404);
    expect(err.body).toEqual(body);
    expect(err.path).toBe('/rest/api/3/issue/BAD-1');
  });

  it('message includes status and path', () => {
    const err = new ForgeApiError(500, {}, '/test');
    expect(err.message).toContain('500');
    expect(err.message).toContain('/test');
  });
});

describe('Specific error subclasses', () => {
  it('BadRequestError has status 400', () => {
    const err = new BadRequestError({ errorMessages: ['bad input'] }, '/test');
    expect(err).toBeInstanceOf(ForgeApiError);
    expect(err.status).toBe(400);
  });

  it('UnauthorizedError has status 401', () => {
    expect(new UnauthorizedError({}, '/test').status).toBe(401);
  });

  it('ForbiddenError has status 403', () => {
    expect(new ForbiddenError({}, '/test').status).toBe(403);
  });

  it('NotFoundError has status 404', () => {
    expect(new NotFoundError({}, '/test').status).toBe(404);
  });

  it('ConflictError has status 409', () => {
    expect(new ConflictError({}, '/test').status).toBe(409);
  });
});

describe('RateLimitError', () => {
  it('has status 429', () => {
    const err = new RateLimitError({}, '/test', '30');
    expect(err.status).toBe(429);
    expect(err).toBeInstanceOf(ForgeApiError);
  });

  it('parses retryAfterSeconds from Retry-After header string', () => {
    expect(new RateLimitError({}, '/test', '30').retryAfterSeconds).toBe(30);
  });

  it('sets retryAfterSeconds to null when header is null', () => {
    expect(new RateLimitError({}, '/test', null).retryAfterSeconds).toBeNull();
  });
});

describe('ForgeApiError.fromResponse', () => {
  function makeResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });
  }

  it('creates BadRequestError for 400', async () => {
    const err = await ForgeApiError.fromResponse(
      makeResponse(400, { errorMessages: ['Field required: summary'] }),
      '/rest/api/3/issue',
    );
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.status).toBe(400);
    expect(err.path).toBe('/rest/api/3/issue');
  });

  it('creates UnauthorizedError for 401', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(401, {}), '/test');
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.status).toBe(401);
  });

  it('creates ForbiddenError for 403', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(403, {}), '/test');
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.status).toBe(403);
  });

  it('creates NotFoundError for 404', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(404, {}), '/test');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
  });

  it('creates ConflictError for 409', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(409, {}), '/test');
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.status).toBe(409);
  });

  it('creates RateLimitError for 429', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(429, {}), '/test');
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.status).toBe(429);
  });

  it('creates base ForgeApiError for unknown status codes', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(503, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiError);
    expect(err.status).toBe(503);
    expect(err.constructor).toBe(ForgeApiError);
  });

  it('handles non-JSON responses gracefully', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });
    const err = await ForgeApiError.fromResponse(response, '/test');
    expect(err.status).toBe(500);
    expect(err.message).toBeDefined();
  });

  it('BadRequestError exposes errorMessages and fieldErrors from body', async () => {
    const err = await ForgeApiError.fromResponse(
      makeResponse(400, { errorMessages: ['Summary required'], errors: { assignee: 'Invalid user' } }),
      '/test',
    ) as BadRequestError;
    expect(err.errorMessages).toEqual(['Summary required']);
    expect(err.fieldErrors).toEqual({ assignee: 'Invalid user' });
  });

  it('RateLimitError parses retryAfterSeconds from Retry-After header', async () => {
    const response = new Response(JSON.stringify({}), {
      status: 429,
      headers: { 'content-type': 'application/json', 'Retry-After': '30' },
    });
    const err = await ForgeApiError.fromResponse(response, '/test') as RateLimitError;
    expect(err.retryAfterSeconds).toBe(30);
  });
});
