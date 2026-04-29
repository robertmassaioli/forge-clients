import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineTokenManager } from '../../src/auth/OfflineTokenManager.js';

const PROXY_URL = 'https://proxy.example.com';
const INSTALL_ID = 'ari:cloud:ecosystem::installation/test-uuid';

function makeTokenResponse(accessToken: string, expirySecondsFromNow: number) {
  const expiry = Math.floor(Date.now() / 1000) + expirySecondsFromNow;
  return { data: { offlineUserAuthToken: { accessToken, expiry } } };
}

function mockFetch(accessToken: string, expirySecondsFromNow: number) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(makeTokenResponse(accessToken, expirySecondsFromNow)), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('OfflineTokenManager', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('getToken — cache miss', () => {
    it('fetches token from proxy graphql endpoint on first call', async () => {
      mockFetch('tok-1', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      const token = await mgr.getToken('user-123');
      expect(token.accessToken).toBe('tok-1');
      expect(token.accountId).toBe('user-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('calls the correct GraphQL URL', async () => {
      mockFetch('tok', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('user-123');
      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).toBe(`${PROXY_URL}/graphql`);
    });

    it('sends correct forge-proxy-authorization header', async () => {
      mockFetch('tok', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('user-123');
      const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(init.headers['forge-proxy-authorization']).toBe(
        `Forge as=app,installationId=${INSTALL_ID}`,
      );
    });

    it('includes accountId in GraphQL variables', async () => {
      mockFetch('tok', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('user-abc');
      const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(init.body as string);
      expect(body.variables.userId).toBe('user-abc');
    });
  });

  describe('getToken — cache hit', () => {
    it('returns cached token without fetching again', async () => {
      mockFetch('tok', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      const tok1 = await mgr.getToken('user-123');
      const tok2 = await mgr.getToken('user-123');
      expect(tok1.accessToken).toBe(tok2.accessToken);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('caches tokens per accountId independently', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(makeTokenResponse('tok-alice', 3600)), { status: 200, headers: { 'content-type': 'application/json' } }))
        .mockResolvedValueOnce(new Response(JSON.stringify(makeTokenResponse('tok-bob', 3600)), { status: 200, headers: { 'content-type': 'application/json' } }));
      global.fetch = fetchMock;
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      const alice = await mgr.getToken('alice');
      const bob = await mgr.getToken('bob');
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
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('user-123'); // fetches tok-1 (expires in 90s)

      // Advance 35s — now 55s to expiry, within the 60s buffer → should refresh
      vi.advanceTimersByTime(35_000);

      const tok2 = await mgr.getToken('user-123');
      expect(tok2.accessToken).toBe('tok-2');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('respects custom refreshBufferSeconds', async () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            data: { offlineUserAuthToken: { accessToken: 'tok-1', expiry: Math.floor(now / 1000) + 200 } },
          }), { status: 200, headers: { 'content-type': 'application/json' } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            data: { offlineUserAuthToken: { accessToken: 'tok-2', expiry: Math.floor(now / 1000) + 3600 } },
          }), { status: 200, headers: { 'content-type': 'application/json' } }),
        );
      global.fetch = fetchMock;

      // refreshBufferSeconds = 120 — token with 200s expiry will be refreshed after 80s
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID, refreshBufferSeconds: 120 });
      await mgr.getToken('user-123');

      vi.advanceTimersByTime(81_000); // now 119s to expiry, within 120s buffer

      const tok2 = await mgr.getToken('user-123');
      expect(tok2.accessToken).toBe('tok-2');
    });
  });

  describe('invalidation', () => {
    // Response body is a stream — reusing the same Response object across calls
    // fails because the body has already been read. Use mockImplementation to
    // create a fresh Response for each call.
    function makeFreshFetchMock() {
      return vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(makeTokenResponse('tok', 3600)), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      );
    }

    it('invalidate() forces re-fetch on next getToken()', async () => {
      const fetchMock = makeFreshFetchMock();
      global.fetch = fetchMock;
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('user-123');
      mgr.invalidate('user-123');
      await mgr.getToken('user-123');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('invalidateAll() forces re-fetch for all accounts', async () => {
      const fetchMock = makeFreshFetchMock();
      global.fetch = fetchMock;
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await mgr.getToken('alice');
      await mgr.getToken('bob');
      mgr.invalidateAll();
      await mgr.getToken('alice');
      await mgr.getToken('bob');
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('boundClient', () => {
    it('returns BoundClient with offlineUser auth context', async () => {
      mockFetch('bound-tok', 3600);
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      const { MockForgeAdapter } = await import('../../src/test-utils/MockForgeAdapter.js');
      const adapter = new MockForgeAdapter('jira');
      const client = await mgr.boundClient(adapter, 'user-99');
      expect(client.authContext).toEqual({
        type: 'offlineUser',
        accountId: 'user-99',
        accessToken: 'bound-tok',
      });
      expect(client.adapter).toBe(adapter);
    });
  });

  describe('error handling', () => {
    it('throws on GraphQL errors array', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: null, errors: [{ message: 'User does not exist' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(mgr.getToken('bad-user')).rejects.toThrow('User does not exist');
    });

    it('throws on non-ok HTTP response', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 }));
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(mgr.getToken('user-123')).rejects.toThrow();
    });

    it('throws on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const mgr = new OfflineTokenManager({ proxyUrl: PROXY_URL, installationId: INSTALL_ID });
      await expect(mgr.getToken('user-123')).rejects.toThrow('ECONNREFUSED');
    });
  });
});
