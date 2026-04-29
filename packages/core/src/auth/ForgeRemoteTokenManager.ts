/**
 * Token manager for Forge Remote backends.
 *
 * Similar to OfflineTokenManager but accepts an appSystemToken from the
 * invocation payload rather than relying on Container identity.
 * Forge Remotes are stateless per-invocation handlers, so this manager
 * is typically instantiated fresh per invocation with a short-lived token.
 *
 * Token caching is still valuable within a single invocation that makes
 * multiple API calls for the same user, and across warm Lambda/Cloud Run
 * invocations where the handler module is kept alive.
 */

export interface ForgeRemoteUserToken {
  accessToken: string;
  /** Unix timestamp (seconds) when the token expires */
  expiry: number;
  accountId: string;
}

export interface ForgeRemoteTokenManagerOptions {
  /** The Forge egress proxy URL */
  proxyUrl: string;
  /** The installation ID for this app installation */
  installationId: string;
  /**
   * The app system token from the Forge Remote invocation payload.
   * Used to authenticate the GraphQL request to fetch user tokens.
   */
  appSystemToken: string;
  /**
   * How many seconds before expiry to proactively refresh the token.
   * Default: 60 seconds.
   */
  refreshBufferSeconds?: number;
}

/**
 * Manages offline user impersonation tokens for Forge Remote backends.
 *
 * Similar to {@link OfflineTokenManager} but authenticates using an `appSystemToken`
 * from the inbound invocation payload instead of relying on Container identity.
 *
 * Because Forge Remotes are stateless per-invocation handlers, this manager is
 * typically instantiated fresh per request. Token caching is still valuable within
 * a single invocation that makes multiple API calls for the same user, and across
 * warm Lambda / Cloud Run invocations where the handler module stays alive.
 *
 * @example
 * ```typescript
 * import { ForgeRemoteAdapter, ForgeRemoteTokenManager, asOfflineUser } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * export async function handler(payload: ForgeInvocationPayload) {
 *   const adapter = new ForgeRemoteAdapter({ product: 'jira', proxyUrl, installationId: payload.installationId, appSystemToken: payload.appSystemToken });
 *   const tokenManager = new ForgeRemoteTokenManager({ proxyUrl, installationId: payload.installationId, appSystemToken: payload.appSystemToken });
 *
 *   const token = await tokenManager.getToken(payload.context.accountId!);
 *   const client = asOfflineUser(adapter, token.accountId, token.accessToken);
 *   return getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
 * }
 * ```
 */
export class ForgeRemoteTokenManager {
  private readonly cache = new Map<string, ForgeRemoteUserToken>();
  private readonly refreshBufferSeconds: number;

  /**
   * Create a new ForgeRemoteTokenManager.
   * @param opts - Configuration including the proxy URL, installation ID, and app system token
   */
  constructor(private readonly opts: ForgeRemoteTokenManagerOptions) {
    this.refreshBufferSeconds = opts.refreshBufferSeconds ?? 60;
  }

  /**
   * Get a valid offline user token for the given accountId.
   * Returns the cached token if it is still valid, otherwise fetches a new one.
   */
  async getToken(accountId: string): Promise<ForgeRemoteUserToken> {
    const cached = this.cache.get(accountId);
    const now = Math.floor(Date.now() / 1000);

    if (cached && cached.expiry > now + this.refreshBufferSeconds) {
      return cached;
    }

    const token = await this.fetchToken(accountId);
    this.cache.set(accountId, token);
    return token;
  }

  /** Remove a cached token, forcing a fresh fetch on next getToken() call */
  invalidate(accountId: string): void {
    this.cache.delete(accountId);
  }

  /** Remove all cached tokens */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Convenience method — fetch a valid token and return a BoundClient
   * for offline user impersonation. Caches the token internally.
   *
   * @example
   * const tokenManager = new ForgeRemoteTokenManager({ ... });
   * const client = await tokenManager.boundClient(adapter, payload.context.accountId);
   * const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
   */
  async boundClient(
    adapter: import('../adapters/ForgeAdapter.js').ForgeAdapter,
    accountId: string,
  ): Promise<import('../client/BoundClient.js').BoundClient> {
    const token = await this.getToken(accountId);
    return {
      adapter,
      authContext: { type: 'offlineUser', accountId, accessToken: token.accessToken },
    };
  }

  private async fetchToken(accountId: string): Promise<ForgeRemoteUserToken> {
    const proxyUrl = this.opts.proxyUrl.replace(/\/$/, '');

    const response = await fetch(`${proxyUrl}/graphql`, {
      method: 'POST',
      headers: {
        // Forge Remote uses appSystemToken in the proxy-authorization header
        'forge-proxy-authorization': `Forge as=app,installationId=${this.opts.installationId},token=${this.opts.appSystemToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetOfflineUserToken($userId: String!) {
            offlineUserAuthToken(userID: $userId) {
              accessToken
              expiry
            }
          }
        `,
        variables: { userId: accountId },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `ForgeRemoteTokenManager: failed to fetch offline user token for ${accountId}: ` +
          `${response.status} ${response.statusText}`,
      );
    }

    const { data, errors } = (await response.json()) as {
      data?: { offlineUserAuthToken: { accessToken: string; expiry: number } };
      errors?: Array<{ message: string }>;
    };

    if (errors?.length) {
      throw new Error(
        `ForgeRemoteTokenManager: GraphQL error fetching offline token for ${accountId}: ` +
          errors.map((e) => e.message).join(', '),
      );
    }

    if (!data?.offlineUserAuthToken) {
      throw new Error(
        `ForgeRemoteTokenManager: no offline token returned for accountId: ${accountId}`,
      );
    }

    return {
      accessToken: data.offlineUserAuthToken.accessToken,
      expiry: data.offlineUserAuthToken.expiry,
      accountId,
    };
  }
}
