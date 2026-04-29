# Testing Core Utilities

Tests for `OfflineTokenManager`, error classes, retry handler, and pagination helpers.

---

## 3.1 OfflineTokenManager

### Approach

Mock global `fetch` to simulate GraphQL endpoint responses. Use `vi.useFakeTimers()` to
control token expiry without waiting real time.

```typescript
// packages/core/src/auth/OfflineTokenManager.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineTokenManager } from './OfflineTokenManager.js';

const PROXY_URL = 'https://proxy.example.com';
const INSTALL_ID = 'ari:cloud:ecosystem::installation/test-uuid';

function makeTokenResponse(accessToken: string, expirySecondsFromNow: number) {
  const expiry = Math.floor(Date.now() / 1000) + expirySecondsFromNow;
  return {
    data: {
      offlineUserAuthToken: { accessToken, expiry },
    },
  };
}

function mockFetchWithToken(accessToken: string, expirySecondsFromNow: number) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(makeTokenResponse(accessToken, expirySecondsFromNow)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('OfflineTokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getToken — cache miss', () => {
    it('fetches token from GraphQL endpoint on first call', async () => {
      mockFetchWithToken('access-tok-1', 3600);
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      const token = await manager.getToken('user-123');

      expect(token.accessToken).toBe('access-tok-1');
      expect(token.accountId).toBe('user-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('calls correct GraphQL URL', async () => {
      mockFetchWithToken('tok', 3600);
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      await manager.getToken('user-123');

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).toBe(`${PROXY_URL}/graphql`);
    });

    it('sends correct forge-proxy-authorization header', async () => {
      mockFetchWithToken('tok', 3600);
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      await manager.getToken('user-123');

      const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(init.headers['forge-proxy-authorization']).toBe(
        `Forge as=app,installationId=${INSTALL_ID}`,
      );
    });

    it('includes accountId in GraphQL variables', async () => {
      mockFetchWithToken('tok', 3600);
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      await manager.getToken('user-abc');

      const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(init.body as string);
      expect(body.variables.userId).toBe('user-abc');
    });
  });

  describe('getToken — cache hit', () => {
    it('returns cached token without fetching again', async () => {
      mockFetchWithToken('tok', 3600);
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      const tok1 = await manager.getToken('user-123');
      const tok2 = await manager.getToken('user-123');

      expect(tok1.accessToken).toBe(tok2.accessToken);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('caches tokens per accountId independently', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(makeTokenResponse('tok-alice', 3600)), { status: 200, headers: { 'content-type': 'application/json' } }))
        .mockResolvedValueOnce(new Response(JSON.stringify(makeTokenResponse('tok-bob', 3600)), { status: 200, headers: { 'content-type': 'application/json' } }));
      global.fetch = fetchMock;

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      const alice = await manager.getToken('alice');
      const bob = await manager.getToken('bob');

      expect(alice.accessToken).toBe('tok-alice');
      expect(bob.accessToken).toBe('tok-bob');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('proactive refresh', () => {
    it('refreshes token when within refreshBufferSeconds of expiry', async () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            data: { offlineUserAuthToken: { accessToken: 'tok-1', expiry: Math.floor(now / 1000) + 90 } },
          }), { status: 200, headers: { 'content-type': 'application/json' } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            data: { offlineUserAuthToken: { accessToken: 'tok-2', expiry: Math.floor(now / 1000) + 3600 } },
          }), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
      global.fetch = fetchMock;

      // Default refreshBufferSeconds is 60
      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });

      await manager.getToken('user-123');  // fetches tok-1 (expires in 90s)

      // Advance 35 seconds — now within 55s of expiry, which is < 60s buffer
      vi.advanceTimersByTime(35_000);

      const tok2 = await manager.getToken('user-123');  // should proactively refresh
      expect(tok2.accessToken).toBe('tok-2');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidation', () => {
    it('invalidate() forces re-fetch on next getToken()', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValue(new Response(JSON.stringify(makeTokenResponse('tok', 3600)), {
          status: 200, headers: { 'content-type': 'application/json' },
        }));
      global.fetch = fetchMock;

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await manager.getToken('user-123');
      manager.invalidate('user-123');
      await manager.getToken('user-123');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('invalidateAll() forces re-fetch for all accounts', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValue(new Response(JSON.stringify(makeTokenResponse('tok', 3600)), {
          status: 200, headers: { 'content-type': 'application/json' },
        }));
      global.fetch = fetchMock;

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await manager.getToken('alice');
      await manager.getToken('bob');
      manager.invalidateAll();
      await manager.getToken('alice');
      await manager.getToken('bob');

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    it('throws on GraphQL errors array', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          data: null,
          errors: [{ message: 'User does not exist' }],
        }), { status: 200, headers: { 'content-type': 'application/json' } }),
      );

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(manager.getToken('bad-user')).rejects.toThrow('User does not exist');
    });

    it('throws on non-ok HTTP response', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(manager.getToken('user-123')).rejects.toThrow();
    });

    it('throws on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const manager = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(manager.getToken('user-123')).rejects.toThrow('ECONNREFUSED');
    });
  });
});
```

