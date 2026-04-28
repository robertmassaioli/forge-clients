# ForgeRemoteAdapter — Planning Document

**Author:** Robert Massaioli  
**Date:** 2026-04-29  
**Status:** Proposed  
**Location:** `@forge-clients/core`

---

## Background

The `@forge-clients/core` package currently ships three adapters:

| Adapter | Context |
|---|---|
| `ForgeFunctionAdapter` | Forge Functions (serverless, `@forge/api` available) |
| `ForgeBridgeAdapter` | Custom UI frontend (browser, `@forge/bridge` available) |
| `ForgeContainerAdapter` | Forge Containers (long-running backend, egress proxy) |

**None of these is a correct fit for Forge Remote backends.**

A Forge Remote is an externally hosted service (your own server, AWS Lambda, Cloud Run, etc.)
that Forge invokes via a declared `remote` module in `manifest.yml`. The key distinction
from both Forge Functions and Containers is that every inbound request from Forge carries
a **payload** containing the app's credentials for that invocation — the caller must extract
these from the payload and use them to authenticate outbound API calls.

---

## What is a Forge Remote?

When Forge calls a Remote, the HTTP POST body (the Forge invocation payload) contains:

```json
{
  "installationId": "ari:cloud:ecosystem::installation/...",
  "installationContext": "ari:cloud:jira::site/<cloudId>",
  "appSystemToken": "<short-lived token for asApp calls>",
  "context": { ... },
  "payload": { ... }
}
```

The Remote uses:
- **`appSystemToken`** — passed in `forge-proxy-authorization` header for `asApp` calls
- **`installationId`** — identifies which installation this invocation is for
- **`FORGE_EGRESS_PROXY_URL`** — injected as an environment variable, same as Containers
- **Offline user tokens** — fetched via GraphQL using the `appSystemToken` for `asUser` calls

### How this differs from `ForgeContainerAdapter`

| Concern | `ForgeContainerAdapter` | Forge Remote |
|---|---|---|
| `FORGE_EGRESS_PROXY_URL` | Env var, always available | Env var, always available ✅ same |
| `installationId` | Fetched from `GET /v0/installations` | **In the invocation payload** — already known |
| App credentials | From env / implicit in proxy auth | **`appSystemToken` from payload** — must be passed |
| Lifetime | Long-running process (persistent) | Short-lived per-invocation (stateless) |
| Token caching | Makes sense (process stays alive) | Usually not needed (one invocation, one request) |
| Multiple installations | Iterates `GET /v0/installations` | Single installation per invocation |

The `ForgeContainerAdapter` is designed for a **long-running process** that discovers its
installations via the API. The Forge Remote is designed for a **stateless per-invocation**
handler where the installation context is handed to you upfront.

---

## Proposed: `ForgeRemoteAdapter`

### Interface / Constructor

```typescript
export interface ForgeRemoteAdapterOptions {
  product: 'jira' | 'confluence';

  /**
   * The installation ID for this invocation.
   * Extract from the Forge invocation payload: payload.installationId
   *
   * Format: "ari:cloud:ecosystem::installation/<uuid>"
   */
  installationId: string;

  /**
   * The short-lived app system token for this invocation.
   * Extract from the Forge invocation payload: payload.appSystemToken
   *
   * Used in forge-proxy-authorization for asApp calls, and to fetch
   * offline user tokens via GraphQL for asUser calls.
   */
  appSystemToken: string;

  /**
   * The Forge egress proxy URL.
   * Default: process.env.FORGE_EGRESS_PROXY_URL
   * Must be set in the Forge Remote's environment.
   */
  egressProxyUrl?: string;
}
```

### Usage Pattern

```typescript
import { ForgeRemoteAdapter } from '@forge-clients/core';
import { getIssue, searchProjects } from '@forge-clients/jira';

// In your Forge Remote HTTP handler:
export async function handler(req: Request): Promise<Response> {
  const body = await req.json() as ForgeInvocationPayload;

  const adapter = new ForgeRemoteAdapter({
    product: 'jira',
    installationId: body.installationId,
    appSystemToken: body.appSystemToken,
  });

  // asApp call — uses appSystemToken via forge-proxy-authorization
  const projects = await searchProjects(adapter, { type: 'asApp' }, { maxResults: 10 });

  // asUser call — fetches offline token via GraphQL then uses it
  const issue = await getIssue(adapter, { type: 'asUser', userId: body.context.accountId }, {
    path: { issueIdOrKey: 'PROJ-123' },
  });

  return Response.json({ projects, issue });
}
```

