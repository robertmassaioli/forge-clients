/**
 * Adapter for Forge Functions (serverless backend).
 *
 * Uses @forge/api's requestJira / requestConfluence methods,
 * which handle all Forge authentication automatically.
 *
 * NOT available in Forge Containers — use ForgeContainerAdapter there.
 *
 * Authentication note:
 * Uses assumeTrustedRoute rather than route tagged template literal because the
 * path comes from generated code (compile-time constants), never from user input.
 * Path manipulation is not a concern here — the security benefit of route`` does
 * not apply to generated client paths.
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

/**
 * Options for constructing a {@link ForgeFunctionAdapter}.
 */
export interface ForgeFunctionAdapterOptions {
  /** The Atlassian product to make requests to */
  product: 'jira' | 'confluence';
  /**
   * Default auth context used when the request does not explicitly specify one.
   * @defaultValue `'asApp'`
   */
  defaultContext?: 'asApp' | 'asUser';
}

/**
 * Adapter for Forge Functions (serverless backend).
 *
 * Uses `@forge/api`'s `requestJira` / `requestConfluence` methods, which handle
 * all Forge authentication automatically. This is the most common adapter for
 * backend Forge apps.
 *
 * **Not available in Forge Containers** — use {@link ForgeContainerAdapter} there.
 *
 * @example
 * ```typescript
 * import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * const adapter = new ForgeFunctionAdapter({ product: 'jira' });
 *
 * const appClient = asApp(adapter);
 * const issue = await getIssue(appClient, { path: { issueIdOrKey: 'PROJ-1' } });
 *
 * const userClient = asUser(adapter);
 * const me = await getMyself(userClient);
 * ```
 */
export class ForgeFunctionAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly defaultContext: 'asApp' | 'asUser';

  /**
   * Create a new ForgeFunctionAdapter.
   * @param options - Configuration including the target product and optional default auth context
   */
  constructor(options: ForgeFunctionAdapterOptions) {
    this.product = options.product;
    this.defaultContext = options.defaultContext ?? 'asApp';
  }

  /**
   * Execute a request via `@forge/api` (requestJira or requestConfluence).
   * Authentication is handled automatically by the Forge runtime.
   */
  async fetch(options: ForgeRequestOptions): Promise<Response> {
    // Dynamic import: @forge/api only available inside Forge runtime
    const { default: api, assumeTrustedRoute } = await import('@forge/api');
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

    const init = body !== undefined
      ? { method, headers: allHeaders, body: JSON.stringify(body) }
      : { method, headers: allHeaders };

    return requestFn(assumeTrustedRoute(fullPath), init) as unknown as Response;
  }
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