---

## 3.2 Error Classes

```typescript
// packages/core/src/errors/ForgeApiError.test.ts
import { describe, it, expect } from 'vitest';
import {
  ForgeApiError,
  ForgeApiBadRequestError,
  ForgeApiUnauthorizedError,
  ForgeApiForbiddenError,
  ForgeApiNotFoundError,
  ForgeApiConflictError,
  ForgeApiRateLimitError,
} from './index.js';

function makeResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ForgeApiError.fromResponse', () => {
  it('creates ForgeApiBadRequestError for 400', async () => {
    const err = await ForgeApiError.fromResponse(
      makeResponse(400, { errorMessages: ['Field required: summary'] }),
      '/rest/api/3/issue',
    );
    expect(err).toBeInstanceOf(ForgeApiBadRequestError);
    expect(err.statusCode).toBe(400);
    expect(err.path).toBe('/rest/api/3/issue');
  });

  it('creates ForgeApiUnauthorizedError for 401', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(401, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiUnauthorizedError);
    expect(err.statusCode).toBe(401);
  });

  it('creates ForgeApiForbiddenError for 403', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(403, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiForbiddenError);
    expect(err.statusCode).toBe(403);
  });

  it('creates ForgeApiNotFoundError for 404', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(404, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiNotFoundError);
    expect(err.statusCode).toBe(404);
  });

  it('creates ForgeApiConflictError for 409', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(409, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiConflictError);
    expect(err.statusCode).toBe(409);
  });

  it('creates ForgeApiRateLimitError for 429', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(429, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiRateLimitError);
    expect(err.statusCode).toBe(429);
  });

  it('creates base ForgeApiError for unknown status codes', async () => {
    const err = await ForgeApiError.fromResponse(makeResponse(503, {}), '/test');
    expect(err).toBeInstanceOf(ForgeApiError);
    expect(err.statusCode).toBe(503);
  });

  it('includes error messages from response body', async () => {
    const err = await ForgeApiError.fromResponse(
      makeResponse(400, { errorMessages: ['Issue summary is required'] }),
      '/test',
    );
    expect(err.message).toContain('Issue summary is required');
  });

  it('handles non-JSON responses gracefully', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });
    const err = await ForgeApiError.fromResponse(response, '/test');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBeDefined();
  });
});
```

---

## 3.3 Retry Handler

