---
editUrl: false
next: false
prev: false
title: "OfflineUserToken"
---

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:12](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L12)

Manages offline user impersonation tokens for Forge Containers and Remotes.

Offline user impersonation allows Containers/Remotes to make API calls
on behalf of a specific user without a live user session. Tokens are
obtained via a GraphQL query through the Forge egress proxy and are
short-lived (must be refreshed before expiry).

NOT needed in Forge Functions — use api.asUser() there instead.

## Properties

### accessToken

> **accessToken**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:13](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L13)

***

### accountId

> **accountId**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:16](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L16)

***

### expiry

> **expiry**: `number`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:15](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L15)

Unix timestamp (seconds) when the token expires
