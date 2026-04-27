/**
 * Adapter for Forge Containers and Forge Remote backends.
 *
 * Uses the FORGE_EGRESS_PROXY_URL environment variable and manually
 * constructs forge-proxy-authorization headers. This is the ONLY
 * way to make API calls from Forge Containers (@forge/api is not available there).
 *
 * Supports: asApp, offline user impersonation (with pre-fetched token).
 */

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeContainerAdapterOptions {
  product: 'jira' | 'confluence';
  /**
   * The Forge egress proxy URL.
   * Typically: process.env.FORGE_EGRESS_PROXY_URL
   */
  proxyUrl: string;
  /**
   * The installation ID for this app installation.
   * Obtained from GET <proxyUrl>/v0/installations
   */
  installationId: string;
}

export class ForgeContainerAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly proxyUrl: string;
  private readonly installationId: string;

  constructor(options: ForgeContainerAdapterOptions) {
    this.product = options.product;
    this.proxyUrl = options.proxyUrl;
    this.installationId = options.installationId;
  }

  async fetch(_options: ForgeRequestOptions): Promise<Response> {
    // Implementation will be completed in a later step.
    throw new Error(
      'ForgeContainerAdapter.fetch() — implementation pending. ' +
      'See the generator implementation phase.'
    );
  }
}
