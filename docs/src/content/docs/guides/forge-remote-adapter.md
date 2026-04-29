---
title: ForgeRemoteAdapter
description: Using @forge-clients in Forge Remote backends (externally-hosted services).
---

`ForgeRemoteAdapter` is the adapter for **Forge Remotes** — externally-hosted services
(AWS Lambda, Cloud Run, your own server, etc.) that Atlassian Forge calls via a declared
`remote` module in `manifest.yml`. Unlike Forge Functions, Forge Remotes run entirely
outside the Forge runtime; unlike Forge Containers, they are stateless per-invocation
handlers rather than long-running processes.

## How Forge Remotes work

When Forge invokes your Remote, it sends an HTTP POST to your endpoint with a signed
JSON payload containing:

- `installationId` — identifies this app installation
- `appSystemToken` — a short-lived token for authenticating egress proxy requests
- `context.accountId` — the Atlassian account ID of the invoking user (if any)
- `payload` — the data sent by the triggering module

Your handler uses these values to construct a `ForgeRemoteAdapter` and make API calls
back to Atlassian through the Forge egress proxy (`FORGE_EGRESS_PROXY_URL`).

## Quick setup with `adapterFromForgePayload`

The easiest way to create an adapter is the `adapterFromForgePayload` factory, which
reads `installationId` and `appSystemToken` from the payload and `FORGE_EGRESS_PROXY_URL`
from the environment automatically:

```typescript
import { adapterFromForgePayload, asApp, type ForgeInvocationPayload } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = adapterFromForgePayload(payload, 'jira');

  const issue = await getIssue(asApp(adapter), {
    path: { issueIdOrKey: 'PROJ-123' },
  });

  return { summary: issue.fields?.summary };
}
```

## Manual setup

If you need more control (e.g. to inject a test proxy URL), construct
`ForgeRemoteAdapter` directly:

```typescript
import { ForgeRemoteAdapter, asApp, type ForgeInvocationPayload } from '@forge-clients/core';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = new ForgeRemoteAdapter({
    product: 'jira',
    proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
    installationId: payload.installationId,
    appSystemToken: payload.appSystemToken,
  });

  // ...
}
```

## Making requests as the invoking user

Use `asUser` with the account ID from the payload context for synchronous user impersonation:

```typescript
import { adapterFromForgePayload, asUser, getInvokingUserId, type ForgeInvocationPayload } from '@forge-clients/core';
import { getCurrentUser } from '@forge-clients/jira/v3';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = adapterFromForgePayload(payload, 'jira');
  const accountId = getInvokingUserId(payload);

  if (!accountId) {
    throw new Error('This handler requires a user context');
  }

  const me = await getCurrentUser(asUser(adapter, accountId), {});
  return { displayName: me.displayName };
}
```

## Offline user impersonation

For operations that need user-scoped tokens fetched out-of-band, use
`ForgeRemoteTokenManager` with `asOfflineUser`:

```typescript
import {
  adapterFromForgePayload,
  ForgeRemoteTokenManager,
  asOfflineUser,
  type ForgeInvocationPayload,
} from '@forge-clients/core';
import { createIssue } from '@forge-clients/jira/v3';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = adapterFromForgePayload(payload, 'jira');

  const tokenManager = new ForgeRemoteTokenManager({
    proxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
    installationId: payload.installationId,
    appSystemToken: payload.appSystemToken,
  });

  const accountId = payload.context.accountId!;
  const token = await tokenManager.getToken(accountId);
  const client = asOfflineUser(adapter, token.accountId, token.accessToken);

  return createIssue(client, {
    body: {
      fields: {
        project: { key: 'PROJ' },
        summary: 'Created by Forge Remote',
        issuetype: { name: 'Task' },
      },
    },
  });
}
```

## Differences from ForgeContainerAdapter

| Concern | ForgeContainerAdapter | ForgeRemoteAdapter |
|---|---|---|
| **Lifecycle** | Long-running Docker process | Stateless per-invocation handler |
| **Installation ID** | Fetched at startup via `GET <proxyUrl>/v0/installations` | Provided in every invocation payload |
| **App system token** | Not needed (Container identity handles auth) | Provided in every invocation payload |
| **Offline tokens** | `OfflineTokenManager` | `ForgeRemoteTokenManager` |
| **Factory helper** | Construct manually | `adapterFromForgePayload(payload, product)` |

## Notes

- `FORGE_EGRESS_PROXY_URL` is injected by Forge into the invocation environment
- The `appSystemToken` has a short TTL (typically minutes) — use it within the same invocation
- Both `asApp`, `asUser`, and `asOfflineUser` auth contexts are supported
- Declare `impersonation: true` in `manifest.yml` scopes if you need `asUser` or `asOfflineUser`
