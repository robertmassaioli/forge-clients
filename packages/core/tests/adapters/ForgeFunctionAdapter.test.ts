import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — intercepts both static and dynamic imports of @forge/api
vi.mock('@forge/api', () => {
  const mockRequestJira = vi.fn();
  const mockRequestConfluence = vi.fn();
  return {
    default: {
      asApp: vi.fn(() => ({ requestJira: mockRequestJira, requestConfluence: mockRequestConfluence })),
      asUser: vi.fn(() => ({ requestJira: mockRequestJira, requestConfluence: mockRequestConfluence })),
    },
    assumeTrustedRoute: vi.fn((path: string) => path),
  };
});

import { ForgeFunctionAdapter } from '../../src/adapters/ForgeFunctionAdapter.js';

const makeOkResponse = (body: unknown = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

async function getForgeApi() {
  return import('@forge/api');
}

describe('ForgeFunctionAdapter', () => {
  let requestJiraMock: ReturnType<typeof vi.fn>;
  let requestConfluenceMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    requestJiraMock = vi.fn().mockResolvedValue(makeOkResponse());
    requestConfluenceMock = vi.fn().mockResolvedValue(makeOkResponse());
    const { default: api } = await getForgeApi();
    vi.mocked(api.asApp).mockReturnValue({ requestJira: requestJiraMock, requestConfluence: requestConfluenceMock } as any);
    vi.mocked(api.asUser).mockReturnValue({ requestJira: requestJiraMock, requestConfluence: requestConfluenceMock } as any);
  });

  describe('constructor', () => {
    it('sets product to jira', () => {
      expect(new ForgeFunctionAdapter({ product: 'jira' }).product).toBe('jira');
    });

    it('sets product to confluence', () => {
      expect(new ForgeFunctionAdapter({ product: 'confluence' }).product).toBe('confluence');
    });
  });

  describe('auth context routing', () => {
    it('calls api.asApp() when authContext.type is asApp', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { default: api } = await getForgeApi();
      expect(vi.mocked(api.asApp)).toHaveBeenCalled();
      expect(vi.mocked(api.asUser)).not.toHaveBeenCalled();
    });

    it('calls api.asUser() without userId when authContext.type is asUser with no userId', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { default: api } = await getForgeApi();
      expect(vi.mocked(api.asUser)).toHaveBeenCalledWith(undefined);
    });

    it('calls api.asUser() with userId when authContext has userId', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser', userId: 'abc123' } });
      const { default: api } = await getForgeApi();
      expect(vi.mocked(api.asUser)).toHaveBeenCalledWith('abc123');
    });

    it('uses asUser when defaultContext is asUser and authContext is asApp', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira', defaultContext: 'asUser' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { default: api } = await getForgeApi();
      expect(vi.mocked(api.asUser)).toHaveBeenCalled();
      expect(vi.mocked(api.asApp)).not.toHaveBeenCalled();
    });
  });

  describe('product routing', () => {
    it('calls requestJira for jira product', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      expect(requestJiraMock).toHaveBeenCalled();
      expect(requestConfluenceMock).not.toHaveBeenCalled();
    });

    it('calls requestConfluence for confluence product', async () => {
      const { default: api } = await getForgeApi();
      vi.mocked(api.asApp).mockReturnValue({ requestJira: requestJiraMock, requestConfluence: requestConfluenceMock } as any);
      const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
      await adapter.fetch({ method: 'GET', path: '/wiki/rest/api/space', authContext: { type: 'asApp' } });
      expect(requestConfluenceMock).toHaveBeenCalled();
      expect(requestJiraMock).not.toHaveBeenCalled();
    });
  });

  describe('path and query string building', () => {
    it('passes path directly for simple paths', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { assumeTrustedRoute } = await getForgeApi();
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
      const { assumeTrustedRoute } = await getForgeApi();
      const calledPath = vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0] as string;
      expect(calledPath).toContain('fields=summary');
      expect(calledPath).toContain('expand=changelog');
    });

    it('omits undefined query params from query string', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: undefined },
        authContext: { type: 'asApp' },
      });
      const { assumeTrustedRoute } = await getForgeApi();
      const calledPath = vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0] as string;
      expect(calledPath).not.toContain('expand');
      expect(calledPath).toContain('fields=summary');
    });

    it('returns plain path when no query params', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const { assumeTrustedRoute } = await getForgeApi();
      expect(vi.mocked(assumeTrustedRoute).mock.calls[0]?.[0]).toBe('/rest/api/3/myself');
    });
  });

  describe('request init construction', () => {
    it('includes Content-Type and Accept headers by default', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const init = requestJiraMock.mock.calls[0]?.[1] as RequestInit;
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect((init.headers as Record<string, string>)['Accept']).toBe('application/json');
    });

    it('merges caller-supplied headers with default headers', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/myself',
        headers: { 'X-Atlassian-Token': 'no-check' },
        authContext: { type: 'asApp' },
      });
      const init = requestJiraMock.mock.calls[0]?.[1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['X-Atlassian-Token']).toBe('no-check');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('does not include body for GET requests', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asApp' } });
      const init = requestJiraMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.body).toBeUndefined();
    });

    it('serializes body as JSON string for POST', async () => {
      const adapter = new ForgeFunctionAdapter({ product: 'jira' });
      const body = { fields: { summary: 'Test', project: { key: 'PROJ' } } };
      await adapter.fetch({ method: 'POST', path: '/rest/api/3/issue', body, authContext: { type: 'asApp' } });
      const init = requestJiraMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.body).toBe(JSON.stringify(body));
    });
  });
});
