# Testing Core Adapters

Tests for `ForgeFunctionAdapter`, `ForgeBridgeAdapter`, and `ForgeContainerAdapter`.
These are the trickiest tests because they involve dynamic imports and environment variables.

---

## 2.1 ForgeFunctionAdapter

### The Challenge

`ForgeFunctionAdapter.fetch()` uses `await import('@forge/api')` — a dynamic import.
The `@forge/api` package throws at import time outside the Forge runtime. We must intercept
this dynamic import before the adapter code runs.

Vitest's `vi.mock()` hoists the mock to before any imports, which handles static imports.
For dynamic imports, we use `vi.mock('@forge/api')` combined with `vi.mocked()` to
configure per-test behaviour.

### Test File

```typescript
// packages/core/src/adapters/ForgeFunctionAdapter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock is hoisted to top of file — runs before any imports
vi.mock('@forge/api', () => {
  const mockRequestJira = vi.fn();
  const mockRequestConfluence = vi.fn();
  const mockAsApp = vi.fn(() => ({
    requestJira: mockRequestJira,
    requestConfluence: mockRequestConfluence,
  }));
  const mockAsUser = vi.fn(() => ({
    requestJira: mockRequestJira,
    requestConfluence: mockRequestConfluence,
  }));

  return {
    default: {
      asApp: mockAsApp,
      asUser: mockAsUser,
    },
    assumeTrustedRoute: vi.fn((path: string) => path),
  };
});

// Import AFTER vi.mock
import { ForgeFunctionAdapter } from './ForgeFunctionAdapter.js';

const makeOkResponse = (body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('ForgeFunctionAdapter', () => {
  let requestJiraMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const forgeApi = await import('@forge/api');
    requestJiraMock = vi.fn().mockResolvedValue(makeOkResponse());
    vi.mocked(forgeApi.default.asApp).mockReturnValue({
      requestJira: requestJiraMock,
      requestConfluence: vi.fn(),
    } as any);
    vi.mocked(forgeApi.default.asUser).mockReturnValue({
      requestJira: requestJiraMock,
      requestConfluence: vi.fn(),
    } as any);
  });

  describe('constructor', () => {
    it('sets product to jira', () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      expect(adapter.product).toBe('jira');
    });

    it('sets product to confluence', () => {
      const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
      expect(adapter.product).toBe('confluence');
    });

    it('defaults to asApp context', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { default: api } = await import('@forge/api');
      expect(vi.mocked(api.asApp)).toHaveBeenCalled();
      expect(vi.mocked(api.asUser)).not.toHaveBeenCalled();
    });
  });

  describe('auth context routing', () => {
    it('calls api.asApp() when authContext.type is asApp', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { default: api } = await import('@forge/api');
      expect(vi.mocked(api.asApp)).toHaveBeenCalled();
    });

    it('calls api.asUser() without userId when authContext.type is asUser with no userId', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { default: api } = await import('@forge/api');
      expect(vi.mocked(api.asUser)).toHaveBeenCalledWith(undefined);
    });

    it('calls api.asUser() with userId when authContext.type is asUser with userId', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        authContext: { type: 'asUser', userId: 'abc123' },
      });
      const { default: api } = await import('@forge/api');
      expect(vi.mocked(api.asUser)).toHaveBeenCalledWith('abc123');
    });

    it('uses asUser when defaultContext is asUser and authContext is asApp', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira', defaultContext: 'asUser' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { default: api } = await import('@forge/api');
      expect(vi.mocked(api.asUser)).toHaveBeenCalled();
      expect(vi.mocked(api.asApp)).not.toHaveBeenCalled();
    });
  });

  describe('product routing', () => {
    it('calls requestJira for jira product', async () => {
      const requestJira = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira, requestConfluence: vi.fn() } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });

      expect(requestJira).toHaveBeenCalled();
    });

    it('calls requestConfluence for confluence product', async () => {
      const requestConfluence = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira: vi.fn(), requestConfluence } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
      await adapter.fetch({ method: 'GET', path: '/wiki/rest/api/space', authContext: { type: 'asApp' } });

      expect(requestConfluence).toHaveBeenCalled();
    });
  });

  describe('path and query string building', () => {
    it('passes path directly for simple paths', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });

      const { assumeTrustedRoute } = await import('@forge/api');
      expect(vi.mocked(assumeTrustedRoute)).toHaveBeenCalledWith('/rest/api/3/myself');
    });

    it('appends query string to path', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: 'changelog' },
        authContext: { type: 'asApp' },
      });

      const { assumeTrustedRoute } = await import('@forge/api');
      const calledPath = vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0] as string;
      expect(calledPath).toContain('fields=summary');
      expect(calledPath).toContain('expand=changelog');
    });

    it('omits undefined query params', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: undefined },
        authContext: { type: 'asApp' },
      });

      const { assumeTrustedRoute } = await import('@forge/api');
      const calledPath = vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0] as string;
      expect(calledPath).not.toContain('expand');
    });

    it('returns path without query string when no params', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });

      const { assumeTrustedRoute } = await import('@forge/api');
      const calledPath = vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0] as string;
      expect(calledPath).toBe('/rest/api/3/myself');
    });
  });

  describe('request init construction', () => {
    it('includes Content-Type and Accept headers by default', async () => {
      const requestJira = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira, requestConfluence: vi.fn() } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });

      const init = requestJira.mock.calls[0][1];
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers['Accept']).toBe('application/json');
    });

    it('merges caller headers with default headers', async () => {
      const requestJira = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira, requestConfluence: vi.fn() } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        headers: { 'X-Atlassian-Token': 'no-check' },
        authContext: { type: 'asApp' },
      });

      const init = requestJira.mock.calls[0][1];
      expect(init.headers['X-Atlassian-Token']).toBe('no-check');
      expect(init.headers['Content-Type']).toBe('application/json');
    });

    it('does not include body for GET requests', async () => {
      const requestJira = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira, requestConfluence: vi.fn() } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });

      const init = requestJira.mock.calls[0][1];
      expect(init.body).toBeUndefined();
    });

    it('serializes body as JSON for POST requests', async () => {
      const requestJira = vi.fn().mockResolvedValue(makeOkResponse());
      const { default: api } = await import('@forge/api');
      vi.mocked(api.asApp).mockReturnValue({ requestJira, requestConfluence: vi.fn() } as any);

      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      const body = { fields: { summary: 'Test', project: { key: 'PROJ' } } };
      await adapter.fetch({ method: 'POST', path: '/rest/api/3/issue', body, authContext: { type: 'asApp' } });

      const init = requestJira.mock.calls[0][1];
      expect(init.body).toBe(JSON.stringify(body));
    });
  });
});
```

