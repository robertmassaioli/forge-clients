/**
 * Adapter for Forge Functions (serverless backend).
 *
 * Uses @forge/api's requestJira / requestConfluence methods,
 * which handle all Forge authentication automatically.
 *
 * NOT available in Forge Containers — use ForgeContainerAdapter there.
 */

// NOTE: @forge/api is a peer dependency, available only inside Forge Functions.
// This adapter will throw at runtime if used outside a Forge Function context.

import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';

export interface ForgeFunctionAdapterOptions {
  product: 'jira' | 'confluence';
}

export class ForgeFunctionAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';

  constructor(options: ForgeFunctionAdapterOptions) {
    this.product = options.product;
  }

  async fetch(_options: ForgeRequestOptions): Promise<Response> {
    // Implementation will be completed in a later step.
    // Requires @forge/api which is only available inside the Forge runtime.
    throw new Error(
      'ForgeFunctionAdapter.fetch() — implementation pending. ' +
      'See the generator implementation phase.'
    );
  }
}
