# The MockForgeAdapter Pattern

The single most important testing utility in the `@forge-clients` test suite.

Because every generated function receives its adapter as a parameter (dependency
injection), all generated function tests can be written without mocking any Forge
internals at all — just pass a `MockForgeAdapter` that records calls and returns
configurable responses.

---

## Implementation

Place this file at `packages/core/src/test-utils/MockForgeAdapter.ts` and export it
from `@forge-clients/core`:

```typescript
// packages/core/src/test-utils/MockForgeAdapter.ts

import type { ForgeAdapter, ForgeRequestOptions } from '../adapters/ForgeAdapter.js';

/** A recorded call to adapter.fetch() */
export interface RecordedCall {
  method: string;
  path: string;
  queryParams?: Record<string, unknown>;
  body?: unknown;
  authContext: unknown;
  headers?: Record<string, string>;
}

/**
 * A test double for ForgeAdapter.
 *
 * Records all calls to fetch() and returns configurable responses from a queue.
 * Use this in unit tests for all generated client functions.
 *
 * @example
 * const adapter = new MockForgeAdapter('jira');
 * adapter.queueResponse({ id: '123', key: 'PROJ-1' });
 * const issue = await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } });
 * expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
 */
export class MockForgeAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';

  private calls: RecordedCall[] = [];
  private responseQueue: Response[] = [];
  private errorQueue: Error[] = [];

  constructor(product: 'jira' | 'confluence' = 'jira') {
    this.product = product;
  }

  async fetch(options: ForgeRequestOptions): Promise<Response> {
    // Record every call
    this.calls.push({
      method: options.method,
      path: options.path,
      queryParams: options.queryParams,
      body: options.body,
      authContext: options.authContext,
      headers: options.headers,
    });

    // Throw if an error is queued
    if (this.errorQueue.length > 0) {
      throw this.errorQueue.shift()!;
    }

    // Return next queued response
    if (this.responseQueue.length > 0) {
      return this.responseQueue.shift()!;
    }

    // Default: 200 OK with empty JSON object
    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // ── Query helpers ─────────────────────────────────────────────────────────

  /** All recorded calls in order */
  getCalls(): RecordedCall[] {
    return [...this.calls];
  }

  /** The most recent call, or undefined if no calls made */
  getLastCall(): RecordedCall | undefined {
    return this.calls.at(-1);
  }

  /** The nth call (0-indexed) */
  getCall(index: number): RecordedCall | undefined {
    return this.calls[index];
  }

  /** Total number of fetch() invocations */
  get callCount(): number {
    return this.calls.length;
  }

  // ── Response configuration ────────────────────────────────────────────────

  /**
   * Queue a successful JSON response.
   * Responses are returned in FIFO order. If the queue is empty, returns 200 {}.
   */
  queueResponse(body: unknown, status: number = 200): this {
    this.responseQueue.push(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
    return this;
  }

  /**
   * Queue an error response (non-ok HTTP status).
   * The generated function will call ForgeApiError.fromResponse() and throw.
   */
  queueErrorResponse(body: unknown, status: number): this {
    this.responseQueue.push(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
    return this;
  }

  /**
   * Queue a thrown Error (network failure, not an HTTP error).
   * The generated function will see this as an unhandled rejection.
   */
  queueThrow(error: Error): this {
    this.errorQueue.push(error);
    return this;
  }

  /**
   * Queue a 204 No Content response (for DELETE endpoints).
   */
  queueNoContent(): this {
    this.responseQueue.push(new Response(null, { status: 204 }));
    return this;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  /** Clear all recorded calls and queued responses/errors */
  reset(): this {
    this.calls = [];
    this.responseQueue = [];
    this.errorQueue = [];
    return this;
  }
}
```

---

## Export from @forge-clients/core

Add to `packages/core/src/index.ts` (under a conditional that only exports in test environments, OR simply export from a separate `test-utils` entry point):

```typescript
// packages/core/package.json — add test-utils export
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./test-utils": {
      "import": "./dist/test-utils/index.js",
      "require": "./dist/test-utils/index.cjs"
    }
  }
}

// packages/core/src/test-utils/index.ts
export { MockForgeAdapter } from './MockForgeAdapter.js';
export type { RecordedCall } from './MockForgeAdapter.js';
```

---

## Usage Patterns

### Pattern 1: Simple GET — assert path and return value

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MockForgeAdapter } from '@forge-clients/core/test-utils';
import { getIssue } from '@forge-clients/jira';

