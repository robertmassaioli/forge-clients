# Testing Generated Client Functions

Tests for the generated functions in `@forge-clients/jira` and `@forge-clients/confluence`.
These are the easiest tests to write because the adapter is injected — just use `MockForgeAdapter`.

**Key principle:** Generated functions are pure adapter-call orchestration. They:
1. Build the URL path (with path param interpolation)
2. Collect query params into an object
3. Call `adapter.fetch({ method, path, queryParams, body, authContext })`
4. If `response.ok`, return `response.json()`
5. If `!response.ok`, call `ForgeApiError.fromResponse()` and throw

Test each of these concerns independently.

---

## Test File Location

```
packages/jira/src/__tests__/
  getIssue.test.ts
  createIssue.test.ts
  editIssue.test.ts
  deleteIssue.test.ts
  searchForIssuesUsingJqlPost.test.ts
  searchProjects.test.ts
  getCurrentUser.test.ts
  getFields.test.ts
  getIssuePickerResource.test.ts
  ... (one file per function, or grouped by resource)

packages/confluence/src/__tests__/
  getCurrentUser.test.ts
  searchByCQL.test.ts
  searchContentByCQL.test.ts
  ...
```

For the 1,500+ generated functions, we do not need a test for every single function.
Instead, write tests for **one representative function per pattern**. The patterns are:

| Pattern | Representative Function | Key Things to Test |
|---|---|---|
| GET, no params | `getCurrentUser` | Default asApp context, JSON return |
| GET, path params | `getIssue` | Path interpolation |
| GET, query params | `searchProjects` | Query serialization |
| GET, path + query params | `getIssue` with fields | Both combined |
| POST with body | `createIssue` | Body serialization, POST method |
| PUT with body | `editIssue` | Body + path param |
| DELETE | `deleteIssue` | 204 No Content handling |
| Complex query (many params) | `searchForIssuesUsingJqlPost` | Many optional params |
| Undefined params omitted | any GET with optional params | Undefined not sent |

---

## Shared Test Setup

```typescript
// packages/jira/src/__tests__/setup.ts
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { beforeEach } from 'vitest';

// Export a factory so each test file gets a fresh adapter
export function makeAdapter() {
  return new MockForgeAdapter('jira');
}
```

---

## 4.1 GET with Path Parameters — getIssue

```typescript
// packages/jira/src/__tests__/getIssue.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { ForgeApiError, ForgeApiNotFoundError } from '@forge-clients/core';
import { getIssue } from '../v3/sdk.gen.js';

const ISSUE_DATA = {
  id: '10001',
  key: 'PROJ-1',
  fields: {
    summary: 'Test issue',
    status: { name: 'To Do' },
    assignee: null,
  },
};

describe('getIssue', () => {
  let adapter: MockForgeAdapter;

  beforeEach(() => {
    adapter = new MockForgeAdapter('jira');
  });

  describe('path construction', () => {
    it('interpolates issueIdOrKey into path', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
      expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
    });

    it('uses issue ID in path when ID provided', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: '10001' } });
      expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue/10001');
    });
  });

  describe('HTTP method', () => {
    it('uses GET method', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
      expect(adapter.getLastCall()?.method).toBe('GET');
    });
  });

  describe('query parameters', () => {
    it('passes fields array as query param', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, {
        path: { issueIdOrKey: 'PROJ-1' },
        fields: ['summary', 'status', 'assignee'],
      });
      expect(adapter.getLastCall()?.queryParams?.fields).toEqual(['summary', 'status', 'assignee']);
    });

    it('passes expand as query param', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, {
        path: { issueIdOrKey: 'PROJ-1' },
        expand: 'changelog,names',
      });
      expect(adapter.getLastCall()?.queryParams?.expand).toBe('changelog,names');
    });

    it('does not include undefined optional params', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
      const params = adapter.getLastCall()?.queryParams;
      // All optional params should be undefined (not included or explicitly undefined)
      expect(params?.expand).toBeUndefined();
      expect(params?.properties).toBeUndefined();
    });
  });

  describe('auth context', () => {
    it('defaults to asApp context', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
      expect(adapter.getLastCall()?.authContext).toEqual({ type: 'asApp' });
    });

    it('passes asUser context through', async () => {
      adapter.queueResponse(ISSUE_DATA);
      await getIssue(adapter, { type: 'asUser', userId: 'user-123' }, { path: { issueIdOrKey: 'PROJ-1' } });
      expect(adapter.getLastCall()?.authContext).toEqual({ type: 'asUser', userId: 'user-123' });
    });
  });

  describe('response handling', () => {
    it('returns parsed JSON on success', async () => {
      adapter.queueResponse(ISSUE_DATA);
      const result = await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
      expect(result.key).toBe('PROJ-1');
      expect(result.id).toBe('10001');
    });

    it('throws ForgeApiNotFoundError on 404', async () => {
      adapter.queueErrorResponse({ errorMessages: ['Issue does not exist'] }, 404);
      await expect(
        getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'MISSING-1' } }),
      ).rejects.toThrow(ForgeApiNotFoundError);
    });

    it('throws ForgeApiError on any non-ok response', async () => {
      adapter.queueErrorResponse({ errorMessages: ['Server error'] }, 500);
      await expect(
        getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } }),
      ).rejects.toThrow(ForgeApiError);
    });
  });
});
```

