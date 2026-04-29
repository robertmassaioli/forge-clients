/**
 * Tests for representative generated Jira v3 client functions.
 * Covers one function per HTTP pattern to verify the function-to-adapter contract.
 * Uses MockForgeAdapter — no Forge runtime or network required.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter, asApp, asUser, NotFoundError, BadRequestError, ForgeApiError } from '@forge-clients/core';
import { getIssue, createIssue, deleteIssue, searchForIssuesUsingJqlPost } from '../v3/sdk.gen.js';

// ── Shared fixtures ────────────────────────────────────────────────────────

const ISSUE_DATA = {
  id: '10001',
  key: 'PROJ-1',
  fields: { summary: 'Test issue', status: { name: 'To Do' } },
};

const SEARCH_RESPONSE = {
  issues: [{ id: '1', key: 'PROJ-1', fields: {} }],
  total: 1,
  maxResults: 50,
  startAt: 0,
};

// ── getIssue — GET with path params ───────────────────────────────────────

describe('getIssue', () => {
  let mock: MockForgeAdapter;

  beforeEach(() => { mock = new MockForgeAdapter('jira'); });

  describe('path construction', () => {
    it('interpolates issueIdOrKey into path', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
      expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
    });

    it('works with numeric issue ID', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: '10001' } });
      expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/10001');
    });
  });

  it('uses GET method', async () => {
    mock.queueResponse(ISSUE_DATA);
    await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
    expect(mock.getLastCall()?.method).toBe('GET');
  });

  describe('query parameters', () => {
    it('passes fields query param', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' }, fields: ['summary', 'status'] as any });
      expect(mock.getLastCall()?.queryParams?.['fields']).toEqual(['summary', 'status']);
    });

    it('passes expand query param', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' }, expand: 'changelog,names' });
      expect(mock.getLastCall()?.queryParams?.['expand']).toBe('changelog,names');
    });

    it('optional params are undefined when not provided', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
      const qp = mock.getLastCall()?.queryParams;
      expect(qp?.['expand']).toBeUndefined();
      expect(qp?.['properties']).toBeUndefined();
    });
  });

  describe('auth context', () => {
    it('passes asApp auth context', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
      expect(mock.getLastCall()?.authContext).toEqual({ type: 'asApp' });
    });

    it('passes asUser auth context with userId', async () => {
      mock.queueResponse(ISSUE_DATA);
      await getIssue(asUser(mock, 'user-123'), { path: { issueIdOrKey: 'PROJ-1' } });
      expect(mock.getLastCall()?.authContext).toEqual({ type: 'asUser', userId: 'user-123' });
    });
  });

  describe('response handling', () => {
    it('returns parsed JSON on success', async () => {
      mock.queueResponse(ISSUE_DATA);
      const result = await getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
      expect(result.key).toBe('PROJ-1');
      expect(result.id).toBe('10001');
    });

    it('throws NotFoundError on 404', async () => {
      mock.queueErrorResponse(404, { errorMessages: ['Issue does not exist'] });
      await expect(
        getIssue(asApp(mock), { path: { issueIdOrKey: 'MISSING-1' } }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ForgeApiError on any non-ok response', async () => {
      mock.queueErrorResponse(500, { errorMessages: ['Server error'] });
      await expect(
        getIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } }),
      ).rejects.toBeInstanceOf(ForgeApiError);
    });
  });
});

// ── createIssue — POST with body ──────────────────────────────────────────

describe('createIssue', () => {
  let mock: MockForgeAdapter;

  beforeEach(() => { mock = new MockForgeAdapter('jira'); });

  it('uses POST method', async () => {
    mock.queueResponse({ id: '10002', key: 'PROJ-2', self: '' });
    await createIssue(asApp(mock), {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(mock.getLastCall()?.method).toBe('POST');
  });

  it('posts to /rest/api/3/issue', async () => {
    mock.queueResponse({ id: '10002', key: 'PROJ-2', self: '' });
    await createIssue(asApp(mock), {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue');
  });

  it('sends body with issue fields', async () => {
    mock.queueResponse({ id: '10002', key: 'PROJ-2', self: '' });
    const body = {
      fields: { project: { key: 'PROJ' }, summary: 'My issue', issuetype: { name: 'Bug' } },
    };
    await createIssue(asApp(mock), { body });
    expect(mock.getLastCall()?.body).toEqual(body);
  });

  it('returns the created issue key', async () => {
    mock.queueResponse({ id: '10003', key: 'PROJ-3', self: 'https://...' });
    const result = await createIssue(asApp(mock), {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(result.key).toBe('PROJ-3');
  });

  it('throws BadRequestError on 400', async () => {
    mock.queueErrorResponse(400, { errors: { summary: ['Field required'] }, errorMessages: [] });
    await expect(
      createIssue(asApp(mock), {
        body: { fields: { project: { key: 'PROJ' }, summary: '', issuetype: { name: 'Task' } } },
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

// ── deleteIssue — DELETE ─────────────────────────────────────────────────

describe('deleteIssue', () => {
  let mock: MockForgeAdapter;

  beforeEach(() => { mock = new MockForgeAdapter('jira'); });

  it('uses DELETE method', async () => {
    mock.queueNoContent();
    await deleteIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
    expect(mock.getLastCall()?.method).toBe('DELETE');
  });

  it('interpolates issue key into DELETE path', async () => {
    mock.queueNoContent();
    await deleteIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-99' } });
    expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-99');
  });

  it('resolves without throwing on 204', async () => {
    mock.queueNoContent();
    await expect(
      deleteIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } }),
    ).resolves.not.toThrow();
  });

  it('does not send a body', async () => {
    mock.queueNoContent();
    await deleteIssue(asApp(mock), { path: { issueIdOrKey: 'PROJ-1' } });
    expect(mock.getLastCall()?.body).toBeUndefined();
  });
});

// ── searchForIssuesUsingJqlPost — POST with body only ─────────────────────

describe('searchForIssuesUsingJqlPost', () => {
  let mock: MockForgeAdapter;

  beforeEach(() => { mock = new MockForgeAdapter('jira'); });

  it('posts to /rest/api/3/search', async () => {
    mock.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(asApp(mock), { body: { jql: 'project = PROJ' } });
    expect(mock.getLastCall()?.path).toBe('/rest/api/3/search');
  });

  it('uses POST method', async () => {
    mock.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(asApp(mock), { body: { jql: 'project = PROJ' } });
    expect(mock.getLastCall()?.method).toBe('POST');
  });

  it('sends full JQL body with optional fields', async () => {
    mock.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(asApp(mock), {
      body: { jql: 'project = PROJ ORDER BY created DESC', maxResults: 10, fields: ['summary'] },
    });
    expect(mock.getLastCall()?.body).toEqual({
      jql: 'project = PROJ ORDER BY created DESC',
      maxResults: 10,
      fields: ['summary'],
    });
  });

  it('returns issues array from search results', async () => {
    mock.queueResponse(SEARCH_RESPONSE);
    const result = await searchForIssuesUsingJqlPost(asApp(mock), { body: { jql: 'project = PROJ' } });
    expect(result.total).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues?.[0]?.key).toBe('PROJ-1');
  });

  it('has no query params (all params in body)', async () => {
    mock.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(asApp(mock), { body: { jql: 'project = PROJ' } });
    // searchForIssuesUsingJqlPost has no query params — verify none are sent
    const call = mock.getLastCall();
    expect(call?.queryParams).toBeUndefined();
  });
});
