import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter, asApp } from '@forge-clients/core';
import { getAttachments, getPages } from '@forge-clients/confluence/v2';

let mock: MockForgeAdapter;
beforeEach(() => { mock = new MockForgeAdapter('confluence'); });

describe('getPages (v2)', () => {
  it('calls GET with confluence product', async () => {
    mock.queueResponse({ results: [], _links: {} });
    const client = asApp(mock);
    const result = await getPages(client, {});
    expect(mock.callCount).toBe(1);
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(result).toBeDefined();
  });

  it('passes query params', async () => {
    mock.queueResponse({ results: [], _links: {} });
    const client = asApp(mock);
    await getPages(client, { spaceId: ['123'], limit: 10 });
    expect(mock.getLastCall()?.queryParams).toMatchObject({ spaceId: ['123'], limit: 10 });
  });
});

describe('getAttachments (v2)', () => {
  it('calls GET /wiki/api/v2/attachments', async () => {
    mock.queueResponse({ results: [], _links: {} });
    const client = asApp(mock);
    const result = await getAttachments(client, {});
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(mock.getLastCall()?.path).toContain('/attachments');
    expect(result).toBeDefined();
  });
});