### `asApp` Request Flow

```
ForgeRemoteAdapter.fetch({ authContext: { type: 'asApp' }, path: '/rest/api/3/...' })
  │
  ├─ Build URL: ${FORGE_EGRESS_PROXY_URL}/jira/rest/api/3/...
  └─ Add header: forge-proxy-authorization: Forge as=app,installationId=<id>
     (Note: appSystemToken is implicitly validated by the proxy — it is NOT
      placed in the Authorization header for asApp calls)
```

### `asUser` Request Flow

```
ForgeRemoteAdapter.fetch({ authContext: { type: 'asUser', userId: 'accountId123' }, ... })
  │
  ├─ Fetch offline token via GraphQL:
  │    POST ${FORGE_EGRESS_PROXY_URL}/graphql
  │    forge-proxy-authorization: Forge as=app,installationId=<id>
  │    { query: "query { offlineUserAuthToken(userID: $userId) { accessToken expiry } }" }
  │
  ├─ Build URL: ${FORGE_EGRESS_PROXY_URL}/jira/rest/api/3/...
  └─ Add headers:
       forge-proxy-authorization: Forge as=user,accountId=<userId>
       Authorization: Bearer <offlineUserAccessToken>
```

### Token Caching Strategy

For a typical Forge Remote handler (stateless, one request in → one API call out), caching
offline user tokens **within a single invocation** is sufficient. The adapter should:

1. Cache tokens **in-memory for the lifetime of the adapter instance** (i.e. the invocation)
2. **Not** persist tokens across invocations (remote is stateless)
3. Accept an optional external `tokenCache: Map<string, OfflineUserToken>` so callers can
   share a cache across multiple adapter instances within one invocation if needed

For **long-running Remotes** (e.g. a server that handles many Forge invocations), the token
cache should be at the application level, not the adapter level. The adapter can accept an
optional `OfflineTokenManager` instance for this use case:

```typescript
// Option A: stateless per-invocation (default)
const adapter = new ForgeRemoteAdapter({ installationId, appSystemToken, product: 'jira' });

// Option B: long-running server with shared token cache
const tokenManager = new OfflineTokenManager({ proxyUrl, installationId });
const adapter = new ForgeRemoteAdapter({
  installationId,
  appSystemToken,
  product: 'jira',
  tokenManager, // reuses cached tokens across invocations
});
```

---

## Implementation Plan

### Step 1: Create `ForgeRemoteAdapter` in `@forge-clients/core`

**File:** `packages/core/src/adapters/ForgeRemoteAdapter.ts`

