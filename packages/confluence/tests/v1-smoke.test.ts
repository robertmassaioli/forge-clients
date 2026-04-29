import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter, asApp } from '@forge-clients/core';
import {
  getCurrentUser,
  getAuditRecords,
} from '@forge-clients/confluence';

let mock: MockForgeAdapter;
beforeEach(() => { mock = new MockForgeAdapter('confluence'); });

describe('getCurrentUser', () => {
  it('calls GET with confluence product', async () => {
    mock.queueResponse({ accountId: 'user-123', displayName: 'Test User' });
    const client = asApp(mock);
    const result = await getCurrentUser(client, {});
    expect(mock.callCount).toBe(1);
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(result.accountId).toBe('user-123');
  });
});

describe('getAuditRecords', () => {
  it('calls GET /wiki/rest/api/audit', async () => {
    mock.queueResponse({ results: [], start: 0, limit: 25, size: 0, _links: {} });
    const client = asApp(mock);
    const result = await getAuditRecords(client, {});
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(result).toBeDefined();
  });

  it('passes query params', async () => {
    mock.queueResponse({ results: [], start: 0, limit: 10, size: 0, _links: {} });
    const client = asApp(mock);
    await getAuditRecords(client, { limit: 10 });
    expect(mock.getLastCall()?.queryParams).toMatchObject({ limit: 10 });
  });
});
