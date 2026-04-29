---
title: Jira — Users & Myself
description: Working with Jira user data in @forge-clients.
---

## Get the current user (asApp)

```typescript
import { getCurrentUser } from '@forge-clients/jira/v3';

const user = await getCurrentUser(adapter, { type: 'asApp' }, {});
console.log(user.accountId);
console.log(user.displayName);
console.log(user.emailAddress);
```

## Get the current user (asUser — context user)

```typescript
const contextUser = await getCurrentUser(adapter, { type: 'asUser' }, {});
console.log(`Logged in as: ${contextUser.displayName}`);
```

## Get a user by account ID

```typescript
import { getUser } from '@forge-clients/jira/v3';

const user = await getUser(adapter, { type: 'asApp' }, {
  accountId: 'account:abc123',
  expand: 'groups,applicationRoles',
});
```

## Search for users

```typescript
import { findUsers } from '@forge-clients/jira/v3';

const users = await findUsers(adapter, { type: 'asApp' }, {
  query: 'jane',
  maxResults: 10,
});

for (const user of users) {
  console.log(`${user.displayName} (${user.accountId})`);
}
```
