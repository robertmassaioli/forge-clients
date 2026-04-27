/**
 * Adapter for Forge Functions (serverless backend).
 * Uses @forge/api's requestJira / requestConfluence — handles Forge auth automatically.
 * NOT available in Forge Containers — use ForgeContainerAdapter there.
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeFunctionAdapterOptions {
  product: 'jira' | 'confluence';
  /** Default auth context for all requests. Default: asApp */
  defaultContext?: 'asApp' | 'asUser';
}

export class ForgeFunctionAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly defaultContext: 'asApp' | 'asUser';

  constructor(options: ForgeFunctionAdapterOptions) {
    this.product = options.product;
    this.defaultContext = options.defaultContext ?? 'asApp';
  }

  async fetch(options: ForgeRequestOptions): Promise<Response> {
    // Dynamic import: @forge/api only available inside Forge runtime
    const { default: api, route } = await import('@forge/api');
    const { method, path, queryParams, body, headers, authContext } = options;

    const fullPath = `${path}${buildQueryString(queryParams)}`;

    const useAsUser =
      authContext.type === 'asUser' ||
      (authContext.type === 'asApp' && this.defaultContext === 'asUser');

    const userId =
      authContext.type === 'asUser' && 'userId' in authContext
        ? authContext.userId
        : undefined;

    const forgeCtx = useAsUser ? api.asUser(userId) : api.asApp();
    const requestFn = this.product === 'jira'
      ? forgeCtx.requestJira.bind(forgeCtx)
      : forgeCtx.requestConfluence.bind(forgeCtx);

    const allHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    // @forge/api RequestInit does NOT accept null for body — omit when no body
    const init = body !== undefined
      ? { method, headers: allHeaders, body: JSON.stringify(body) }
      : { method, headers: allHeaders };

    return requestFn(route`${fullPath}`, init) as unknown as Response;
  }
}

function buildQueryString(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter((e): e is [string, string | number | boolean] => e[1] !== undefined)
    .map(([k, v]) => [k, String(v)]);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}
