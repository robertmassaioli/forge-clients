# Functional Auth Chaining — Design Proposal

**Author:** Robert Massaioli  
**Date:** 2026-04-29  
**Status:** Draft  
**Related:** `forge-remote-adapter.md`, `documentation-microsite.md`

---

## Problem Statement

The current generated SDK function signature is clunky because `authContext` sits as
a positional argument between the adapter and the params:

```typescript
// Current — three separate arguments, auth in the middle
await getBanner(adapter, { type: 'asApp' });
await getIssue(adapter, { type: 'asUser', userId: 'abc' }, { issueIdOrKey: 'PROJ-1' });
await setBanner(adapter, { type: 'asApp' }, { body: updatedBanner });
```

Problems with this:
1. **Positional clutter** — middle arguments are easy to transpose or omit
2. **Repetition** — every call in a handler that uses the same auth context repeats `{ type: 'asApp' }`
3. **Not discoverable** — new users don't know what auth contexts are available without reading docs
4. **Not chainable** — you cannot partial-apply the auth context and pass a "contextualised client" around
5. **Params are optional but auth is not** — having `authContext` before `params` forces a default value hack
6. **Poor tree-shaking story for auth helpers** — nothing to import that carries intent

---

## Goals

1. **Ergonomic** — the happy path should read like English
2. **Tree-shakeable** — every helper must be an importable function, not a method
3. **No runtime overhead** — pure functional composition with zero allocations on the hot path
4. **Backwards compatible option** — existing direct call style should still work (or be easy to migrate)
5. **Type-safe** — the TypeScript types should guide correct usage
6. **Generator-friendly** — the generated `sdk.gen.ts` should require minimal changes

---

## Proposed Design: Bound Client (Context Object)

The core idea is a small, tree-shakeable `BoundClient` type that captures
`adapter + authContext` together, and helper functions `asApp()`, `asUser()`,
`asOfflineUser()` that create it. All generated SDK functions accept a
`BoundClient` as their first argument instead of `(adapter, authContext)`.

### The `BoundClient` Type (in `@forge-clients/core`)

```typescript
// packages/core/src/client/BoundClient.ts

import type { ForgeAdapter, AuthContext } from '../adapters/ForgeAdapter.js';

/**
 * A ForgeAdapter bound to a specific auth context.
 * Create one with asApp(), asUser(), or asOfflineUser().
 *
 * BoundClient is intentionally a plain object (not a class) so that
 * it is fully tree-shakeable and has zero prototype overhead.
 */
export interface BoundClient {
  readonly adapter: ForgeAdapter;
  readonly authContext: AuthContext;
}

/**
 * Make API calls as the Forge app itself.
 * This is the default and most common auth context.
 *
 * @example
 * const client = asApp(adapter);
 * const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
 */
export function asApp(adapter: ForgeAdapter): BoundClient {
  return { adapter, authContext: { type: 'asApp' } };
}

/**
 * Make API calls on behalf of the currently logged-in user.
 * In Forge Functions, this is the user who triggered the action.
 * In Custom UI / UI Kit 2, this is implicit (the bridge handles it).
 *
 * @param adapter - The ForgeAdapter for the target product
 * @param userId  - Optional Atlassian account ID. If omitted, Forge
 *                  uses the invoking user's identity automatically.
 *
 * @example
 * const client = asUser(adapter);
 * const myself = await getMyself(client);
 *
 * @example
 * // With explicit userId (e.g. from a Forge Remote payload):
 * const client = asUser(adapter, payload.context.accountId);
 */
export function asUser(adapter: ForgeAdapter, userId?: string): BoundClient {
  return { adapter, authContext: { type: 'asUser', userId } };
}

/**
 * Make API calls on behalf of a user via offline impersonation.
 * Used in Forge Containers and Remotes where there is no live user session.
 * The accessToken must be obtained from OfflineTokenManager or ForgeRemoteTokenManager.
 *
 * @example
 * const tokenManager = new OfflineTokenManager({ ... });
 * const token = await tokenManager.getToken(accountId);
 * const client = asOfflineUser(adapter, token.accountId, token.accessToken);
 * const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
 */
export function asOfflineUser(
  adapter: ForgeAdapter,
  accountId: string,
  accessToken: string,
): BoundClient {
  return { adapter, authContext: { type: 'offlineUser', accountId, accessToken } };
}
```

### Updated Generated SDK Function Signature

```typescript
// Before (current):
export async function getIssue(
  adapter: ForgeAdapter,
  authContext: AuthContext = { type: 'asApp' },
  params: GetIssueParams,
): Promise<Types.IssueBean>

// After (proposed):
export async function getIssue(
  client: BoundClient,
  params: GetIssueParams,
): Promise<Types.IssueBean>
```

The function body changes minimally:

```typescript
// Before:
const response = await adapter.fetch({ method: 'GET', path, authContext, queryParams });

// After:
const response = await client.adapter.fetch({
  method: 'GET', path, queryParams,
  authContext: client.authContext,
});
```

### Usage — The Happy Path

