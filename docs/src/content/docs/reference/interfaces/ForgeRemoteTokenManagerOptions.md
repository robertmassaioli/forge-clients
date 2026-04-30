---
editUrl: false
next: false
prev: false
title: "ForgeRemoteTokenManagerOptions"
---

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:21](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L21)

## Properties

### appSystemToken

> **appSystemToken**: `string`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:30](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L30)

The app system token from the Forge Remote invocation payload.
Used to authenticate the GraphQL request to fetch user tokens.

***

### installationId

> **installationId**: `string`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:25](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L25)

The installation ID for this app installation

***

### proxyUrl

> **proxyUrl**: `string`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:23](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L23)

The Forge egress proxy URL

***

### refreshBufferSeconds?

> `optional` **refreshBufferSeconds?**: `number`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:35](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L35)

How many seconds before expiry to proactively refresh the token.
Default: 60 seconds.
