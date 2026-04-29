/**
 * The central abstraction for all HTTP transport in `@forge-clients`.
 *
 * Every Forge execution context (Forge Function, UI Kit 2, Custom UI,
 * Forge Container, Forge Remote) implements this interface, allowing
 * the generated clients to work identically regardless of context.
 */

/**
 * Discriminated union describing who is making an API request.
 *
 * - `asApp` — the Forge app itself (app-scoped permissions)
 * - `asUser` — a live user session (the currently invoking user, or a specific userId)
 * - `offlineUser` — a user impersonated without a live session via a pre-fetched access token
 *
 * Create auth contexts with the helper functions {@link asApp}, {@link asUser}, or {@link asOfflineUser}
 * rather than constructing this union type directly.
 */
export type AuthContext =
  | { type: 'asApp' }
  | { type: 'asUser'; userId?: string }
  | {
      type: 'offlineUser';
      accountId: string;
      /**
       * A short-lived access token for the given accountId.
       * Obtain this via OfflineTokenManager.getToken() or
       * ForgeRemoteTokenManager.getToken() before constructing the auth context.
       * Token fetching is always the caller's responsibility — the adapter
       * uses the token as-is and never fetches one internally.
       *
       * @example
       * const token = await tokenManager.getToken(accountId);
       * const client = asOfflineUser(adapter, token.accountId, token.accessToken);
       */
      accessToken: string;
    };

/**
 * Low-level options passed to {@link ForgeAdapter.fetch}.
 * Generated client functions construct this automatically — you rarely need
 * to interact with `ForgeRequestOptions` directly.
 */
export interface ForgeRequestOptions {
  /** HTTP method for the request */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Relative API path, e.g. `/rest/api/3/issue/PROJ-123` */
  path: string;
  /** Query string parameters — undefined values are omitted */
  queryParams?: Record<string, unknown>;
  /** Request body — will be JSON-serialised */
  body?: unknown;
  /** Additional HTTP headers to include */
  headers?: Record<string, string>;
  /** Who is making the request */
  authContext: AuthContext;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * The core transport interface implemented by every Forge execution context adapter.
 *
 * Every Forge execution context (Forge Function, UI Kit 2, Custom UI,
 * Forge Container, Forge Remote) implements this interface, allowing
 * the generated clients to work identically regardless of context.
 *
 * You do not implement this interface yourself — use one of the provided
 * adapters: {@link ForgeFunctionAdapter}, {@link ForgeBridgeAdapter},
 * {@link ForgeContainerAdapter}, or {@link ForgeRemoteAdapter}.
 */
export interface ForgeAdapter {
  /** The Atlassian product this adapter is configured to make requests to */
  readonly product: 'jira' | 'confluence';
  /**
   * Execute an HTTP request and return a standard `Response`.
   * Implementations are responsible for authentication header injection,
   * URL construction, and serialisation.
   */
  fetch(options: ForgeRequestOptions): Promise<Response>;
}
