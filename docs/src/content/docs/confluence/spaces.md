---
title: Confluence — Spaces
description: Listing and working with Confluence spaces.
---

## List all spaces

```typescript
import { getSpaces } from '@forge-clients/confluence/v1';

const spaces = await getSpaces(adapter, { type: 'asApp' }, {
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

const space = await getSpace(adapter, { type: 'asApp' }, {
  spaceKey: 'MYSPACE',
  expand: ['description.plain', 'homepage'],
});

console.log(space.name);
console.log(space.homepage?.title);
```

## Collect all spaces

```typescript
import { iterateCursorPages } from '@forge-clients/core';
import { getSpaces } from '@forge-clients/confluence/v1';

let total = 0;
for await (const page of iterateCursorPages(
  (cursor) => getSpaces(adapter, { type: 'asApp' }, { cursor, limit: 25 }),
  (r) => r.results ?? [],
  (r) => r._links?.next ?? null,
)) {
  total += page.length;
}
console.log(`Total spaces: ${total}`);
```