```typescript
import { asApp, asUser, asOfflineUser } from '@forge-clients/core';
import { getIssue, createIssue, searchForIssuesUsingJql } from '@forge-clients/jira/v3';

// ── Forge Function ────────────────────────────────────────────────────────────

// As the app:
const app = asApp(adapter);
const issue = await getIssue(app, { issueIdOrKey: 'PROJ-1' });

// As the current user:
const user = asUser(adapter);
const myIssues = await searchForIssuesUsingJql(user, { body: { jql: 'assignee = currentUser()' } });

// ── Forge Remote ──────────────────────────────────────────────────────────────

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = adapterFromForgePayload(payload, 'jira');

  // App-level operations:
  const appClient = asApp(adapter);
  const projects = await getProjects(appClient, {});

  // User-level operations for the invoking user:
  const userClient = asUser(adapter, payload.context.accountId);
  const issue = await getIssue(userClient, { issueIdOrKey: 'PROJ-1' });

  // Offline user impersonation:
  const token = await tokenManager.getToken('user-account-id');
  const offlineClient = asOfflineUser(adapter, token.accountId, token.accessToken);
  const offlineIssue = await getIssue(offlineClient, { issueIdOrKey: 'PROJ-2' });
}

// ── Passing clients around ────────────────────────────────────────────────────

// Because BoundClient is a plain object, you can pass it to helper functions:
async function processIssue(client: BoundClient, issueKey: string) {
  const issue = await getIssue(client, { issueIdOrKey: issueKey });
  await addComment(client, { issueIdOrKey: issueKey, body: { body: buildAdf('Done') } });
}

// Call with any auth context:
await processIssue(asApp(adapter), 'PROJ-1');
await processIssue(asUser(adapter), 'PROJ-2');
```

---

## Tree-Shaking Analysis

The proposed design is **fully tree-shakeable**:

```typescript
// If you only use asApp() and getIssue(), bundlers eliminate:
// - asUser() ✓ eliminated
// - asOfflineUser() ✓ eliminated
// - OfflineTokenManager ✓ eliminated
// - ForgeRemoteTokenManager ✓ eliminated
// - All other SDK functions ✓ eliminated (if not imported)
```

`BoundClient` is an interface (zero runtime cost — erased by TypeScript).
`asApp`, `asUser`, `asOfflineUser` are standalone exported functions — each is an
independent import that bundlers can tree-shake independently.

Contrast with a class-based approach:

```typescript
// ❌ Class-based — NOT tree-shakeable
class ForgeClient {
  asApp() { ... }       // bundled even if never called
  asUser() { ... }      // bundled even if never called
  asOfflineUser() { ... } // bundled even if never called
}
```

---

## Comparison with Alternative Approaches

### Alternative 1: Method chaining on adapter (fluent builder)

```typescript
// Builder-style
const issue = await adapter.asApp().getIssue({ issueIdOrKey: 'PROJ-1' });
const issue = await adapter.asUser().getIssue({ issueIdOrKey: 'PROJ-1' });
```

**Pros:** Very readable, similar to `@forge/api` style.  
**Cons:**
- **Not tree-shakeable** — `getIssue` is a method on an object that must carry
  all methods. 1,529 operations across 5 specs = 1,529 methods that can't be shaken.
- **Tight coupling** — adapters would need to know about every generated function.
- **Generator complexity** — the generator would need to produce adapter subclasses.
- **Not composable** — you can't pass a partially-applied client around without
  passing the entire adapter.

### Alternative 2: Partial application / curry

```typescript
// Curried — returns a function that takes params
const appGetIssue = getIssue(asApp(adapter));
const issue = await appGetIssue({ issueIdOrKey: 'PROJ-1' });
```

**Pros:** Very functional, extremely composable.  
**Cons:**
- TypeScript's type inference with curried async functions is painful.
- Two-step call syntax is unfamiliar to most JavaScript developers.
- Each partial application creates a closure — minor but real memory overhead at scale.
- Harder to read at a glance what the function does.

### Alternative 3: Options object merging

```typescript
// All in one options object
const issue = await getIssue({
  adapter,
  auth: { type: 'asApp' },
  params: { issueIdOrKey: 'PROJ-1' },
});
```

**Pros:** Single argument, no ordering confusion.  
**Cons:**
- More verbose — nesting params inside another object.
- Harder to destructure at the call site.
- `auth` and `adapter` are repeated on every call.
- Tree-shaking: no impact (same as BoundClient).

### Alternative 4: Context object (React-style)

```typescript
// Context propagation
const ctx = createForgeContext(adapter, { type: 'asApp' });
const issue = await getIssue(ctx, { issueIdOrKey: 'PROJ-1' });
```

This is essentially the BoundClient proposal with a different name. No material difference.

### ✅ Recommended: BoundClient with `asApp()` / `asUser()` / `asOfflineUser()`

