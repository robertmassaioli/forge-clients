/**
 * Adapter for Forge Remote backends.
 *
 * A Forge Remote is an externally hosted service (your own server, AWS Lambda,
 * Cloud Run, etc.) that Forge calls via a declared `remote` module in manifest.yml.
 * Unlike Forge Containers (which are long-running processes that discover their
 * installation via GET /v0/installations), a Forge Remote receives the
 * installationId and appSystemToken directly in every inbound invocation payload.
 *
 * ## Key Differences from ForgeContainerAdapter
 *
 * | Concern            | ForgeContainerAdapter         | ForgeRemoteAdapter                |
 * |--------------------|-------------------------------|-----------------------------------|
 * | Installation ID    | Fetched via GET /v0/installations | Provided in invocation payload |
 * | appSystemToken     | Not needed (Container identity)   | Provided in invocation payload |
 * | Lifecycle          | Long-running process              | Stateless per-invocation handler  |
 * | Offline tokens     | OfflineTokenManager (with cache)  | ForgeRemoteTokenManager (with TTL)|
 *
 * ## Usage
 *
 * ```typescript
 * import { ForgeRemoteAdapter, adapterFromForgePayload } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * // In your Forge Remote handler:
 * export async function handler(payload: ForgeInvocationPayload) {
 *   // Simple one-liner factory:
 *   const client = adapterFromForgePayload(payload, 'jira');
 *
 *   // Or with explicit options:
 *   const client = new ForgeRemoteAdapter({
 *     product: 'jira',
 *     proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
 *     installationId: payload.installationId,
 *     appSystemToken: payload.appSystemToken,
 *   });
 *
 *   const issue = await getIssue(client, { issueIdOrKey: 'PROJ-123' });
 *   return issue;
 * }
 * ```
 *
 * ## Open Questions
 *
 * The exact format of `forge-proxy-authorization` for Remotes (specifically whether
 * `appSystemToken` is embedded in the header or validated out-of-band) is subject
 * to real-world verification. See forge-remote-adapter.md in ai-planning/ for the
 * full list of open questions.
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeRemoteAdapterOptions {
  /** Which Atlassian product to make requests to */
  product: 'jira' | 'confluence';

  /**
   * The Forge egress proxy URL.
   * In a Forge Remote, this is available via the environment variable
   * FORGE_EGRESS_PROXY_URL injected by the Forge runtime into the invocation.
   */
  proxyUrl: string;

  /**
   * The installation ID for this app installation.
   * Provided in every Forge Remote invocation payload as `installationId`.
   */
  installationId: string;

  /**
   * The app system token for this invocation.
   * Provided in every Forge Remote invocation payload as `appSystemToken`.
   * Used in the `forge-proxy-authorization` header for asApp requests.
   */
  appSystemToken: string;

}

/**
 * Adapter for Forge Remote backends.
 *
 * A Forge Remote is a stateless, externally-hosted service (your own server,
 * AWS Lambda, Cloud Run, etc.) that Forge calls via a declared `remote` module
 * in `manifest.yml`. Unlike {@link ForgeContainerAdapter}, the `installationId`
 * and `appSystemToken` are provided fresh in every inbound invocation payload —
 * you do not need to fetch them at startup.
 *
 * For the simplest setup, use {@link adapterFromForgePayload} to create an adapter
 * directly from the invocation payload.
 */
export class ForgeRemoteAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly proxyUrl: string;
  private readonly installationId: string;
  private readonly appSystemToken: string;

  /**
   * Create a new ForgeRemoteAdapter.
   * @param options - Configuration including product, proxy URL, installation ID, and app system token
   */
  constructor(options: ForgeRemoteAdapterOptions) {
    this.product = options.product;
    this.proxyUrl = options.proxyUrl.replace(/\/$/, '');
    this.installationId = options.installationId;
    this.appSystemToken = options.appSystemToken;
  }

  /**
   * Execute a request through the Forge egress proxy.
   * Injects `forge-proxy-authorization` header with the app system token and installation ID.
   */
  async fetch(options: ForgeRequestOptions): Promise<Response> {
    const { method, path, queryParams, body, headers, authContext } = options;

    const productPrefix = this.product === 'jira' ? '/jira' : '/confluence';
    const url = `${this.proxyUrl}${productPrefix}${path}${buildQueryString(queryParams)}`;

    const extraHeaders: Record<string, string> = {};
    let proxyAuth: string;

    switch (authContext.type) {
      case 'asApp':
        // Use appSystemToken to authenticate as the app.
        // The token identifies both the app and the installation.
        proxyAuth = `Forge as=app,installationId=${this.installationId},token=${this.appSystemToken}`;
        break;

      case 'asUser':
        // asUser with a known userId — synchronous user impersonation.
        // The userId should be the Atlassian account ID of the user who
        // triggered the Forge Remote invocation (available in the payload).
        proxyAuth = `Forge as=user,accountId=${authContext.userId ?? ''},installationId=${this.installationId},token=${this.appSystemToken}`;
        break;

      case 'offlineUser':
        // Offline user impersonation — caller provides a pre-fetched accessToken
        // obtained via ForgeRemoteTokenManager.getToken(accountId).
        proxyAuth = `Forge as=user,accountId=${authContext.accountId},installationId=${this.installationId},token=${this.appSystemToken}`;
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
): RequestInit {
  const allHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };
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
