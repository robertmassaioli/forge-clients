---
editUrl: false
next: false
prev: false
title: "ForgeRemoteTokenManager"
---

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:64](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L64)

Manages offline user impersonation tokens for Forge Remote backends.

Similar to [OfflineTokenManager](/forge-clients/reference/classes/offlinetokenmanager/) but authenticates using an `appSystemToken`
from the inbound invocation payload instead of relying on Container identity.

Because Forge Remotes are stateless per-invocation handlers, this manager is
typically instantiated fresh per request. Token caching is still valuable within
a single invocation that makes multiple API calls for the same user, and across
warm Lambda / Cloud Run invocations where the handler module stays alive.

## Example

```typescript
import { ForgeRemoteAdapter, ForgeRemoteTokenManager, asOfflineUser } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

export async function handler(payload: ForgeInvocationPayload) {
  const adapter = new ForgeRemoteAdapter({ product: 'jira', proxyUrl, installationId: payload.installationId, appSystemToken: payload.appSystemToken });
  const tokenManager = new ForgeRemoteTokenManager({ proxyUrl, installationId: payload.installationId, appSystemToken: payload.appSystemToken });

  const token = await tokenManager.getToken(payload.context.accountId!);
  const client = asOfflineUser(adapter, token.accountId, token.accessToken);
  return getIssue(client, { path: { issueIdOrKey: 'PROJ-1' } });
}
```

## Constructors

### Constructor

> **new ForgeRemoteTokenManager**(`opts`): `ForgeRemoteTokenManager`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:72](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L72)

Create a new ForgeRemoteTokenManager.

#### Parameters

##### opts

[`ForgeRemoteTokenManagerOptions`](/forge-clients/reference/interfaces/forgeremotetokenmanageroptions/)

Configuration including the proxy URL, installation ID, and app system token

#### Returns

`ForgeRemoteTokenManager`

## Methods

### boundClient()

> **boundClient**(`adapter`, `accountId`): `Promise`\<[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)\>

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:112](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L112)

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
const tokenManager = new ForgeRemoteTokenManager({ ... });
const client = await tokenManager.boundClient(adapter, payload.context.accountId);
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
```

***

### getToken()

> **getToken**(`accountId`): `Promise`\<[`ForgeRemoteUserToken`](/forge-clients/reference/interfaces/forgeremoteusertoken/)\>

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:80](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L80)

Get a valid offline user token for the given accountId.
Returns the cached token if it is still valid, otherwise fetches a new one.

#### Parameters

##### accountId

`string`

#### Returns

`Promise`\<[`ForgeRemoteUserToken`](/forge-clients/reference/interfaces/forgeremoteusertoken/)\>

***

### invalidate()

> **invalidate**(`accountId`): `void`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:94](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L94)

Remove a cached token, forcing a fresh fetch on next getToken() call

#### Parameters

##### accountId

`string`

#### Returns

`void`

***

### invalidateAll()

> **invalidateAll**(): `void`

Defined in: [packages/core/src/auth/ForgeRemoteTokenManager.ts:99](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/auth/ForgeRemoteTokenManager.ts#L99)

Remove all cached tokens

#### Returns

`void`
