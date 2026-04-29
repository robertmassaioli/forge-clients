/**
 * Adapter for Forge Container backends.
 *
 * A Forge Container is a long-running Docker-based process managed by Forge.
 * It communicates with Atlassian REST APIs exclusively through the Forge egress
 * proxy at `FORGE_EGRESS_PROXY_URL`. This is the **only** supported way to make
 * API calls from a Forge Container.
 *
 * Unlike {@link ForgeFunctionAdapter}, Forge Container processes must obtain their
 * `installationId` themselves at startup by calling `GET <proxyUrl>/v0/installations`.
 *
 * @example
 * ```typescript
 * import { ForgeContainerAdapter, asApp } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * const adapter = new ForgeContainerAdapter({
 *   product: 'jira',
 *   proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
 *   installationId: myInstallationId,
 * });
 * const client = asApp(adapter);
 * const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
 * ```
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

/**
 * Options for constructing a {@link ForgeContainerAdapter}.
 */
export interface ForgeContainerAdapterOptions {
  /** The Atlassian product to make requests to */
  product: 'jira' | 'confluence';
  /**
   * The Forge egress proxy URL.
   * Read from `process.env.FORGE_EGRESS_PROXY_URL` in the Forge Container runtime.
   */
  proxyUrl: string;
  /**
   * The installation ID for this app installation.
   * Obtained at startup by calling `GET <proxyUrl>/v0/installations`.
   */
  installationId: string;
}

/**
 * Adapter for Forge Container backends.
 * Routes requests through the Forge egress proxy using `forge-proxy-authorization` headers.
 */
export class ForgeContainerAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly proxyUrl: string;
  private readonly installationId: string;

  /**
   * Create a new ForgeContainerAdapter.
   * @param options - Configuration including product, proxy URL, and installation ID
   */
  constructor(options: ForgeContainerAdapterOptions) {
    this.product = options.product;
    this.proxyUrl = options.proxyUrl.replace(/\/$/, '');
    this.installationId = options.installationId;
  }

  /**
   * Execute a request through the Forge egress proxy.
   * Injects the appropriate `forge-proxy-authorization` header based on the auth context.
   */
  async fetch(options: ForgeRequestOptions): Promise<Response> {
    const { method, path, queryParams, body, headers, authContext } = options;

    const productPrefix = this.product === 'jira' ? '/jira' : '/confluence';
    const url = `${this.proxyUrl}${productPrefix}${path}${buildQueryString(queryParams)}`;

    const extraHeaders: Record<string, string> = {};
    let proxyAuth: string;

    switch (authContext.type) {
      case 'asApp':
        proxyAuth = `Forge as=app,installationId=${this.installationId}`;
        break;
      case 'asUser':
        proxyAuth = `Forge as=user,accountId=${authContext.userId ?? ''},installationId=${this.installationId}`;
        break;
      case 'offlineUser':
        proxyAuth = `Forge as=user,accountId=${authContext.accountId},installationId=${this.installationId}`;
        extraHeaders['Authorization'] = `Bearer ${authContext.accessToken}`;
        break;
    }

    extraHeaders['forge-proxy-authorization'] = proxyAuth;

    return fetch(url, buildFetchInit(method, { ...headers, ...extraHeaders }, body));
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