---

## 2.2 ForgeBridgeAdapter

Similar to `ForgeFunctionAdapter` but mocking `@forge/bridge`.

```typescript
// packages/core/src/adapters/ForgeBridgeAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@forge/bridge', () => ({
  invoke: vi.fn(),
}));

import { ForgeBridgeAdapter } from './ForgeBridgeAdapter.js';

describe('ForgeBridgeAdapter', () => {
  let adapter: ForgeBridgeAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new ForgeBridgeAdapter({ product: 'jira' });
    const bridge = await import('@forge/bridge');
    vi.mocked(bridge.invoke).mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
    );
  });

  it('calls bridge.invoke with correct method and path', async () => {
    await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });

    const { invoke } = await import('@forge/bridge');
    expect(vi.mocked(invoke)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET', path: '/rest/api/3/myself' }),
    );
  });

  it('sets product in the bridge invocation payload', async () => {
    const confluenceAdapter = new ForgeBridgeAdapter({ product: 'confluence' });
    await confluenceAdapter.fetch({ method: 'GET', path: '/wiki/rest/api/space', authContext: { type: 'asUser' } });

    const { invoke } = await import('@forge/bridge');
    expect(vi.mocked(invoke)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ product: 'confluence' }),
    );
  });
});
```

---

## 2.3 ForgeContainerAdapter

Mocks global `fetch` and `process.env.FORGE_EGRESS_PROXY_URL`.

```typescript
// packages/core/src/adapters/ForgeContainerAdapter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForgeContainerAdapter } from './ForgeContainerAdapter.js';

const PROXY_URL = 'https://forge-egress-proxy.example.com';

function makeOkResponse(body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ForgeContainerAdapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env['FORGE_EGRESS_PROXY_URL'];
    process.env['FORGE_EGRESS_PROXY_URL'] = PROXY_URL;
    fetchMock = vi.fn().mockResolvedValue(makeOkResponse());
    global.fetch = fetchMock;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['FORGE_EGRESS_PROXY_URL'] = originalEnv;
    } else {
      delete process.env['FORGE_EGRESS_PROXY_URL'];
    }
    vi.restoreAllMocks();
  });

  it('constructs target URL from proxy base + product + path', async () => {
    const adapter = new ForgeContainerAdapter({ product: 'jira', installationId: 'install-123' });
    await adapter.fetch({
      method: 'GET',
      path: '/rest/api/3/myself',
      authContext: { type: 'offlineUser', accountId: 'user-456', accessToken: 'tok' },
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${PROXY_URL}/jira/rest/api/3/myself`);
  });

  it('sets forge-proxy-authorization header for offlineUser', async () => {
    const adapter = new ForgeContainerAdapter({ product: 'jira', installationId: 'install-123' });
    await adapter.fetch({
      method: 'GET',
      path: '/rest/api/3/myself',
      authContext: { type: 'offlineUser', accountId: 'user-456', accessToken: 'tok123' },
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['forge-proxy-authorization']).toContain('user-456');
    expect(headers['Authorization']).toBe('Bearer tok123');
  });

  it('throws if FORGE_EGRESS_PROXY_URL is not set', async () => {
    delete process.env['FORGE_EGRESS_PROXY_URL'];
    expect(
      () => new ForgeContainerAdapter({ product: 'jira', installationId: 'install-123' })
    ).toThrow();
  });

  it('serializes body as JSON for POST', async () => {
    const adapter = new ForgeContainerAdapter({ product: 'jira', installationId: 'install-123' });
    const body = { fields: { summary: 'Test' } };
    await adapter.fetch({
      method: 'POST',
      path: '/rest/api/3/issue',
      body,
      authContext: { type: 'offlineUser', accountId: 'user-456', accessToken: 'tok' },
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify(body));
  });

  it('uses custom egressProxyUrl when provided', async () => {
    const adapter = new ForgeContainerAdapter({
      product: 'jira',
      installationId: 'install-123',
      egressProxyUrl: 'https://custom-proxy.example.com',
    });
    await adapter.fetch({
      method: 'GET',
      path: '/rest/api/3/myself',
      authContext: { type: 'offlineUser', accountId: 'user-456', accessToken: 'tok' },
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://custom-proxy.example.com');
  });
});
```
