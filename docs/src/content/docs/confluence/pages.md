---
title: Confluence — Pages
description: Creating and managing Confluence pages with @forge-clients.
---

```typescript
import { ForgeFunctionAdapter, asApp, asUser } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
```

## Get a page

```typescript
import { getContentById } from '@forge-clients/confluence/v1';

const page = await getContentById(asApp(adapter), {
  path: { id: '123456' },
  expand: ['body.storage', 'version', 'space'],
});

console.log(page.title);
console.log(page.body?.storage?.value); // HTML storage format
```

## Create a page

Pages should typically be created as the user, not as the app:

```typescript
import { createContent } from '@forge-clients/confluence/v1';

const newPage = await createContent(asUser(adapter), {
  body: {
    type: 'page',
    title: 'My New Page',
    space: { key: 'MYSPACE' },
    body: {
      storage: {
        value: '<p>Hello, Confluence!</p>',
        representation: 'storage',
      },
    },
  },
});

console.log(newPage.id);           // '123457'
console.log(newPage._links?.webui); // Browser URL
```

## Update a page

```typescript
import { updateContent } from '@forge-clients/confluence/v1';

await updateContent(asUser(adapter), {
  path: { id: '123456' },
  body: {
    type: 'page',
    title: 'Updated Title',
    version: { number: 2 }, // Must be current version + 1
    body: {
      storage: {
        value: '<p>Updated content.</p>',
        representation: 'storage',
      },
    },
  },
});
```

## Delete a page

```typescript
import { deleteContent } from '@forge-clients/confluence/v1';

await deleteContent(asApp(adapter), { path: { id: '123456' } });
```
