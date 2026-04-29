---
title: Jira — Users & Myself
description: Working with Jira user data in @forge-clients.
---

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
```

## Get the current user (as the app)

```typescript
import { getCurrentUser } from '@forge-clients/jira/v3';

const user = await getCurrentUser(asApp(adapter), {});
console.log(user.accountId);
console.log(user.displayName);
console.log(user.emailAddress);
```

## Get the current user (as the invoking user)

```typescript
const contextUser = await getCurrentUser(asUser(adapter), {});
console.log(`Logged in as: ${contextUser.displayName}`);
```

## Get a user by account ID

```typescript
import { getUser } from '@forge-clients/jira/v3';

const user = await getUser(asApp(adapter), {
  accountId: 'account:abc123',
  expand: 'groups,applicationRoles',
});
```

## Search for users

```typescript
import { findUsers } from '@forge-clients/jira/v3';

const users = await findUsers(asApp(adapter), {
  query: 'jane',
  maxResults: 10,
});

for (const user of users) {
  console.log(`${user.displayName} (${user.accountId})`);
}
```
