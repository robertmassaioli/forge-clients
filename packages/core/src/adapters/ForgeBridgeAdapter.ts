/**
 * Adapter for UI Kit 2 and Custom UI frontend contexts.
 *
 * Uses @forge/bridge's requestJira / requestConfluence methods.
 * All calls are implicitly made as the currently logged-in user (asUser).
 * asApp is NOT available in the bridge context.
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

  async fetch(_options: ForgeRequestOptions): Promise<Response> {
    // Implementation will be completed in a later step.
    // Requires @forge/bridge which is only available in frontend contexts.
    throw new Error(
      'ForgeBridgeAdapter.fetch() — implementation pending. ' +
      'See the generator implementation phase.'
    );
  }
}
