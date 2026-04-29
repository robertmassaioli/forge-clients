---
title: Concepts
description: Understanding the adapter pattern, auth contexts, and how @forge-clients works.
---

## The Adapter Pattern

`@forge-clients` separates **what to call** (the generated API functions) from **how to make
the call** (the adapter). This is the core design principle.

```
Your code         Generated function       Adapter           Forge runtime
────────          ─────────────────        ───────           ─────────────
getIssue(...)  →  builds request  →  ForgeFunctionAdapter  →  @forge/api
                                    ForgeBridgeAdapter     →  @forge/bridge
                                    ForgeContainerAdapter  →  FORGE_EGRESS_PROXY_URL
```

Every generated function takes an `adapter` as its first argument. Swap the adapter to
change *how* the request is made without changing your business logic.

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

## Auth Contexts

Every generated function takes an `AuthContext` as its second argument, telling the
adapter which credentials to use for this specific call.

```typescript
// Use the app's own credentials
{ type: 'asApp' }

// Use the current context user's credentials (Forge Functions only)
{ type: 'asUser' }

// Impersonate a specific user by account ID
{ type: 'asUser', userId: 'account:abc123' }

// Use an offline user token (Containers / Remotes)
{ type: 'offlineUser', accountId: 'account:abc123', accessToken: 'eyJ...' }
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
  const issue = await getIssue(adapter, { type: 'asApp' }, { issueIdOrKey: 'PROJ-999' });
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Issue not found');
  } else if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfterSeconds}s`);
  }
}
```

See the [Error Handling guide](/forge-clients/guides/error-handling/) for full details.
