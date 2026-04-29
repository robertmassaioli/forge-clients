---
title: Confluence — Spaces
description: Listing and working with Confluence spaces.
---

```typescript
import { ForgeFunctionAdapter, asApp } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
```

## List all spaces

```typescript
import { getSpaces } from '@forge-clients/confluence/v1';

const spaces = await getSpaces(asApp(adapter), {
  limit: 25,
  type: 'global',
  expand: ['description.plain'],
});

for (const space of spaces.results ?? []) {
  console.log(`${space.key}: ${space.name}`);
}
```

## Get a single space

```typescript
import { getSpace } from '@forge-clients/confluence/v1';

const space = await getSpace(asApp(adapter), {
  path: { spaceKey: 'MYSPACE' },
  expand: ['description.plain', 'homepage'],
});

console.log(space.name);
console.log(space.homepage?.title);
```
