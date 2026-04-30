---
editUrl: false
next: false
prev: false
title: "asOfflineUser"
---

> **asOfflineUser**(`adapter`, `accountId`, `accessToken`): [`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

Defined in: [packages/core/src/client/BoundClient.ts:107](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/client/BoundClient.ts#L107)

Make API calls on behalf of a user via offline impersonation.

Used in **Forge Containers** and **Forge Remotes** where there is no live
user session. The accessToken must be obtained from OfflineTokenManager
(for Containers) or ForgeRemoteTokenManager (for Remotes).

## Parameters

### adapter

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

The ForgeAdapter for the target product

### accountId

`string`

The Atlassian account ID of the user to impersonate

### accessToken

`string`

The short-lived offline access token for the user

## Returns

[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

## Example

```typescript
import { asOfflineUser, OfflineTokenManager } from '@forge-clients/core';
import { getIssue } from '@forge-clients/jira/v3';

const tokenManager = new OfflineTokenManager({ proxyUrl, installationId });
const token = await tokenManager.getToken('user-account-id');
const client = asOfflineUser(adapter, token.accountId, token.accessToken);
const issue = await getIssue(client, { issueIdOrKey: 'PROJ-1' });
```
