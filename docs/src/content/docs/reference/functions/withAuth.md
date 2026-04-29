---
editUrl: false
next: false
prev: false
title: "withAuth"
---

> **withAuth**(`client`, `authContext`): [`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

Defined in: [packages/core/src/client/BoundClient.ts:128](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/client/BoundClient.ts#L128)

Create a new BoundClient with a different auth context, reusing the same
underlying adapter. Useful for switching auth mid-handler.

## Parameters

### client

[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

### authContext

[`AuthContext`](/forge-clients/reference/type-aliases/authcontext/)

## Returns

[`BoundClient`](/forge-clients/reference/interfaces/boundclient/)

## Example

```typescript
import { asApp, withAuth } from '@forge-clients/core';

const appClient = asApp(adapter);
// Switch to user context for certain operations:
const userClient = withAuth(appClient, { type: 'asUser', userId: 'abc' });
```
