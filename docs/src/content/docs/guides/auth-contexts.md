---
title: Auth Contexts
description: Understanding asApp, asUser, and offline user impersonation in @forge-clients.
---

Auth context is set once when creating a **BoundClient** using `asApp()`, `asUser()`,
or `asOfflineUser()`. All generated functions take a BoundClient as their first argument —
there is no middle auth context argument.

```typescript
import { asApp, asUser, asOfflineUser, withAuth } from '@forge-clients/core';

const appClient  = asApp(adapter);               // asApp
const userClient = asUser(adapter);              // asUser (invoking user)
const userClient2 = asUser(adapter, 'acct:123'); // asUser (specific user)
```

## asApp

The request is made using the **app's own credentials**. This is the default for most
background operations, scheduled tasks, and system-level actions.

```typescript
import { asApp } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira/v3';

const projects = await searchProjects(asApp(adapter), {});
```

- Available in: Forge Functions, Forge Containers, Forge Remotes
- Rate limits: App-level rate limit bucket
- Audit logs: Attributed to the app, not a user
- Requires: `read:jira-work` or equivalent scope in `manifest.yml`

## asUser (context user)

The request is made on behalf of the **current user** — the person who triggered the
Forge Function invocation. No `userId` is needed; Forge injects the context user automatically.

```typescript
import { asUser } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

const myself = await getCurrentUser(asUser(adapter), {});
```

- Available in: Forge Functions (when invoked by a user action in UI)
- Rate limits: App + User rate limit bucket
- Audit logs: Attributed to the user
- Requires: Scopes marked with `impersonation: true` in `manifest.yml`

```yaml
# manifest.yml — declare impersonation scopes
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
  # To use asUser, add impersonation: true to each scope
```

## asUser with explicit userId

Impersonate a **specific user** by their Atlassian account ID. Useful for workflows
where you know which user's context you need.

```typescript
import { asUser } from '@forge-clients/core';
import { createIssue } from '@forge-clients/jira/v3';

const userId = 'account:abc123def456';
const issue = await createIssue(asUser(adapter, userId), {
  body: { fields: { project: { key: 'PROJ' }, summary: 'Created on behalf of user', issuetype: { name: 'Task' } } }
});
```

:::caution[Principle of least privilege]
Forge's `asUser` tokens only include scopes explicitly marked with `impersonation: true`.
Unlike Atlassian Connect's `ACT_AS_USER`, users cannot access more than the declared
impersonation scopes — even if the user themselves has broader permissions.
:::

## offlineUser (Containers / Remotes)

For **Forge Containers** and **Forge Remotes**, you must first obtain a short-lived user
access token via the `OfflineTokenManager`, then pass it with the request:

```typescript
import { ForgeContainerAdapter, OfflineTokenManager } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

const adapter = new ForgeContainerAdapter({
  product: 'jira',
  installationId: process.env.FORGE_INSTALLATION_ID!,
  egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
});

const tokenManager = new OfflineTokenManager({
  egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
  installationId: process.env.FORGE_INSTALLATION_ID!,
});

const accountId = 'account:abc123';

// Option 1: fetch token manually, then bind
const token = await tokenManager.getToken(accountId);
const offlineClient = asOfflineUser(adapter, token.accountId, token.accessToken);

// Option 2: convenience method (fetches + caches token, returns BoundClient)
const offlineClient2 = await tokenManager.boundClient(adapter, accountId);

const user = await getCurrentUser(offlineClient, {});
```

The `OfflineTokenManager` handles token caching and proactive refresh automatically.
The `accessToken` field is **required** — token fetching is always the caller's
responsibility via the token manager, never done automatically inside the adapter.

## Choosing the right auth context

| Scenario | Auth context |
|---|---|
| Background job, no user context | `asApp` |
| Responding to a user action in a Forge Function | `asUser` (no userId) |
| Creating content on behalf of a known user | `asUser` with userId |
| Scheduled task in a Forge Container | `offlineUser` |
| Forge Remote webhook handler | `offlineUser` |
