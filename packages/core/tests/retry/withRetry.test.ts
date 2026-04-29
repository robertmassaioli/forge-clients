import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../src/retry/index.js';
import { RateLimitError, ForgeApiError } from '../../src/errors/ForgeApiError.js';

describe('withRetry', () => {
  it('returns result immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, initialDelayMs: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on ForgeApiError 429 and eventually succeeds', async () => {
    const rateLimitErr = new RateLimitError({}, '/test', '0');
    const fn = vi.fn()
      .mockRejectedValueOnce(rateLimitErr)
      .mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 3, initialDelayMs: 0, retryOn: [429] });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-ForgeApiErrors', async () => {
    const err = new Error('network failure');
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { maxRetries: 3, initialDelayMs: 0 })).rejects.toThrow('network failure');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on non-retryable status codes', async () => {
    const notFoundErr = new NotFoundError({ message: 'not found' }, '/test');
    const fn = vi.fn().mockRejectedValue(notFoundErr);
    await expect(withRetry(fn, { maxRetries: 3, initialDelayMs: 0, retryOn: [429, 503] }))
      .rejects.toBeInstanceOf(ForgeApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all retries', async () => {
    const serverErr = new ForgeApiError(503, { message: 'server error' }, '/test');
    // Override status for 503
    Object.defineProperty(serverErr, 'status', { value: 503, writable: false });
    const fn = vi.fn().mockRejectedValue(serverErr);
    await expect(withRetry(fn, { maxRetries: 2, initialDelayMs: 0, retryOn: [503] }))
      .rejects.toBeInstanceOf(ForgeApiError);
    // initial + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// Import needed for the test
import { NotFoundError } from '../../src/errors/ForgeApiError.js';
