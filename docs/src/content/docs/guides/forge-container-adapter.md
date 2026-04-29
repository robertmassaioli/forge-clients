---
title: ForgeContainerAdapter
description: Using @forge-clients in Forge Containers (long-running services).
---

`ForgeContainerAdapter` is the adapter for **Forge Containers** — long-running Docker
services that run outside the Forge Functions sandboxed runtime. It uses the
`FORGE_EGRESS_PROXY_URL` sidecar proxy.

## Setup

```typescript
import { ForgeContainerAdapter } from '@forge-clients/core';

const adapter = new ForgeContainerAdapter({
  product: 'jira',
  installationId: process.env.FORGE_INSTALLATION_ID!,
  egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
});
```

## Offline user impersonation

Containers can impersonate users using short-lived offline tokens:

```typescript
import { ForgeContainerAdapter, OfflineTokenManager } from '@forge-clients/core';
import { createContent } from '@forge-clients/confluence/v1';

const tokenManager = new OfflineTokenManager({
  egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
  installationId: process.env.FORGE_INSTALLATION_ID!,
});

async function createPageAsUser(accountId: string, spaceKey: string, title: string) {
  const accessToken = await tokenManager.getToken(accountId);

  const confluenceAdapter = new ForgeContainerAdapter({
    product: 'confluence',
    installationId: process.env.FORGE_INSTALLATION_ID!,
    egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
  });

  return createContent(confluenceAdapter, {
    type: 'offlineUser',
    accountId,
    accessToken,
  }, {
    body: {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: { storage: { value: '<p>Created by container.</p>', representation: 'storage' } },
    },
  });
}
```

## Important notes

- `@forge/api` package is **not available** in Forge Containers — use `ForgeContainerAdapter`
- `FORGE_EGRESS_PROXY_URL` and `FORGE_INSTALLATION_ID` are injected by the Forge runtime
- Offline user impersonation requires declaring `impersonation: true` scopes in `manifest.yml`