```typescript
import type { ForgeAdapter, ForgeRequestOptions } from './ForgeAdapter.js';
import { OfflineTokenManager } from '../auth/OfflineTokenManager.js';

export class ForgeRemoteAdapter implements ForgeAdapter {
  readonly product: 'jira' | 'confluence';
  private readonly installationId: string;
  private readonly appSystemToken: string;
  private readonly proxyUrl: string;
  private readonly tokenManager: OfflineTokenManager;

  constructor(options: ForgeRemoteAdapterOptions) {
    this.product = options.product;
    this.installationId = options.installationId;
    this.appSystemToken = options.appSystemToken;
    this.proxyUrl = options.egressProxyUrl
      ?? process.env['FORGE_EGRESS_PROXY_URL']
      ?? (() => { throw new Error('FORGE_EGRESS_PROXY_URL not set'); })();

    // Use provided tokenManager or create a per-adapter one
    this.tokenManager = options.tokenManager ?? new OfflineTokenManager({
      proxyUrl: this.proxyUrl,
      installationId: this.installationId,
    });
  }

  async fetch(options: ForgeRequestOptions): Promise<Response> {
    const { method, path, queryParams, body, headers, authContext } = options;
    const fullPath = `${path}${buildQueryString(queryParams)}`;
    const targetUrl = `${this.proxyUrl}/${this.product}${fullPath}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    if (authContext.type === 'asApp') {
      // asApp: use installationId in forge-proxy-authorization
      // The egress proxy validates the appSystemToken implicitly
      requestHeaders['forge-proxy-authorization'] =
        `Forge as=app,installationId=${this.installationId}`;
    } else if (authContext.type === 'asUser' && authContext.userId) {
      // asUser: fetch offline token, use in Authorization + forge-proxy-authorization
      const token = await this.tokenManager.getToken(authContext.userId);
      requestHeaders['forge-proxy-authorization'] =
        `Forge as=user,accountId=${authContext.userId}`;
      requestHeaders['Authorization'] = `Bearer ${token.accessToken}`;
    } else if (authContext.type === 'offlineUser') {
      // Caller has pre-fetched the token themselves
      requestHeaders['forge-proxy-authorization'] =
        `Forge as=user,accountId=${authContext.accountId}`;
      requestHeaders['Authorization'] = `Bearer ${authContext.accessToken}`;
    }

    const init: RequestInit = {
      method,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    return fetch(targetUrl, init);
  }
}
```

### Step 2: Update `OfflineTokenManager` to accept `appSystemToken`

Currently `OfflineTokenManager` constructs the `forge-proxy-authorization` header from
`installationId` alone. For a Remote, the token is the `appSystemToken` from the payload.

The GraphQL endpoint authenticates using this header format:
```
forge-proxy-authorization: Forge as=app,installationId=<id>
```

This is the same format as Containers — `appSystemToken` is not placed in this header; it
is **separately validated by the proxy** via the environment. So `OfflineTokenManager` does
NOT need to change for the basic case.

However, we should verify whether the Forge documentation specifies any difference in how
the egress proxy authenticates Remotes vs Containers. If `appSystemToken` needs to be
included in the header:

```
forge-proxy-authorization: Forge as=app,installationId=<id>,token=<appSystemToken>
```

This is a **known open question** that needs testing in a real Forge Remote environment
before implementation can be finalised. See the Testing Plan below.

### Step 3: Export from `@forge-clients/core`

Add to `packages/core/src/adapters/index.ts`:
```typescript
export { ForgeRemoteAdapter } from './ForgeRemoteAdapter.js';
export type { ForgeRemoteAdapterOptions } from './ForgeRemoteAdapter.js';
```

### Step 4: Add `ForgeInvocationPayload` type helper

Add a convenience type to help users extract the right fields from the Forge payload:

**File:** `packages/core/src/types/ForgeRemotePayload.ts`

```typescript
/**
 * The payload Forge sends to a Remote endpoint for each invocation.
 * Use this to extract installationId and appSystemToken for ForgeRemoteAdapter.
 *
 * Note: Only the fields relevant to ForgeRemoteAdapter are typed here.
 * The full payload may contain additional product-specific context fields.
 */
export interface ForgeRemotePayload {
  /** ARI of the installation: "ari:cloud:ecosystem::installation/<uuid>" */
  installationId: string;
  /** ARI of the installation context: "ari:cloud:jira::site/<cloudId>" */
  installationContext: string;
  /** Short-lived app system token for this invocation */
  appSystemToken: string;
  /** Calling user context (if invoked in a user context) */
  context?: {
    accountId?: string;
    cloudId?: string;
    [key: string]: unknown;
  };
  /** The actual invocation payload from the Forge module */
  payload?: unknown;
}

/**
 * Convenience factory — create a ForgeRemoteAdapter from a Forge Remote payload.
 *
 * @example
 * const adapter = adapterFromForgePayload(payload, 'jira');
 */
