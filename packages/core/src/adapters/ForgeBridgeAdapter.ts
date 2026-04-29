/**
 * Adapter for UI Kit 2 and Custom UI frontend contexts.
 * Uses @forge/bridge's requestJira / requestConfluence.
 * All calls are implicitly asUser (the logged-in user). asApp is NOT available here.
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeBridgeAdapterOptions {
  product: 'jira' | 'confluence';
}

export class ForgeBridgeAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';

  constructor(options: ForgeBridgeAdapterOptions) {
    this.product = options.product;
  }

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
