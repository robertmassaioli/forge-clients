---
title: Concepts
description: Understanding the adapter pattern, auth contexts, and how @forge-clients works.
---

## The Adapter Pattern

`@forge-clients` separates **what to call** (the generated API functions) from **how to make
the call** (the adapter). This is the core design principle.

```
Your code               BoundClient              Adapter                Forge runtime
─────────               ───────────              ───────                ─────────────
asApp(adapter)      →   { adapter, authContext }
asUser(adapter)     →   { adapter, authContext }
                                 ↓
getIssue(client, params)  →  builds request  →  ForgeFunctionAdapter  →  @forge/api
                                                ForgeBridgeAdapter     →  @forge/bridge
                                                ForgeContainerAdapter  →  FORGE_EGRESS_PROXY_URL
                                                ForgeRemoteAdapter     →  FORGE_EGRESS_PROXY_URL
```

Every generated function takes a **BoundClient** as its first argument — a plain object
created by `asApp()`, `asUser()`, or `asOfflineUser()` that carries the adapter and auth
context together. Swap the adapter to change *how* the request is made without changing
your business logic.

## Adapters

### ForgeFunctionAdapter

Use this in **Forge Functions** (backend resolvers). It wraps `@forge/api`'s
`requestJira` and `requestConfluence`.

```typescript
import { ForgeFunctionAdapter } from '@forge-clients/core';
const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```

### ForgeBridgeAdapter

Use this in **Custom UI** (browser-side code). It calls the Forge bridge, which
proxies the request through the Forge runtime. The user context is implicit.

```typescript
import { ForgeBridgeAdapter } from '@forge-clients/core';
const adapter = new ForgeBridgeAdapter({ product: 'jira' });
```

### ForgeContainerAdapter

Use this in **Forge Containers** (long-running Docker services). It uses the
`FORGE_EGRESS_PROXY_URL` sidecar proxy with explicit `forge-proxy-authorization` headers.

```typescript
import { ForgeContainerAdapter } from '@forge-clients/core';
const adapter = new ForgeContainerAdapter({
  product: 'jira',
  installationId: process.env.FORGE_INSTALLATION_ID!,
  egressProxyUrl: process.env.FORGE_EGRESS_PROXY_URL!,
});
```

### ForgeRemoteAdapter

Use this in **Forge Remotes** (externally hosted backends). The `installationId` and
`appSystemToken` come from the Forge Remote invocation payload — use the
`adapterFromForgePayload()` convenience factory:

```typescript
import { adapterFromForgePayload, type ForgeInvocationPayload } from '@forge-clients/core';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = adapterFromForgePayload(payload, 'jira');
  // ...
}
```

## Auth Contexts and BoundClient

Auth context is set once using `asApp()`, `asUser()`, or `asOfflineUser()` — each
returns a **BoundClient** (a plain object holding the adapter + auth context). All
generated functions accept a BoundClient as their first argument.

```typescript
import { asApp, asUser, asOfflineUser, withAuth } from '@forge-clients/core';

// Use the app's own credentials
const appClient = asApp(adapter);

// Use the invoking user's credentials (Forge Functions / Custom UI)
const userClient = asUser(adapter);

// Impersonate a specific user by account ID
const specificUser = asUser(adapter, 'account:abc123');

// Offline user impersonation (Containers / Remotes) — fetch token first
const token = await tokenManager.getToken(accountId);
const offlineClient = asOfflineUser(adapter, token.accountId, token.accessToken);
// Or use the convenience method:
const offlineClient2 = await tokenManager.boundClient(adapter, accountId);

// Switch auth context on an existing BoundClient
const asAppAgain = withAuth(userClient, { type: 'asApp' });
```

See the [Auth Contexts guide](/forge-clients/guides/auth-contexts/) for full details.

## Generated Functions

Every Atlassian REST API endpoint becomes a named async function:

```typescript
// Jira v3
import { getIssue, createIssue, searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

// Jira Software
import { getBoard, getSprint } from '@forge-clients/jira/software';

// Confluence v1
import { getContentById, createContent } from '@forge-clients/confluence/v1';
```

Functions are individually exported — bundlers tree-shake unused functions automatically.

## Error Handling

All errors from generated functions are instances of `ForgeApiError` subclasses:

```typescript
import { ForgeApiError, NotFoundError, RateLimitError } from '@forge-clients/core';

try {
  const issue = await getIssue(asApp(adapter), { path: { issueIdOrKey: 'PROJ-999' } });
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Issue not found');
  } else if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfterSeconds}s`);
  }
}
```

See the [Error Handling guide](/forge-clients/guides/error-handling/) for full details.
