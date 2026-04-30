---
editUrl: false
next: false
prev: false
title: "OfflineUserToken"
---

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:12](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L12)

Manages offline user impersonation tokens for Forge Containers and Remotes.

Offline user impersonation allows Containers/Remotes to make API calls
on behalf of a specific user without a live user session. Tokens are
obtained via a GraphQL query through the Forge egress proxy and are
short-lived (must be refreshed before expiry).

NOT needed in Forge Functions — use api.asUser() there instead.

## Properties

### accessToken

> **accessToken**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:13](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L13)

***

### accountId

> **accountId**: `string`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:16](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L16)

***

### expiry

> **expiry**: `number`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:15](https://github.com/robertmassaioli/forge-clients/blob/001365db831fa8cdb4890f8532a0b0a0d5598f6c/packages/core/src/auth/OfflineTokenManager.ts#L15)

Unix timestamp (seconds) when the token expires
