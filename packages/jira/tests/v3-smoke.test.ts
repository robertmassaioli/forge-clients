/**
 * Smoke tests for @forge-clients/jira v3 generated functions.
 * Tests use MockForgeAdapter — no network, no Forge runtime required.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter, asApp } from '@forge-clients/core';
import {
  getCurrentUser,
  getIssue,
  createIssue,
  deleteIssue,
  searchProjects,
  getFields,
} from '@forge-clients/jira';

let mock: MockForgeAdapter;

beforeEach(() => {
  mock = new MockForgeAdapter('jira');
});

describe('getCurrentUser', () => {
  it('calls GET /rest/api/3/myself', async () => {
    mock.queueResponse({ accountId: 'user-123', displayName: 'Test User' });
    const client = asApp(mock);
    const result = await getCurrentUser(client, {});
    expect(mock.getLastCall()?.path).toContain('/myself');
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(result.accountId).toBe('user-123');
  });
});

describe('getIssue', () => {
  it('calls GET /rest/api/3/issue/{issueIdOrKey}', async () => {
    mock.queueResponse({ id: '10001', key: 'PROJ-1', fields: {} });
    const client = asApp(mock);
    const result = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
    expect(mock.getLastCall()?.path).toContain('PROJ-1');
    expect(mock.getLastCall()?.method).toBe('GET');
    expect(result.key).toBe('PROJ-1');
  });

  it('passes expand query param', async () => {
    mock.queueResponse({ id: '10001', key: 'PROJ-1', fields: {} });
    const client = asApp(mock);
    await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' }, expand: 'renderedFields' });
    expect(mock.getLastCall()?.queryParams).toMatchObject({ expand: 'renderedFields' });
  });
});

describe('createIssue', () => {
  it('calls POST /rest/api/3/issue with body', async () => {
    mock.queueResponse({ id: '10002', key: 'PROJ-2' });
    const client = asApp(mock);
    const body = { fields: { summary: 'Test issue', project: { key: 'PROJ' }, issuetype: { name: 'Task' } } };
    const result = await createIssue(client, { body });
    expect(mock.getLastCall()?.method).toBe('POST');
    expect(mock.getLastCall()?.body).toEqual(body);
    expect(result.key).toBe('PROJ-2');
  });
});

describe('deleteIssue', () => {
  it('calls DELETE /rest/api/3/issue/{issueIdOrKey}', async () => {
    mock.queueNoContent();
    const client = asApp(mock);
    await deleteIssue(client, { path: { issueIdOrKey: 'PROJ-3' } });
    expect(mock.getLastCall()?.method).toBe('DELETE');
    expect(mock.getLastCall()?.path).toContain('PROJ-3');
  });
});

describe('searchProjects', () => {
  it('calls GET /rest/api/3/project/search', async () => {
    mock.queueResponse({ values: [], total: 0, isLast: true });
    const client = asApp(mock);
    await searchProjects(client, { maxResults: 10 });
    expect(mock.getLastCall()?.path).toContain('project/search');
    expect(mock.getLastCall()?.queryParams).toMatchObject({ maxResults: 10 });
  });
});

describe('getFields', () => {
  it('calls GET /rest/api/3/field', async () => {
    mock.queueResponse([{ id: 'summary', name: 'Summary', custom: false }]);
    const client = asApp(mock);
    const result = await getFields(client);
    expect(Array.isArray(result)).toBe(true);
    expect(mock.getLastCall()?.path).toContain('/field');
  });
});

describe('auth context propagation', () => {
  it('asUser client passes asUser auth context', async () => {
    mock.queueResponse({ accountId: 'u1' });
    const { asUser } = await import('@forge-clients/core');
    const client = asUser(mock, 'u1');
    await getCurrentUser(client, {});
    expect(mock.getLastCall()?.authContext).toEqual({ type: 'asUser', userId: 'u1' });
  });
});
