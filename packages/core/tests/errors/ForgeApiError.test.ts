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
    const err = new BadRequestError({ message: 'bad' }, '/test');
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