```typescript
// packages/core/src/retry/RetryHandler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry } from './RetryHandler.js';
import { ForgeApiRateLimitError } from '../errors/index.js';

describe('withRetry', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Transient'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, { maxRetries: 2, initialDelayMs: 100 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxRetries exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Permanent failure'));

    const promise = withRetry(fn, { maxRetries: 2, initialDelayMs: 100 });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Permanent failure');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('applies exponential backoff between retries', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay) => {
      delays.push(delay ?? 0);
      return originalSetTimeout(fn, 0);
    });

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    await withRetry(fn, { maxRetries: 3, initialDelayMs: 100 });

    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200); // 100 * 2^1
  });

  it('respects Retry-After header on 429', async () => {
    const rateLimitError = new ForgeApiRateLimitError('Rate limited', 429, '/test', 5000);
    const fn = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('success');

    const delays: number[] = [];
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb, delay) => {
      delays.push(delay ?? 0);
      return setTimeout(cb, 0);
    });

    await withRetry(fn, { maxRetries: 2 });

    expect(delays[0]).toBeGreaterThanOrEqual(5000);
  });

  it('does not retry non-retryable errors (4xx except 429)', async () => {
    const { ForgeApiNotFoundError } = await import('../errors/index.js');
    const fn = vi.fn().mockRejectedValue(new ForgeApiNotFoundError('Not found', 404, '/test'));

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1); // Should NOT retry 404
  });
});
```

---

## 3.4 Pagination Helpers

```typescript
// packages/core/src/pagination/PaginationHelper.test.ts
import { describe, it, expect, vi } from 'vitest';
import { collectAllPages, iteratePages, iterateCursorPages } from './PaginationHelper.js';

describe('collectAllPages', () => {
  it('collects single page', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      values: [{ id: 1 }, { id: 2 }],
      isLast: true,
    });
    const result = await collectAllPages(
      fetcher,
      (page) => page.values,
      (page) => page.isLast,
    );
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('collects multiple pages', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ values: [{ id: 1 }], isLast: false })
      .mockResolvedValueOnce({ values: [{ id: 2 }], isLast: false })
      .mockResolvedValueOnce({ values: [{ id: 3 }], isLast: true });

    const result = await collectAllPages(fetcher, (p) => p.values, (p) => p.isLast);

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('passes correct startAt to each page fetch', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ values: [1, 2], isLast: false })
      .mockResolvedValueOnce({ values: [3], isLast: true });

    await collectAllPages(fetcher, (p) => p.values, (p) => p.isLast);

    expect(fetcher).toHaveBeenNthCalledWith(1, 0);
    expect(fetcher).toHaveBeenNthCalledWith(2, 2);
  });

  it('handles empty first page', async () => {
    const fetcher = vi.fn().mockResolvedValue({ values: [], isLast: true });
    const result = await collectAllPages(fetcher, (p) => p.values, (p) => p.isLast);
    expect(result).toEqual([]);
  });
});

describe('iteratePages', () => {
  it('yields each page as async iterable', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ values: [1, 2], isLast: false })
      .mockResolvedValueOnce({ values: [3], isLast: true });

    const pages: unknown[] = [];
    for await (const page of iteratePages(fetcher, (p) => p.values, (p) => p.isLast)) {
      pages.push(page);
    }

    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual([1, 2]);
    expect(pages[1]).toEqual([3]);
  });

  it('stops iteration after isLast page', async () => {
    const fetcher = vi.fn().mockResolvedValue({ values: [1], isLast: true });

    let count = 0;
    for await (const _ of iteratePages(fetcher, (p) => p.values, (p) => p.isLast)) {
      count++;
    }

    expect(count).toBe(1);
  });
});

describe('iterateCursorPages', () => {
  it('follows cursor through pages', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ results: ['a'], nextCursor: 'cursor-2' })
      .mockResolvedValueOnce({ results: ['b'], nextCursor: null });

    const results: string[] = [];
    for await (const page of iterateCursorPages(
      fetcher,
      (p) => p.results,
      (p) => p.nextCursor,
    )) {
      results.push(...page);
    }

    expect(results).toEqual(['a', 'b']);
    expect(fetcher).toHaveBeenNthCalledWith(1, undefined);
    expect(fetcher).toHaveBeenNthCalledWith(2, 'cursor-2');
  });
});
```
