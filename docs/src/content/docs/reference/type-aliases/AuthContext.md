---
editUrl: false
next: false
prev: false
title: "AuthContext"
---

> **AuthContext** = \{ `type`: `"asApp"`; \} \| \{ `type`: `"asUser"`; `userId?`: `string`; \} \| \{ `accessToken`: `string`; `accountId`: `string`; `type`: `"offlineUser"`; \}

Defined in: [packages/core/src/adapters/ForgeAdapter.ts:19](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/adapters/ForgeAdapter.ts#L19)

Discriminated union describing who is making an API request.

- `asApp` — the Forge app itself (app-scoped permissions)
- `asUser` — a live user session (the currently invoking user, or a specific userId)
- `offlineUser` — a user impersonated without a live session via a pre-fetched access token

Create auth contexts with the helper functions [asApp](/forge-clients/reference/functions/asapp/), [asUser](/forge-clients/reference/functions/asuser/), or [asOfflineUser](/forge-clients/reference/functions/asofflineuser/)
rather than constructing this union type directly.

## Union Members

### Type Literal

\{ `type`: `"asApp"`; \}

***

### Type Literal

\{ `type`: `"asUser"`; `userId?`: `string`; \}

***

### Type Literal

\{ `accessToken`: `string`; `accountId`: `string`; `type`: `"offlineUser"`; \}

#### accessToken

> **accessToken**: `string`

A short-lived access token for the given accountId.
Obtain this via OfflineTokenManager.getToken() or
ForgeRemoteTokenManager.getToken() before constructing the auth context.
Token fetching is always the caller's responsibility — the adapter
uses the token as-is and never fetches one internally.

##### Example

```ts
const token = await tokenManager.getToken(accountId);
const client = asOfflineUser(adapter, token.accountId, token.accessToken);
```

#### accountId

> **accountId**: `string`

#### type

> **type**: `"offlineUser"`
