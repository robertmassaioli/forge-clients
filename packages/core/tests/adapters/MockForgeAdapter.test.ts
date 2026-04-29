import { describe, it, expect } from 'vitest';
import { MockForgeAdapter } from '../../src/test-utils/MockForgeAdapter.js';
import { asApp } from '../../src/client/BoundClient.js';

describe('MockForgeAdapter', () => {
  it('defaults to jira product', () => {
    expect(new MockForgeAdapter().product).toBe('jira');
  });

  it('sets product from constructor', () => {
    expect(new MockForgeAdapter('confluence').product).toBe('confluence');
  });

  describe('fetch recording', () => {
    it('records each call', async () => {
      const mock = new MockForgeAdapter();
      await mock.fetch({ method: 'GET', path: '/test', authContext: { type: 'asApp' } });
      expect(mock.callCount).toBe(1);
      expect(mock.getLastCall()?.path).toBe('/test');
      expect(mock.getLastCall()?.method).toBe('GET');
    });

    it('records query params and body', async () => {
      const mock = new MockForgeAdapter();
      await mock.fetch({
        method: 'POST',
        path: '/rest/api/3/issue',
        queryParams: { expand: 'names' },
        body: { fields: { summary: 'Test' } },
        authContext: { type: 'asApp' },
      });
      const call = mock.getLastCall()!;
      expect(call.queryParams).toEqual({ expand: 'names' });
      expect(call.body).toEqual({ fields: { summary: 'Test' } });
    });

    it('records auth context', async () => {
      const mock = new MockForgeAdapter();
      await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asUser', userId: 'u1' } });
      expect(mock.getLastCall()?.authContext).toEqual({ type: 'asUser', userId: 'u1' });
    });

    it('getCall returns nth call', async () => {
      const mock = new MockForgeAdapter();
      await mock.fetch({ method: 'GET', path: '/first', authContext: { type: 'asApp' } });
      await mock.fetch({ method: 'GET', path: '/second', authContext: { type: 'asApp' } });
      expect(mock.getCall(0)?.path).toBe('/first');
      expect(mock.getCall(1)?.path).toBe('/second');
    });
  });

  describe('response queue', () => {
    it('returns default 200 {} when queue is empty', async () => {
      const mock = new MockForgeAdapter();
      const res = await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({});
    });

    it('returns queued responses in FIFO order', async () => {
      const mock = new MockForgeAdapter();
      mock.queueResponse({ id: 1 }).queueResponse({ id: 2 });
      const r1 = await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      const r2 = await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      expect(await r1.json()).toEqual({ id: 1 });
      expect(await r2.json()).toEqual({ id: 2 });
    });

    it('queueErrorResponse returns non-2xx status', async () => {
      const mock = new MockForgeAdapter();
      mock.queueErrorResponse(404, { message: 'Not Found' });
      const res = await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      expect(res.status).toBe(404);
    });

    it('queueNoContent returns 204', async () => {
      const mock = new MockForgeAdapter();
      mock.queueNoContent();
      const res = await mock.fetch({ method: 'DELETE', path: '/x', authContext: { type: 'asApp' } });
      expect(res.status).toBe(204);
    });

    it('queueThrow causes fetch to throw', async () => {
      const mock = new MockForgeAdapter();
      mock.queueThrow(new Error('Network error'));
      await expect(mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } }))
        .rejects.toThrow('Network error');
    });
  });

  describe('reset', () => {
    it('clears calls and queues', async () => {
      const mock = new MockForgeAdapter();
      mock.queueResponse({ x: 1 });
      await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      mock.reset();
      expect(mock.callCount).toBe(0);
      const res = await mock.fetch({ method: 'GET', path: '/x', authContext: { type: 'asApp' } });
      expect(await res.json()).toEqual({});
    });
  });
});