export function adapterFromForgePayload(
  payload: ForgeRemotePayload,
  product: 'jira' | 'confluence',
): ForgeRemoteAdapter {
  return new ForgeRemoteAdapter({
    product,
    installationId: payload.installationId,
    appSystemToken: payload.appSystemToken,
  });
}
```

### Step 5: Documentation

Add JSDoc with a full usage example to `ForgeRemoteAdapter`. Add to the core package
`README.md` a section on "Forge Remote" with:
- When to use this adapter
- How to extract the required fields from the Forge payload
- The difference between stateless (per-invocation) and stateful (long-running server) usage

---

## Testing Plan

The `ForgeRemoteAdapter` cannot be tested via the existing closed-loop tester (which uses
`ForgeFunctionAdapter` via webtrigger). A separate test harness is needed:

### Test Approach 1: Forge Remote + Webtrigger pair
1. Declare a `webtrigger` module in the manifest pointing to a Forge Function
2. Declare a `remote` module pointing to an external service (ngrok tunnel for local dev)
3. The Forge Function (webtrigger handler) invokes the remote via `api.invokeRemote()`
4. The remote handler uses `ForgeRemoteAdapter` to make Jira API calls
5. Results returned to webtrigger → curl → LLM checks logs

### Test Approach 2: Mock egress proxy
Write unit tests that mock `FORGE_EGRESS_PROXY_URL` with a local HTTP server and verify:
- Correct `forge-proxy-authorization` header format for `asApp`
- Correct `Authorization: Bearer` header for `asUser` (after mock GraphQL token fetch)
- Correct `offlineUser` pass-through
- Query string building
- Error propagation from the proxy

### Open Questions Requiring Real-World Testing

1. **`appSystemToken` header inclusion:** Does the egress proxy require `appSystemToken` in
   the `forge-proxy-authorization` header, or is it validated out-of-band?
   - If required: `Forge as=app,installationId=<id>,token=<appSystemToken>`
   - If not required: `Forge as=app,installationId=<id>` (same as Containers)

2. **GraphQL endpoint availability:** Is the `${FORGE_EGRESS_PROXY_URL}/graphql` endpoint
   available from a Remote's environment the same way it is from Containers?

3. **`asUser` scope declaration:** Does Forge Remote require the same
   `impersonation: true` scope declaration in `manifest.yml` as Forge Functions?

4. **Token lifetime:** Are offline tokens from a Remote shorter-lived than from Containers?

---

## Open Questions / Follow-Up

- [ ] Verify `appSystemToken` header format by testing against a real Forge Remote endpoint
- [ ] Confirm GraphQL token endpoint availability from Remote environment
- [ ] Test `asUser` scope requirements for Remotes
- [ ] Decide whether `OfflineTokenManager` needs a `appSystemToken` parameter
- [ ] Consider adding a `ForgeRemotePayload` type to `@forge-clients/core` as a convenience
- [ ] Add to closed-loop tester: Phase 3 tests for `ForgeRemoteAdapter` once a Remote
      environment is set up

---

## Relationship to Existing Adapters

```
ForgeAdapter (interface)
├── ForgeFunctionAdapter    → Forge Functions     → @forge/api (assumeTrustedRoute)
├── ForgeBridgeAdapter      → Custom UI frontend  → @forge/bridge (invoke)
├── ForgeContainerAdapter   → Forge Containers    → FORGE_EGRESS_PROXY_URL (long-running)
└── ForgeRemoteAdapter  ← NEW
                            → Forge Remotes       → FORGE_EGRESS_PROXY_URL (per-invocation)
                                                    installationId + appSystemToken from payload
```

The key distinction: `ForgeContainerAdapter` is designed for a **long-running process**
that discovers its installation context via `GET /v0/installations`. `ForgeRemoteAdapter`
is designed for a **stateless per-invocation handler** where the installation context
arrives in every request payload.

---

## Estimated Effort

| Task | Estimate |
|---|---|
| `ForgeRemoteAdapter` implementation | 2–3 hours |
| `ForgeInvocationPayload` types + `adapterFromForgePayload` factory | 1 hour |
| Unit tests (mock egress proxy) | 3–4 hours |
| Real-world testing against Forge Remote | 2–4 hours (environment setup + iteration) |
| Documentation + README update | 1 hour |
| **Total** | **9–13 hours** |

Most of the uncertainty is in the real-world testing phase, specifically the open questions
around `appSystemToken` header format and GraphQL endpoint availability.
