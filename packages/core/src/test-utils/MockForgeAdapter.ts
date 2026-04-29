/**
 * MockForgeAdapter — a test double for ForgeAdapter.
 *
 * Records all calls to fetch() and returns configurable responses from a queue.
 * This is the primary tool for unit testing all generated client functions
 * without a real Forge runtime or network connection.
 *
 * @example
 * const mock = new MockForgeAdapter('jira');
 * mock.queueResponse({ id: '123', key: 'PROJ-1', fields: {} });
 *
 * const client = asApp(mock);
 * const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
 *
 * expect(mock.callCount).toBe(1);
 * expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
 */

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
 * A test double for {@link ForgeAdapter} that records all calls and returns
 * configurable responses from a FIFO queue.
 *
 * This is the primary tool for unit testing generated client functions
 * without a real Forge runtime or network connection.
 *
 * Responses are dequeued in the order they were queued. If the queue is empty,
 * a default `200 OK` with `{}` body is returned. Errors queued via
 * `queueThrow()` are thrown before checking the response queue.
 *
 * @example
 * ```typescript
 * import { MockForgeAdapter, asApp } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * const mock = new MockForgeAdapter('jira');
 * mock.queueResponse({ id: '123', key: 'PROJ-1', fields: {} });
 *
 * const client = asApp(mock);
 * const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
 *
 * expect(mock.callCount).toBe(1);
 * expect(mock.getLastCall()?.path).toBe('/rest/api/3/issue/PROJ-1');
 * ```
 */
export class MockForgeAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';

  private calls: RecordedCall[] = [];
  private responseQueue: Response[] = [];
  private errorQueue: Error[] = [];

  /**
   * Create a new MockForgeAdapter.
   * @param product - The Atlassian product to simulate (default: `'jira'`)
   */
  constructor(product: 'jira' | 'confluence' = 'jira') {
    this.product = product;
  }

  async fetch(options: ForgeRequestOptions): Promise<Response> {
    const call: RecordedCall = {
      method: options.method,
      path: options.path,
      authContext: options.authContext,
    };
    if (options.queryParams !== undefined) call.queryParams = options.queryParams;
    if (options.body !== undefined) call.body = options.body;
    if (options.headers !== undefined) call.headers = options.headers;
    this.calls.push(call);

    if (this.errorQueue.length > 0) {
      throw this.errorQueue.shift()!;
    }

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

  /** Returns a copy of all recorded calls in the order they were made */
  getCalls(): RecordedCall[] { return [...this.calls]; }
  /** Returns the most recent recorded call, or `undefined` if no calls have been made */
  getLastCall(): RecordedCall | undefined { return this.calls.at(-1); }
  /** Returns the recorded call at the given zero-based index, or `undefined` if out of range */
  getCall(index: number): RecordedCall | undefined { return this.calls[index]; }
  /** The total number of calls made to `fetch()` since the last `reset()` */
  get callCount(): number { return this.calls.length; }

  /** Reset all recorded calls and queued responses */
  reset(): this {
    this.calls = [];
    this.responseQueue = [];
    this.errorQueue = [];
    return this;
  }

  // ── Response configuration ────────────────────────────────────────────────

  /** Queue a successful JSON response (FIFO order) */
  queueResponse(body: unknown, status: number = 200): this {
    this.responseQueue.push(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
    return this;
  }

  /** Queue a non-2xx error response */
  queueErrorResponse(status: number, body: unknown = {}): this {
    this.responseQueue.push(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
    return this;
  }

  /** Queue a 204 No Content response */
  queueNoContent(): this {
    this.responseQueue.push(new Response(null, { status: 204 }));
    return this;
  }

  /** Queue a network-level error (fetch throws, no Response) */
  queueThrow(error: Error = new Error('Network error')): this {
    this.errorQueue.push(error);
    return this;
  }
}
