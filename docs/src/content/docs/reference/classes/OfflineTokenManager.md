---
editUrl: false
next: false
prev: false
title: "OfflineTokenManager"
---

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:51](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L51)

Manages offline user impersonation tokens for Forge Containers.

Fetches short-lived user access tokens through the Forge egress proxy
and caches them until they are close to expiry. This allows a Forge Container
to make API calls on behalf of specific users without a live user session.

## Example

```typescript
import { ForgeContainerAdapter, OfflineTokenManager, asOfflineUser } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const adapter = new ForgeContainerAdapter({ product: 'jira', proxyUrl, installationId });
const tokenManager = new OfflineTokenManager({ proxyUrl, installationId });

const token = await tokenManager.getToken('atlassian-account-id');
const client = asOfflineUser(adapter, token.accountId, token.accessToken);
const issue = await getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
```

## Constructors

### Constructor

> **new OfflineTokenManager**(`opts`): `OfflineTokenManager`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:59](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L59)

Create a new OfflineTokenManager.

#### Parameters

##### opts

[`OfflineTokenManagerOptions`](/forge-clients/reference/interfaces/offlinetokenmanageroptions/)

Configuration including the proxy URL and installation ID

#### Returns

`OfflineTokenManager`

## Methods

### boundClient()

> **boundClient**(`adapter`, `accountId`): `Promise`\<[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)\>

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:99](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L99)

Convenience method — fetch a valid token and return a BoundClient
for offline user impersonation. Caches the token internally.

#### Parameters

##### adapter

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

##### accountId

`string`

#### Returns

`Promise`\<[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)\>

#### Example

```ts
const client = await tokenManager.boundClient(adapter, accountId);
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
```

***

### getToken()

> **getToken**(`accountId`): `Promise`\<[`OfflineUserToken`](/forge-clients/reference/interfaces/offlineusertoken/)\>

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:68](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L68)

Get a valid offline user token for the given accountId.
Automatically fetches a new token if none is cached or if the cached
token is within refreshBufferSeconds of expiry.

#### Parameters

##### accountId

`string`

#### Returns

`Promise`\<[`OfflineUserToken`](/forge-clients/reference/interfaces/offlineusertoken/)\>

***

### invalidate()

> **invalidate**(`accountId`): `void`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:82](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L82)

Remove a cached token, forcing a fresh fetch on next getToken() call

#### Parameters

##### accountId

`string`

#### Returns

`void`

***

### invalidateAll()

> **invalidateAll**(): `void`

Defined in: [packages/core/src/auth/OfflineTokenManager.ts:87](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/OfflineTokenManager.ts#L87)

Remove all cached tokens

#### Returns

`void`
