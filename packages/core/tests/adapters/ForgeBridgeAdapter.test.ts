import { describe, it, expect, vi, beforeEach } from 'vitest';

// ForgeBridgeAdapter dynamically imports @forge/bridge and uses requestJira / requestConfluence
vi.mock('@forge/bridge', () => ({
  requestJira: vi.fn(),
  requestConfluence: vi.fn(),
}));

import { ForgeBridgeAdapter } from '../../src/adapters/ForgeBridgeAdapter.js';

const makeOkResponse = (body: unknown = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('ForgeBridgeAdapter', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const bridge = await import('@forge/bridge');
    vi.mocked(bridge.requestJira).mockResolvedValue(makeOkResponse() as any);
    vi.mocked(bridge.requestConfluence).mockResolvedValue(makeOkResponse() as any);
  });

  describe('constructor', () => {
    it('sets product to jira', () => {
      expect(new ForgeBridgeAdapter({ product: 'jira' }).product).toBe('jira');
    });

    it('sets product to confluence', () => {
      expect(new ForgeBridgeAdapter({ product: 'confluence' }).product).toBe('confluence');
    });
  });

  describe('product routing', () => {
    it('calls requestJira for jira product', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { requestJira, requestConfluence } = await import('@forge/bridge');
      expect(vi.mocked(requestJira)).toHaveBeenCalled();
      expect(vi.mocked(requestConfluence)).not.toHaveBeenCalled();
    });

    it('calls requestConfluence for confluence product', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'confluence' });
      await adapter.fetch({ method: 'GET', path: '/wiki/rest/api/space', authContext: { type: 'asUser' } });
      const { requestJira, requestConfluence } = await import('@forge/bridge');
      expect(vi.mocked(requestConfluence)).toHaveBeenCalled();
      expect(vi.mocked(requestJira)).not.toHaveBeenCalled();
    });
  });

  describe('path and query string building', () => {
    it('passes path directly to bridge', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { requestJira } = await import('@forge/bridge');
      const calledPath = vi.mocked(requestJira).mock.calls[0]?.[0] as string;
      expect(calledPath).toBe('/rest/api/3/myself');
    });

    it('appends query params to path', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: 'changelog' },
        authContext: { type: 'asUser' },
      });
      const { requestJira } = await import('@forge/bridge');
      const calledPath = vi.mocked(requestJira).mock.calls[0]?.[0] as string;
      expect(calledPath).toContain('fields=summary');
      expect(calledPath).toContain('expand=changelog');
    });

    it('omits undefined query params', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({
        method: 'GET',
        path: '/rest/api/3/issue/PROJ-1',
        queryParams: { fields: 'summary', expand: undefined },
        authContext: { type: 'asUser' },
      });
      const { requestJira } = await import('@forge/bridge');
      const calledPath = vi.mocked(requestJira).mock.calls[0]?.[0] as string;
      expect(calledPath).not.toContain('expand');
    });
  });

  describe('request init construction', () => {
    it('includes Content-Type and Accept headers', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { requestJira } = await import('@forge/bridge');
      const init = vi.mocked(requestJira).mock.calls[0]?.[1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });

    it('serializes body as JSON for POST', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      const body = { fields: { summary: 'Test' } };
      await adapter.fetch({ method: 'POST', path: '/rest/api/3/issue', body, authContext: { type: 'asUser' } });
      const { requestJira } = await import('@forge/bridge');
      const init = vi.mocked(requestJira).mock.calls[0]?.[1] as RequestInit;
      expect(init.body).toBe(JSON.stringify(body));
    });

    it('does not include body for GET', async () => {
      const adapter = new ForgeBridgeAdapter({ product: 'jira' });
      await adapter.fetch({ method: 'GET', path: '/rest/api/3/myself', authContext: { type: 'asUser' } });
      const { requestJira } = await import('@forge/bridge');
      const init = vi.mocked(requestJira).mock.calls[0]?.[1] as RequestInit;
      expect(init.body).toBeUndefined();
    });
  });
});
