/**
 * The central abstraction for all HTTP transport in @forge-clients.
 *
 * Every Forge execution context (Forge Function, UI Kit 2, Custom UI,
 * Forge Container, Forge Remote) implements this interface, allowing
 * the generated clients to work identically regardless of context.
 */

export type AuthContext =
  | { type: 'asApp' }
  | { type: 'asUser'; userId?: string }
  | { type: 'offlineUser'; accountId: string; accessToken: string };

export interface ForgeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Relative API path, e.g. /rest/api/3/issue/PROJ-123 */
  path: string;
  queryParams?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  authContext: AuthContext;
  signal?: AbortSignal;
}

export interface ForgeAdapter {
  /** Which Atlassian product this adapter targets */
  readonly product: 'jira' | 'confluence';
  /** Execute the request and return a standard Response */
  fetch(options: ForgeRequestOptions): Promise<Response>;
}
