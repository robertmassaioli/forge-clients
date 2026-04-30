---
editUrl: false
next: false
prev: false
title: "OfflineTokenManagerOptions"
---

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:19](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L19)

## Properties

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:23](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L23)

The installation ID for this app installation

***

### proxyUrl

> **proxyUrl**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:21](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L21)

The Forge egress proxy URL (process.env.FORGE_EGRESS_PROXY_URL)

***

### refreshBufferSeconds?

> `optional` **refreshBufferSeconds?**: `number`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:28](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L28)

How many seconds before expiry to proactively refresh the token.
Default: 60 seconds