| Criterion | BoundClient | Method chain | Curry | Options object |
|-----------|-------------|--------------|-------|----------------|
| Tree-shakeable | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Readable | ✅ Yes | ✅ Yes | ⚠️ Moderate | ⚠️ Verbose |
| Composable | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Moderate |
| TS type safety | ✅ Excellent | ✅ Excellent | ⚠️ Complex | ✅ Excellent |
| Generator change | ✅ Minimal | ❌ Major | ⚠️ Moderate | ✅ Minimal |
| Familiar pattern | ✅ Yes | ✅ Yes | ⚠️ FP-only | ✅ Yes |
| Runtime overhead | ✅ None | ❌ Prototype chain | ⚠️ Closures | ✅ None |

---

## Migration Path

### Phase 1 — Add `BoundClient` to `@forge-clients/core` (non-breaking)

Add `BoundClient`, `asApp()`, `asUser()`, `asOfflineUser()` to `@forge-clients/core`.
No changes to generated functions yet. Users can start using the new helpers
by building their own wrapper:

```typescript
// Temporary compatibility shim (before Phase 2):
const app = asApp(adapter);
await getIssue(app.adapter, app.authContext, { issueIdOrKey: 'PROJ-1' });
//             ^^^^^^^^^^^  ^^^^^^^^^^^^^^^  still the old signature
```

### Phase 2 — Update generator to emit new signature (breaking: major version bump)

Change the generator (`SdkEmitter.ts`) to emit:

```typescript
// New signature
export async function getIssue(client: BoundClient, params: GetIssueParams)
```

This is a **breaking change** — all call sites must update from:
```typescript
getIssue(adapter, { type: 'asApp' }, params)
```
to:
```typescript
getIssue(asApp(adapter), params)
```

Since the package hasn't been published yet, this can be done before the first
npm publish with no migration burden on external consumers.

### Phase 3 — Update closed-loop tester

Update `Forge-Rest-Development-Closed-Loop-Tester` to use the new syntax,
which doubles as a validation that the new API feels correct end-to-end.

---

## Generator Changes Required

In `SdkEmitter.ts`, the key change is in `emitOperationFunction()`:

```typescript
// Before — generates:
// (adapter: ForgeAdapter, authContext: AuthContext = { type: 'asApp' }, params: XParams)

// After — generates:
// (client: BoundClient, params: XParams)

// Import changes:
// Before: import type { ForgeAdapter, AuthContext } from '@forge-clients/core';
// After:  import type { BoundClient } from '@forge-clients/core';

// Fetch call changes:
// Before: await adapter.fetch({ ..., authContext })
// After:  await client.adapter.fetch({ ..., authContext: client.authContext })
```

The diff is small — approximately 4 lines changed per operation in `SdkEmitter.ts`
and one import change in the file header. All 1,529 generated functions benefit
automatically from a single generator change.

---

## Additional Enhancement: `withAuth()` helper

For cases where the auth context needs to be changed mid-handler (e.g. switching
from `asApp` to `asUser` for certain operations), a `withAuth()` helper is useful:

```typescript
/**
 * Create a new BoundClient with a different auth context,
 * reusing the same underlying adapter.
 *
 * @example
 * const appClient = asApp(adapter);
 * const userClient = withAuth(appClient, { type: 'asUser', userId: 'abc' });
 */
export function withAuth(client: BoundClient, authContext: AuthContext): BoundClient {
  return { adapter: client.adapter, authContext };
}
```

This is again a standalone exported function — fully tree-shakeable.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `packages/core/src/client/BoundClient.ts` | **Create** — BoundClient type + asApp/asUser/asOfflineUser/withAuth |
| `packages/core/src/client/index.ts` | **Create** — re-export from client/ |
| `packages/core/src/index.ts` | **Modify** — add `export * from './client/index.js'` |
| `packages/generator/src/generator/SdkEmitter.ts` | **Modify** — update function signature generation |
| `packages/jira/src/*/sdk.gen.ts` | **Regenerate** — new signatures (automated) |
| `packages/confluence/src/*/sdk.gen.ts` | **Regenerate** — new signatures (automated) |
| `Forge-Rest-Development-Closed-Loop-Tester/…` | **Update** — use new syntax in tests |

---

## Estimated Effort

| Task | Estimate |
|---|---|
| Add BoundClient + helpers to core | 30 min |
| Update SdkEmitter in generator | 1 hour |
| Regenerate all 5 specs | 5 min (automated) |
| Update closed-loop tester | 1 hour |
| Update documentation pages | 2 hours |
| **Total** | **~4.5 hours** |

This is a small, high-impact change that dramatically improves the ergonomics of
every single SDK call in every Forge app that uses `@forge-clients`.

---

## Open Questions

- [ ] Should `BoundClient` be called `ForgeClient`? (`ForgeClient` is more
      product-neutral but `BoundClient` better describes what it is)
- [ ] Should `asUser()` without a `userId` be the same as `asApp()` in Custom UI
      (where the bridge handles user identity implicitly)? Or should there be a
      separate `asBridgeUser()` for Custom UI?
- [ ] Should the `BoundClient` carry the product (`jira` | `confluence`) to
      enable type-level enforcement that you're using a Jira client with a Jira function?
