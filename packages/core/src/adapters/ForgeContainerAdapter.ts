/**
 * Adapter for Forge Containers and Forge Remote backends.
 * Uses FORGE_EGRESS_PROXY_URL + forge-proxy-authorization headers.
 * This is the ONLY way to make API calls from Forge Containers.
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeContainerAdapterOptions {
  product: 'jira' | 'confluence';
  /** process.env.FORGE_EGRESS_PROXY_URL */
  proxyUrl: string;
  /** Obtained from GET <proxyUrl>/v0/installations */
  installationId: string;
}

export class ForgeContainerAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly proxyUrl: string;
  private readonly installationId: string;

  constructor(options: ForgeContainerAdapterOptions) {
    this.product = options.product;
    this.proxyUrl = options.proxyUrl.replace(/\/$/, '');
    this.installationId = options.installationId;
  }

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
