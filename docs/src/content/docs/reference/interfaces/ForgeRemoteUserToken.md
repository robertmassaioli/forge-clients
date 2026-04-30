---
editUrl: false
next: false
prev: false
title: "ForgeRemoteUserToken"
---

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:14](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L14)

Token manager for Forge Remote backends.

Similar to OfflineTokenManager but accepts an appSystemToken from the
invocation payload rather than relying on Container identity.
Forge Remotes are stateless per-invocation handlers, so this manager
is typically instantiated fresh per invocation with a short-lived token.

Token caching is still valuable within a single invocation that makes
multiple API calls for the same user, and across warm Lambda/Cloud Run
invocations where the handler module is kept alive.

## Properties

### accessToken

> **accessToken**: `string`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:15](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L15)

***

### accountId

> **accountId**: `string`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:18](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L18)

***

### expiry

> **expiry**: `number`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:17](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L17)

Unix timestamp (seconds) when the token expires