describe('getIssue', () => {
  let adapter: MockForgeAdapter;

  beforeEach(() => {
    adapter = new MockForgeAdapter('jira');
  });

  it('calls the correct endpoint', async () => {
    adapter.queueResponse({ id: '10001', key: 'PROJ-1', fields: {} });

    await getIssue(adapter, { type: 'asApp' }, {
      path: { issueIdOrKey: 'PROJ-1' },
    });

    expect(adapter.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
    expect(adapter.getLastCall()?.method).toBe('GET');
  });

  it('returns parsed JSON', async () => {
    const issueData = { id: '10001', key: 'PROJ-1', fields: { summary: 'My issue' } };
    adapter.queueResponse(issueData);

    const result = await getIssue(adapter, { type: 'asApp' }, {
      path: { issueIdOrKey: 'PROJ-1' },
    });

    expect(result.key).toBe('PROJ-1');
    expect(result.fields?.summary).toBe('My issue');
  });
});
```

### Pattern 2: POST — assert body serialization

```typescript
it('sends body as JSON', async () => {
  adapter.queueResponse({ id: '10002', key: 'PROJ-2' });

  await createIssue(adapter, { type: 'asApp' }, {
    body: {
      fields: {
        project: { key: 'PROJ' },
        summary: 'Test issue',
        issuetype: { name: 'Task' },
      },
    },
  });

  const call = adapter.getLastCall();
  expect(call?.method).toBe('POST');
  expect(call?.body).toEqual({
    fields: {
      project: { key: 'PROJ' },
      summary: 'Test issue',
      issuetype: { name: 'Task' },
    },
  });
});
```

### Pattern 3: Query parameters — assert serialization

```typescript
it('passes query parameters', async () => {
  adapter.queueResponse({ id: '10001', key: 'PROJ-1' });

  await getIssue(adapter, { type: 'asApp' }, {
    path: { issueIdOrKey: 'PROJ-1' },
    fields: ['summary', 'description'],
    expand: 'changelog',
  });

  const call = adapter.getLastCall();
  expect(call?.queryParams?.fields).toEqual(['summary', 'description']);
  expect(call?.queryParams?.expand).toBe('changelog');
});
```

### Pattern 4: Error propagation — assert ForgeApiError is thrown

```typescript
import { ForgeApiError } from '@forge-clients/core';

it('throws ForgeApiError on 404', async () => {
  adapter.queueErrorResponse(
    { errorMessages: ['Issue does not exist or you do not have permission'] },
    404,
  );

  await expect(
    getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-MISSING' } }),
  ).rejects.toThrow(ForgeApiError);
});
```

### Pattern 5: Auth context — assert it is passed through

```typescript
it('passes asUser auth context to adapter', async () => {
  adapter.queueResponse({ id: '10001', key: 'PROJ-1' });

  await getIssue(
    adapter,
    { type: 'asUser', userId: '5b10a2844c20165700ede21g' },
    { path: { issueIdOrKey: 'PROJ-1' } },
  );

  expect(adapter.getLastCall()?.authContext).toEqual({
    type: 'asUser',
    userId: '5b10a2844c20165700ede21g',
  });
});
```

### Pattern 6: DELETE — 204 No Content

```typescript
it('handles 204 No Content for DELETE', async () => {
  adapter.queueNoContent();

  // Should not throw
  await expect(
    deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: 'PROJ-1' } }),
  ).resolves.toBeUndefined();
});
```

### Pattern 7: Multiple calls — for multi-step operations

```typescript
it('handles issue lifecycle: create, get, delete', async () => {
  adapter
    .queueResponse({ id: '10001', key: 'PROJ-1' })  // createIssue response
    .queueResponse({ id: '10001', key: 'PROJ-1', fields: {} })  // getIssue response
    .queueNoContent();  // deleteIssue response

  const created = await createIssue(adapter, { type: 'asApp' }, {
    body: { fields: { project: { key: 'PROJ' }, summary: 'Test', issuetype: { name: 'Task' } } },
  });
  await getIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: created.key! } });
  await deleteIssue(adapter, { type: 'asApp' }, { path: { issueIdOrKey: created.key! } });

  expect(adapter.callCount).toBe(3);
  expect(adapter.getCall(0)?.method).toBe('POST');
  expect(adapter.getCall(1)?.method).toBe('GET');
  expect(adapter.getCall(2)?.method).toBe('DELETE');
});
```

---

## What MockForgeAdapter Does NOT Test

`MockForgeAdapter` is intentionally minimal. It does NOT test:

- That Forge authentication actually works (`ForgeFunctionAdapter` tests cover that)
- That the Forge runtime is available
- That the real Jira/Confluence APIs return the expected shapes (closed-loop tester covers that)
- That `assumeTrustedRoute` is called correctly

This is intentional — the mock adapter tests function correctness at the HTTP interface
boundary, while the adapter tests cover the Forge-specific transport layer.