---

## 4.2 POST with Body — createIssue

```typescript
// packages/jira/src/__tests__/createIssue.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { ForgeApiBadRequestError } from '@forge-clients/core';
import { createIssue } from '../v3/sdk.gen.js';

describe('createIssue', () => {
  let adapter: MockForgeAdapter;

  beforeEach(() => {
    adapter = new MockForgeAdapter('jira');
  });

  it('uses POST method', async () => {
    adapter.queueResponse({ id: '10002', key: 'PROJ-2' });
    await createIssue(adapter, { type: 'asApp' }, {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(adapter.getLastCall()?.method).toBe('POST');
  });

  it('posts to /rest/api/3/issue', async () => {
    adapter.queueResponse({ id: '10002', key: 'PROJ-2' });
    await createIssue(adapter, { type: 'asApp' }, {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue');
  });

  it('sends body with issue fields', async () => {
    adapter.queueResponse({ id: '10002', key: 'PROJ-2' });
    const body = {
      fields: {
        project: { key: 'PROJ' },
        summary: 'Test issue title',
        issuetype: { name: 'Bug' },
        description: { type: 'doc', version: 1, content: [] },
      },
    };
    await createIssue(adapter, { type: 'asApp' }, { body });
    expect(adapter.getLastCall()?.body).toEqual(body);
  });

  it('returns created issue key', async () => {
    adapter.queueResponse({ id: '10003', key: 'PROJ-3', self: 'https://...' });
    const result = await createIssue(adapter, { type: 'asApp' }, {
      body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
    });
    expect(result.key).toBe('PROJ-3');
  });

  it('throws ForgeApiBadRequestError on 400', async () => {
    adapter.queueErrorResponse({ errors: { summary: ['Field required'] } }, 400);
    await expect(
      createIssue(adapter, { type: 'asApp' }, {
        body: { fields: { project: { key: 'PROJ' }, summary: '', issuetype: { name: 'Task' } } },
      }),
    ).rejects.toThrow(ForgeApiBadRequestError);
  });
});
```

---

## 4.3 DELETE — deleteIssue

```typescript
// packages/jira/src/__tests__/deleteIssue.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { deleteIssue } from '../v3/sdk.gen.js';

describe('deleteIssue', () => {
  let adapter: MockForgeAdapter;

  beforeEach(() => {
    adapter = new MockForgeAdapter('jira');
  });

  it('uses DELETE method', async () => {
    adapter.queueNoContent();
    await deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
    expect(adapter.getLastCall()?.method).toBe('DELETE');
  });

  it('interpolates issue key into DELETE path', async () => {
    adapter.queueNoContent();
    await deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-99' } });
    expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-99');
  });

  it('resolves without throwing on 204', async () => {
    adapter.queueNoContent();
    await expect(
      deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } }),
    ).resolves.not.toThrow();
  });

  it('does not send a body', async () => {
    adapter.queueNoContent();
    await deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
    expect(adapter.getLastCall()?.body).toBeUndefined();
  });
});
```

---

## 4.4 Complex Query — searchForIssuesUsingJqlPost

```typescript
// packages/jira/src/__tests__/searchForIssuesUsingJqlPost.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { searchForIssuesUsingJqlPost } from '../v3/sdk.gen.js';

describe('searchForIssuesUsingJqlPost', () => {
  let adapter: MockForgeAdapter;

  beforeEach(() => {
    adapter = new MockForgeAdapter('jira');
  });

  const SEARCH_RESPONSE = {
    issues: [{ id: '1', key: 'PROJ-1', fields: {} }],
    total: 1,
    maxResults: 50,
    startAt: 0,
  };

  it('posts to /rest/api/3/search/jql', async () => {
    adapter.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
      body: { jql: 'project = PROJ' },
    });
    expect(adapter.getLastCall()?.path).toBe('/rest/api/3/search/jql');
  });

  it('sends JQL body with maxResults', async () => {
    adapter.queueResponse(SEARCH_RESPONSE);
    await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
      body: { jql: 'project = PROJ ORDER BY created DESC', maxResults: 10, fields: ['summary'] },
    });
    expect(adapter.getLastCall()?.body).toEqual({
      jql: 'project = PROJ ORDER BY created DESC',
      maxResults: 10,
      fields: ['summary'],
    });
  });

  it('returns search results', async () => {
    adapter.queueResponse(SEARCH_RESPONSE);
    const result = await searchForIssuesUsingJqlPost(adapter, { type: 'asApp' }, {
      body: { jql: 'project = PROJ' },
    });
    expect(result.total).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues?.[0]?.key).toBe('PROJ-1');
  });
});
```

---

## What NOT to Test in Generated Functions

Generated functions do NOT need tests for:

1. **That `assumeTrustedRoute` is called** — the adapter handles this; it's tested in `ForgeFunctionAdapter.test.ts`
2. **That auth tokens are refreshed** — `OfflineTokenManager` is tested separately
3. **That the real Jira API returns the right shape** — tested by the closed-loop tester
4. **Every one of the 1,500+ functions** — test one per pattern, trust the generator

The goal is to verify the **function-to-adapter contract**, not the adapter's internals
or the Forge runtime's behaviour.
