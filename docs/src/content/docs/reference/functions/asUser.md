---
editUrl: false
next: false
prev: false
title: "asUser"
---

> **asUser**(`adapter`, `userId?`): [`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

Defined in: [packages/core/src/client/BoundClient.ts:78](https://github.com/robertmassaioli/forge-clients/blob/3f7c32ba25aedbdd980cdc60fc4d14b74ddfa0e2/packages/core/src/client/BoundClient.ts#L78)

Make API calls on behalf of the currently logged-in user.

- In **Forge Functions**: the invoking user's identity is used automatically
  when no userId is provided.
- In **Custom UI / UI Kit 2**: user identity is managed by the bridge.
- In **Forge Remotes**: pass `payload.context.accountId` as the userId.

## Parameters

### adapter

[`ForgeAdapter`](/forge-clients/reference/interfaces/forgeadapter/)

The ForgeAdapter for the target product

### userId?

`string`

Optional Atlassian account ID. If omitted, Forge uses the
                 invoking user's identity automatically.

## Returns

[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

## Example

```typescript
import { asUser } from '@forge-clients/core';
import { getMyself } from '@forge-clients/jira/v3';

// Without userId — uses the invoking user:
const client = asUser(adapter);
const me = await getMyself(client);

// With explicit userId (e.g. from a Forge Remote payload):
const client = asUser(adapter, payload.context.accountId);
```
