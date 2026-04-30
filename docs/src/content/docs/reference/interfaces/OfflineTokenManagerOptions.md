---
editUrl: false
next: false
prev: false
title: "OfflineTokenManagerOptions"
---

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:19](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L19)

## Properties

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:23](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L23)

The installation ID for this app installation

***

### proxyUrl

> **proxyUrl**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:21](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L21)

The Forge egress proxy URL (process.env.FORGE_EGRESS_PROXY_URL)

***

### refreshBufferSeconds?

> `optional` **refreshBufferSeconds?**: `number`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:28](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L28)

How many seconds before expiry to proactively refresh the token.
Default: 60 seconds
