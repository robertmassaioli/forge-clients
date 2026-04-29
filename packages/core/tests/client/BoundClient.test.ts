import { describe, it, expect } from 'vitest';
import { asApp, asUser, asOfflineUser, withAuth } from '../../src/client/BoundClient.js';
import { MockForgeAdapter } from '../../src/test-utils/MockForgeAdapter.js';

const adapter = new MockForgeAdapter('jira');

describe('asApp', () => {
  it('creates a BoundClient with asApp auth context', () => {
    const client = asApp(adapter);
    expect(client.adapter).toBe(adapter);
    expect(client.authContext).toEqual({ type: 'asApp' });
  });

  it('returns a new object on each call', () => {
    const c1 = asApp(adapter);
    const c2 = asApp(adapter);
    expect(c1).not.toBe(c2);
  });
});

describe('asUser', () => {
  it('creates a BoundClient with asUser auth context (no userId)', () => {
    const client = asUser(adapter);
    expect(client.authContext).toEqual({ type: 'asUser' });
  });

  it('creates a BoundClient with asUser auth context (explicit userId)', () => {
    const client = asUser(adapter, 'user-123');
    expect(client.authContext).toEqual({ type: 'asUser', userId: 'user-123' });
  });
});

describe('asOfflineUser', () => {
  it('creates a BoundClient with offlineUser auth context', () => {
    const client = asOfflineUser(adapter, 'account-abc', 'access-token-xyz');
    expect(client.authContext).toEqual({
      type: 'offlineUser',
      accountId: 'account-abc',
      accessToken: 'access-token-xyz',
    });
  });
});

describe('withAuth', () => {
  it('creates a new BoundClient with a different auth context', () => {
    const appClient = asApp(adapter);
    const userClient = withAuth(appClient, { type: 'asUser', userId: 'u1' });
    expect(userClient.adapter).toBe(adapter);
    expect(userClient.authContext).toEqual({ type: 'asUser', userId: 'u1' });
    // Original unchanged
    expect(appClient.authContext).toEqual({ type: 'asApp' });
  });

  it('does not mutate the original BoundClient', () => {
    const original = asApp(adapter);
    withAuth(original, { type: 'asUser' });
    expect(original.authContext.type).toBe('asApp');
  });
});
