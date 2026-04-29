---
title: ForgeContainerAdapter
description: Using @forge-clients in Forge Containers (long-running services).
---

`ForgeContainerAdapter` is the adapter for **Forge Containers** — long-running Docker
services managed by Atlassian Forge that run continuously rather than per-invocation.
They communicate with Atlassian REST APIs exclusively through the Forge egress proxy
at `FORGE_EGRESS_PROXY_URL`.

## How Forge Containers work

Unlike Forge Functions (which are short-lived and use `@forge/api`), a Forge Container
is a persistent process. It must discover its own installation ID at startup by calling
the proxy's installations endpoint, then use that ID for all subsequent API requests.

## Setup

```typescript
import { ForgeContainerAdapter, asApp } from '@forge-clients/core';

// 1. Fetch the installation ID at startup
const proxyUrl = process.env.FORGE_EGRESS_PROXY_URL!;
const installationsResp = await fetch(`${proxyUrl}/v0/installations`);
const { installationId } = await installationsResp.json();

// 2. Create the adapter
const adapter = new ForgeContainerAdapter({
  product: 'jira',
  proxyUrl,
  installationId,
});
```

## Full example

```typescript
import { ForgeContainerAdapter, asApp } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const proxyUrl = process.env.FORGE_EGRESS_PROXY_URL!;

// Fetch installation ID once at startup
async function getInstallationId(): Promise<string> {
  const resp = await fetch(`${proxyUrl}/v0/installations`);
  const data = await resp.json();
  return data.installationId;
}

const installationId = await getInstallationId();

const adapter = new ForgeContainerAdapter({
  product: 'jira',
  proxyUrl,
  installationId,
});

// Make API calls as the app
const issue = await getIssue(asApp(adapter), {
  path: { issueIdOrKey: 'PROJ-123' },
});
console.log(issue.fields?.summary);
```

## Offline user impersonation

Containers can make API calls on behalf of specific users using short-lived offline
tokens obtained via `OfflineTokenManager`:

```typescript
import { ForgeContainerAdapter, OfflineTokenManager, asOfflineUser } from '@forge-clients/core';
import { createContent } from '@forge-clients/confluence/v1';

const proxyUrl = process.env.FORGE_EGRESS_PROXY_URL!;
const installationId = await getInstallationId(); // see above

const adapter = new ForgeContainerAdapter({
  product: 'confluence',
  proxyUrl,
  installationId,
});

const tokenManager = new OfflineTokenManager({
  proxyUrl,
  installationId,
});

async function createPageAsUser(accountId: string, spaceKey: string, title: string) {
  // Fetch (and cache) a short-lived access token for this user
  const token = await tokenManager.getToken(accountId);
  const client = asOfflineUser(adapter, token.accountId, token.accessToken);

  return createContent(client, {
    body: {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: { value: '<p>Created by container.</p>', representation: 'storage' },
      },
    },
  });
}
```

The `OfflineTokenManager` caches tokens and proactively refreshes them before expiry,
so you can call `getToken()` on every request without worrying about unnecessary round-trips.

## Notes

- `@forge/api` is **not available** in Forge Containers — always use `ForgeContainerAdapter`
- `FORGE_EGRESS_PROXY_URL` is injected by the Forge runtime as an environment variable
- The installation ID must be fetched from `GET <proxyUrl>/v0/installations` at startup — it is not available as an environment variable
- Offline user impersonation requires declaring `impersonation: true` on scopes in `manifest.yml`
- Both `asApp` and `asOfflineUser` auth contexts are supported; `asUser` without a userId is not meaningful in a Container since there is no live user session
