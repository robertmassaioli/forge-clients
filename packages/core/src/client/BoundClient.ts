/**
 * BoundClient — a ForgeAdapter bound to a specific auth context.
 *
 * Instead of passing adapter + authContext as separate arguments to every
 * SDK function, you bind them once into a BoundClient and pass that:
 *
 * ```typescript
 * // Before (clunky — auth is a middle positional argument):
 * await getIssue(adapter, { type: 'asApp' }, { issueIdOrKey: 'PROJ-1' });
 *
 * // After (clean — auth is bound once, functions take (client, params)):
 * const app = asApp(adapter);
 * await getIssue(app, { issueIdOrKey: 'PROJ-1' });
 * ```
 *
 * BoundClient is intentionally a plain interface (not a class) so that it
 * is fully tree-shakeable and has zero prototype overhead. The helper
 * functions asApp(), asUser(), asOfflineUser(), and withAuth() are all
 * standalone exported functions — each independently tree-shakeable.
 */

import type { ForgeAdapter, AuthContext } from '../adapters/ForgeAdapter.js';

/**
 * A ForgeAdapter bound to a specific auth context.
 * Create one with asApp(), asUser(), or asOfflineUser().
 */
export interface BoundClient {
  readonly adapter: ForgeAdapter;
  readonly authContext: AuthContext;
}

/**
 * Make API calls as the Forge app itself.
 * This is the default and most common auth context for backend operations.
 *
 * Use this for operations that the app performs autonomously — not on behalf
 * of a specific user.
 *
 * @example
 * ```typescript
 * import { asApp } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * const client = asApp(adapter);
 * const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
 * ```
 */
export function asApp(adapter: ForgeAdapter): BoundClient {
  return { adapter, authContext: { type: 'asApp' } };
}

/**
 * Make API calls on behalf of the currently logged-in user.
 *
 * - In **Forge Functions**: the invoking user's identity is used automatically
 *   when no userId is provided.
 * - In **Custom UI / UI Kit 2**: user identity is managed by the bridge.
 * - In **Forge Remotes**: pass `payload.context.accountId` as the userId.
 *
 * @param adapter - The ForgeAdapter for the target product
 * @param userId  - Optional Atlassian account ID. If omitted, Forge uses the
 *                  invoking user's identity automatically.
 *
 * @example
 * ```typescript
 * import { asUser } from '@forge-clients/core';
 * import { getMyself } from '@forge-clients/jira/v3';
 *
 * // Without userId — uses the invoking user:
 * const client = asUser(adapter);
 * const me = await getMyself(client);
 *
 * // With explicit userId (e.g. from a Forge Remote payload):
 * const client = asUser(adapter, payload.context.accountId);
 * ```
 */
export function asUser(adapter: ForgeAdapter, userId?: string): BoundClient {
  return {
    adapter,
    authContext: userId !== undefined ? { type: 'asUser', userId } : { type: 'asUser' },
  };
}

/**
 * Make API calls on behalf of a user via offline impersonation.
 *
 * Used in **Forge Containers** and **Forge Remotes** where there is no live
 * user session. The accessToken must be obtained from OfflineTokenManager
 * (for Containers) or ForgeRemoteTokenManager (for Remotes).
 *
 * @param adapter     - The ForgeAdapter for the target product
 * @param accountId   - The Atlassian account ID of the user to impersonate
 * @param accessToken - The short-lived offline access token for the user
 *
 * @example
 * ```typescript
 * import { asOfflineUser, OfflineTokenManager } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * const tokenManager = new OfflineTokenManager({ proxyUrl, installationId });
 * const token = await tokenManager.getToken('user-account-id');
 * const client = asOfflineUser(adapter, token.accountId, token.accessToken);
 * const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
 * ```
 */
export function asOfflineUser(
  adapter: ForgeAdapter,
  accountId: string,
  accessToken: string,
): BoundClient {
  return { adapter, authContext: { type: 'offlineUser', accountId, accessToken } };
}

/**
 * Create a new BoundClient with a different auth context, reusing the same
 * underlying adapter. Useful for switching auth mid-handler.
 *
 * @example
 * ```typescript
 * import { asApp, withAuth } from '@forge-clients/core';
 *
 * const appClient = asApp(adapter);
 * // Switch to user context for certain operations:
 * const userClient = withAuth(appClient, { type: 'asUser', userId: 'abc' });
 * ```
 */
export function withAuth(client: BoundClient, authContext: AuthContext): BoundClient {
  return { adapter: client.adapter, authContext };
}
