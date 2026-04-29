---
title: Auth Contexts
description: Understanding asApp, asUser, and offline user impersonation in @forge-clients.
---

Auth context is set once when creating a **BoundClient** using `asApp()`, `asUser()`,
or `asOfflineUser()`. All generated functions take a BoundClient as their first argument —
there is no per-call auth context argument.

```typescript
import { asApp, asUser, asOfflineUser } from '@forge-clients/core';

const appClient  = asApp(adapter);               // app credentials
const userClient = asUser(adapter);              // invoking user (Forge Functions only)
const userClient2 = asUser(adapter, 'acct:123'); // specific user by account ID
```

## asApp

The request is made using the **app's own credentials**. This is the right choice for
background operations, scheduled tasks, and system-level actions where no user context
is available or needed.

```typescript
import { asApp } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira/v3';

const projects = await searchProjects(asApp(adapter), {});
```

- **Available in:** Forge Functions, Forge Containers, Forge Remotes
- **Rate limits:** App-level rate limit bucket
- **Audit logs:** Attributed to the app, not a user
- **Requires:** `read:jira-work` or equivalent scope in `manifest.yml`

## asUser (context user)

The request is made on behalf of the **current invoking user**. No `userId` argument is
needed — Forge injects the invoking user's identity automatically from the request context.

```typescript
import { asUser } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

const myself = await getCurrentUser(asUser(adapter), {});
```

- **Available in:** Forge Functions (when triggered by a user action)
- **Rate limits:** App + User combined rate limit bucket
- **Audit logs:** Attributed to the user
- **Requires:** Scopes with `impersonation: true` in `manifest.yml`

```yaml
# manifest.yml — declare user impersonation scopes
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
  # Each scope used with asUser must also have impersonation: true
```

## asUser with explicit userId

Impersonate a **specific user** by their Atlassian account ID. Useful in Forge Functions
when you know which user's context you need (e.g. from a stored account ID).

```typescript
import { asUser } from '@forge-clients/core';
import { createIssue } from '@forge-clients/jira/v3';

const userId = 'account:abc123def456';
const issue = await createIssue(asUser(adapter, userId), {
  body: {
    fields: {
      project: { key: 'PROJ' },
      summary: 'Created on behalf of user',
      issuetype: { name: 'Task' },
    },
  },
});
```

:::caution[Principle of least privilege]
Forge's `asUser` tokens only include scopes explicitly marked with `impersonation: true`.
Unlike Atlassian Connect's `ACT_AS_USER`, a user cannot access more than the declared
impersonation scopes — even if the user themselves has broader product permissions.
:::

## asOfflineUser (Containers and Remotes)

For **Forge Containers** and **Forge Remotes**, there is no live user session — you must
obtain a short-lived user access token out-of-band and pass it with the request.

Use `OfflineTokenManager` (for Containers) or `ForgeRemoteTokenManager` (for Remotes)
to fetch and cache these tokens, then bind them with `asOfflineUser`:

```typescript
import { ForgeContainerAdapter, OfflineTokenManager, asOfflineUser } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

const proxyUrl = process.env.FORGE_EGRESS_PROXY_URL!;

// Fetch installation ID at startup (Container only)
const { installationId } = await fetch(`${proxyUrl}/v0/installations`).then(r => r.json());

const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl, installationId });
const tokenManager = new OfflineTokenManager({ proxyUrl, installationId });

const accountId = 'account:abc123';

// Fetch (and cache) a token, then bind it to a client
const token = await tokenManager.getToken(accountId);
const offlineClient = asOfflineUser(adapter, token.accountId, token.accessToken);

const user = await getCurrentUser(offlineClient, {});
```

The `OfflineTokenManager` and `ForgeRemoteTokenManager` both handle token caching and
proactive refresh automatically — call `getToken()` on every request without worrying
about unnecessary round-trips.

The `accessToken` is **always the caller's responsibility to fetch** — it is never
obtained automatically inside the adapter.

## Choosing the right auth context

| Scenario | Adapter | Auth context |
|---|---|---|
| Background job, no user context | Any | `asApp` |
| Responding to a user action in a Forge Function | `ForgeFunctionAdapter` | `asUser()` |
| Creating content on behalf of a specific known user (Forge Function) | `ForgeFunctionAdapter` | `asUser(adapter, userId)` |
| Scheduled task in a Forge Container | `ForgeContainerAdapter` | `asOfflineUser` via `OfflineTokenManager` |
| Forge Remote handler — as app | `ForgeRemoteAdapter` | `asApp` |
| Forge Remote handler — on behalf of invoking user | `ForgeRemoteAdapter` | `asUser(adapter, payload.context.accountId)` |
| Forge Remote handler — offline user token | `ForgeRemoteAdapter` | `asOfflineUser` via `ForgeRemoteTokenManager` |
| Custom UI / UI Kit 2 frontend | `ForgeBridgeAdapter` | `asUser()` (implicit — Bridge only supports user context) |
