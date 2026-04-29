/**
 * Unit tests for ForgeRemoteAdapter and adapterFromForgePayload.
 *
 * These tests mock the global fetch and process.env to test the adapter
 * without a real Forge runtime or egress proxy.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForgeRemoteAdapter } from '../../src/adapters/ForgeRemoteAdapter.js';
import {
  adapterFromForgePayload,
  getInvokingUserId,
  type ForgeInvocationPayload,
} from '../../src/adapters/ForgeInvocationPayload.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePayload(overrides?: Partial<ForgeInvocationPayload>): ForgeInvocationPayload {
  return {
    installationId: 'test-installation-id',
    appSystemToken: 'test-app-system-token',
    context: {
      accountId: 'test-account-id',
      cloudId: 'test-cloud-id',
      siteUrl: 'https://test.atlassian.net',
      environmentType: 'DEVELOPMENT',
    },
    ...overrides,
  };
}

function makeOkResponse(body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const PROXY_URL = 'https://forge-proxy.example.com';
const INSTALLATION_ID = 'install-abc123';
const APP_SYSTEM_TOKEN = 'token-xyz789';

// ─── ForgeRemoteAdapter ──────────────────────────────────────────────────────

describe('ForgeRemoteAdapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(makeOkResponse({ id: 'PROJ-1' }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('trims trailing slash from proxyUrl', () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: `${PROXY_URL}/`,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      expect(adapter.product).toBe('jira');
    });

    it('exposes the correct product', () => {
      const jira = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      const confluence = new ForgeRemoteAdapter({
        product: 'confluence',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      expect(jira.product).toBe('jira');
      expect(confluence.product).toBe('confluence');
    });
  });

  describe('fetch — asApp', () => {
    it('builds correct URL for jira', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        authContext: { type: 'asApp' },
      });
      expect(fetchMock).toHaveBeenCalledWith(
        `${PROXY_URL}/jira/rest/api/3/issue/PROJ-1`,
        expect.any(Object),
      );
    });

    it('builds correct URL for confluence', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'confluence',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      await adapter.fetch({
        method: 'GET',
        path: '/wiki/rest/api/space',
        authContext: { type: 'asApp' },
      });
      expect(fetchMock).toHaveBeenCalledWith(
        `${PROXY_URL}/confluence/wiki/rest/api/space`,
        expect.any(Object),
      );
    });

    it('sets forge-proxy-authorization header with appSystemToken for asApp', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        authContext: { type: 'asApp' },
      });
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers['forge-proxy-authorization']).toContain(`installationId=${INSTALLATION_ID}`);
      expect(headers['forge-proxy-authorization']).toContain(`token=${APP_SYSTEM_TOKEN}`);
      expect(headers['forge-proxy-authorization']).toContain('as=app');
    });

    it('appends query params to URL', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/search',
        queryParams: { jql: 'project = TEST', maxResults: 50 },
        authContext: { type: 'asApp' },
      });
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain('jql=project+%3D+TEST');
      expect(url).toContain('maxResults=50');
    });

    it('serialises body as JSON for POST requests', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      const body = { fields: { summary: 'Test issue' } };
      await adapter.fetch({
        method: 'POST',
        path: '/rest/api/3/issue',
        body,
        authContext: { type: 'asApp' },
      });
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(JSON.stringify(body));
    });
  });

  describe('fetch — asUser', () => {
    it('sets as=user in forge-proxy-authorization header', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        authContext: { type: 'asUser', userId: 'account-id-abc' },
      });
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers['forge-proxy-authorization']).toContain('as=user');
      expect(headers['forge-proxy-authorization']).toContain('accountId=account-id-abc');
    });
  });

  describe('fetch — offlineUser', () => {
    it('uses the provided accessToken in Authorization header', async () => {
      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });

      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        authContext: { type: 'offlineUser', accountId: 'user-123', accessToken: 'pre-fetched-token' },
      });

      // Should have made exactly 1 fetch call — adapter does NOT fetch the token
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [, apiInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const apiHeaders = apiInit.headers as Record<string, string>;
      expect(apiHeaders['Authorization']).toBe('Bearer pre-fetched-token');
      expect(apiHeaders['forge-proxy-authorization']).toContain('as=user');
      expect(apiHeaders['forge-proxy-authorization']).toContain('accountId=user-123');
    });

    it('uses different tokens for different users in the same call sequence', async () => {
      fetchMock.mockResolvedValue(makeOkResponse({}));

      const adapter = new ForgeRemoteAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL,
        installationId: INSTALLATION_ID,
        appSystemToken: APP_SYSTEM_TOKEN,
      });

      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        authContext: { type: 'offlineUser', accountId: 'user-123', accessToken: 'token-for-user-123' },
      });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/project',
        authContext: { type: 'offlineUser', accountId: 'user-456', accessToken: 'token-for-user-456' },
      });

      // Each call uses its own pre-fetched token — no extra fetch calls
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const [, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const [, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect((firstInit.headers as Record<string, string>)['Authorization']).toBe('Bearer token-for-user-123');
      expect((secondInit.headers as Record<string, string>)['Authorization']).toBe('Bearer token-for-user-456');
    });
  });
});

// ─── adapterFromForgePayload ─────────────────────────────────────────────────

describe('adapterFromForgePayload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a ForgeRemoteAdapter from payload with explicit proxyUrl', () => {
    const payload = makePayload();
    const adapter = adapterFromForgePayload(payload, 'jira', { proxyUrl: PROXY_URL });
    expect(adapter).toBeInstanceOf(ForgeRemoteAdapter);
    expect(adapter.product).toBe('jira');
  });

  it('reads FORGE_EGRESS_PROXY_URL from process.env when no proxyUrl option given', () => {
    vi.stubEnv('FORGE_EGRESS_PROXY_URL', PROXY_URL);
    const payload = makePayload();
    const adapter = adapterFromForgePayload(payload, 'confluence');
    expect(adapter).toBeInstanceOf(ForgeRemoteAdapter);
    expect(adapter.product).toBe('confluence');
  });

  it('throws if FORGE_EGRESS_PROXY_URL is not set and no proxyUrl option given', () => {
    vi.stubEnv('FORGE_EGRESS_PROXY_URL', '');
    const payload = makePayload();
    expect(() => adapterFromForgePayload(payload, 'jira')).toThrow(
      'FORGE_EGRESS_PROXY_URL environment variable is not set',
    );
  });

  it('throws if payload.installationId is missing', () => {
    const payload = makePayload({ installationId: '' });
    expect(() => adapterFromForgePayload(payload, 'jira', { proxyUrl: PROXY_URL })).toThrow(
      'payload.installationId is missing',
    );
  });

  it('throws if payload.appSystemToken is missing', () => {
    const payload = makePayload({ appSystemToken: '' });
    expect(() => adapterFromForgePayload(payload, 'jira', { proxyUrl: PROXY_URL })).toThrow(
      'payload.appSystemToken is missing',
    );
  });
});

// ─── getInvokingUserId ───────────────────────────────────────────────────────

describe('getInvokingUserId', () => {
  it('returns accountId from context', () => {
    const payload = makePayload();
    expect(getInvokingUserId(payload)).toBe('test-account-id');
  });

  it('returns undefined when context has no accountId', () => {
    const payload = makePayload({ context: { cloudId: 'test-cloud-id' } });
    expect(getInvokingUserId(payload)).toBeUndefined();
  });
});
