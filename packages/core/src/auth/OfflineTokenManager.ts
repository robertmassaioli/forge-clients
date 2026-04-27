/**
 * Manages offline user impersonation tokens for Forge Containers and Remotes.
 *
 * Offline user impersonation allows Containers/Remotes to make API calls
 * on behalf of a specific user without a live user session. Tokens are
 * obtained via a GraphQL query through the Forge egress proxy and are
 * short-lived (must be refreshed before expiry).
 *
 * NOT needed in Forge Functions — use api.asUser() there instead.
 */

export interface OfflineUserToken {
  accessToken: string;
  /** Unix timestamp (seconds) when the token expires */
  expiry: number;
  accountId: string;
}

export interface OfflineTokenManagerOptions {
  /** The Forge egress proxy URL (process.env.FORGE_EGRESS_PROXY_URL) */
  proxyUrl: string;
  /** The installation ID for this app installation */
  installationId: string;
  /**
   * How many seconds before expiry to proactively refresh the token.
   * Default: 60 seconds
   */
  refreshBufferSeconds?: number;
}

export class OfflineTokenManager {
  private readonly cache = new Map<string, OfflineUserToken>();
  private readonly refreshBufferSeconds: number;

  constructor(private readonly opts: OfflineTokenManagerOptions) {
    this.refreshBufferSeconds = opts.refreshBufferSeconds ?? 60;
  }

  /**
   * Get a valid offline user token for the given accountId.
   * Automatically fetches a new token if none is cached or if the cached
   * token is within refreshBufferSeconds of expiry.
   */
  async getToken(accountId: string): Promise<OfflineUserToken> {
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

  private async fetchToken(accountId: string): Promise<OfflineUserToken> {
    const response = await fetch(`${this.opts.proxyUrl}/graphql`, {
      method: 'POST',
      headers: {
        'forge-proxy-authorization': `Forge as=app,installationId=${this.opts.installationId}`,
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
        `Failed to fetch offline user token for ${accountId}: ${response.status} ${response.statusText}`,
      );
    }

    const { data, errors } = await response.json() as {
      data?: { offlineUserAuthToken: { accessToken: string; expiry: number } };
      errors?: Array<{ message: string }>;
    };

    if (errors?.length) {
      throw new Error(`GraphQL error fetching offline token: ${errors.map(e => e.message).join(', ')}`);
    }

    if (!data?.offlineUserAuthToken) {
      throw new Error(`No offline token returned for accountId: ${accountId}`);
    }

    return {
      accessToken: data.offlineUserAuthToken.accessToken,
      expiry: data.offlineUserAuthToken.expiry,
      accountId,
    };
  }
}
