import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForgeContainerAdapter } from '../../src/adapters/ForgeContainerAdapter.js';

const PROXY_URL = 'https://forge-egress-proxy.example.com';
const INSTALL_ID = 'ari:cloud:ecosystem::installation/test-uuid';

function makeOkResponse(body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ForgeContainerAdapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(makeOkResponse());
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('sets product to jira', () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      expect(adapter.product).toBe('jira');
    });

    it('sets product to confluence', () => {
      const adapter = new ForgeContainerAdapter({ product: 'confluence', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      expect(adapter.product).toBe('confluence');
    });

    it('strips trailing slash from proxyUrl', async () => {
      const adapter = new ForgeContainerAdapter({
        product: 'jira',
        proxyUrl: PROXY_URL + '/',
        installationId: INSTALL_ID,
      });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('//jira');
      expect(calledUrl).toContain(`${PROXY_URL}/jira`);
    });
  });

  describe('URL construction', () => {
    it('constructs correct URL for jira product', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      expect(fetchMock.mock.calls[0][0]).toBe(`${PROXY_URL}/jira/rest/api/3/myself`);
    });

    it('constructs correct URL for confluence product', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'confluence', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({ method: 'GET', path: '/wiki/rest/api/space', authContext: { type: 'asApp' } });
      expect(fetchMock.mock.calls[0][0]).toBe(`${PROXY_URL}/confluence/wiki/rest/api/space`);
    });

    it('appends query params to URL', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: 'changelog' },
        authContext: { type: 'asApp' },
      });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('fields=summary');
      expect(url).toContain('expand=changelog');
    });

    it('omits undefined query params', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: undefined },
        authContext: { type: 'asApp' },
      });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).not.toContain('expand');
    });
  });

  describe('forge-proxy-authorization header', () => {
    it('sets header for asApp context', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['forge-proxy-authorization']).toContain('as=app');
      expect(headers['forge-proxy-authorization']).toContain(INSTALL_ID);
    });

    it('sets header for asUser context with userId', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser', userId: 'user-abc' } });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['forge-proxy-authorization']).toContain('as=user');
      expect(headers['forge-proxy-authorization']).toContain('user-abc');
    });

    it('sets header and Authorization for offlineUser context', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
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
  });

  describe('request body', () => {
    it('serializes body as JSON for POST', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      const body = { fields: { summary: 'Test issue' } };
      await adapter.fetch({ method: 'POST', path: '/rest/api/3/issue', body, authContext: { type: 'asApp' } });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.body).toBe(JSON.stringify(body));
    });

    it('does not include body for GET', async () => {
      const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.body).toBeUndefined();
    });
  });
});
