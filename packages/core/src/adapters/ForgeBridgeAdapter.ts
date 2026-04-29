/**
 * Adapter for UI Kit 2 and Custom UI frontend contexts.
 *
 * Uses `@forge/bridge`'s `requestJira` / `requestConfluence` under the hood.
 * All calls are implicitly `asUser` (the logged-in user). `asApp` is **not**
 * available in this context — Forge Bridge only supports user-scoped requests.
 *
 * @example
 * ```typescript
 * import { ForgeBridgeAdapter, asUser } from '@forge-clients/core';
 * import { getMyself } from '@forge-clients/jira/v3';
 *
 * const adapter = new ForgeBridgeAdapter({ product: 'jira' });
 * const client = asUser(adapter);
 * const me = await getMyself(client);
 * ```
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

/**
 * Options for constructing a {@link ForgeBridgeAdapter}.
 */
export interface ForgeBridgeAdapterOptions {
  /** The Atlassian product to make requests to */
  product: 'jira' | 'confluence';
}

/**
 * Adapter for UI Kit 2 and Custom UI frontend contexts.
 * Uses `@forge/bridge` to route requests through the Forge runtime.
 * All requests are authenticated as the currently logged-in user.
 */
export class ForgeBridgeAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';

  /**
   * Create a new ForgeBridgeAdapter.
   * @param options - Configuration options including the target product
   */
  constructor(options: ForgeBridgeAdapterOptions) {
    this.product = options.product;
  }

  /**
   * Execute a request via `@forge/bridge` (requestJira or requestConfluence).
   * The request is automatically authenticated as the logged-in user.
   */
  async fetch(options: ForgeRequestOptions): Promise<Response> {
    const bridge = await import('@forge/bridge');
    const { method, path, queryParams, body, headers } = options;

    const fullPath = `${path}${buildQueryString(queryParams)}`;
    const requestFn = this.product === 'jira' ? bridge.requestJira : bridge.requestConfluence;

    return requestFn(fullPath, buildFetchInit(method, headers ?? {}, body)) as unknown as Response;
  }
}

function buildFetchInit(
  method: string,
  headers: Record<string, string>,
  body: unknown,
  extraHeaders?: Record<string, string>,
): RequestInit {
  const allHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers, ...extraHeaders };
  const base: RequestInit = { method, headers: allHeaders };
  if (body !== undefined) {
    return { ...base, body: JSON.stringify(body) };
  }
  return base;
}

function buildQueryString(
  params?: Record<string, unknown>,
): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)]);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}
