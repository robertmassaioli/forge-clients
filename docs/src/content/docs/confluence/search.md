---
title: Confluence — Search (CQL)
description: Searching Confluence content with CQL using @forge-clients.
---

```typescript
import { ForgeFunctionAdapter, asApp } from '@forge-clients/core';

const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
```

## Basic CQL search

```typescript
import { search } from '@forge-clients/confluence/v1';

const results = await search(asApp(adapter), {
  cql: 'space = "MYSPACE" AND type = page ORDER BY lastModified DESC',
  limit: 25,
  expand: ['version', 'space'],
});

console.log(`Found ${results.totalSize} results`);
for (const item of results.results ?? []) {
  console.log(item.content?.title);
}
```

## Search for pages containing text

```typescript
const textResults = await search(asApp(adapter), {
  cql: 'text ~ "deployment guide" AND type = page AND space.type = global',
  limit: 10,
});
```

## Search for recently updated content

```typescript
const recent = await search(asApp(adapter), {
  cql: 'lastModified >= "2024-01-01" AND type in (page, blogpost) ORDER BY lastModified DESC',
  limit: 50,
  expand: ['version'],
});
```

## Paginate through all search results

The `search` endpoint returns cursor-based pagination via `_links.next`.
Use `iterateCursorPages` to iterate through all results without loading them all into memory:

```typescript
import { iterateCursorPages } from '@forge-clients/core';
import { search } from '@forge-clients/confluence/v1';

const appClient = asApp(adapter);

// iterateCursorPages yields individual search result items
for await (const result of iterateCursorPages(
  (cursor) => search(appClient, {
    cql: 'space = "MYSPACE" AND type = page ORDER BY lastModified DESC',
    limit: 25,
    cursor,
  }),
)) {
  // result is a SearchResult — fully typed
  console.log(result.content?.title);
  console.log(result.url);
}
```

For smaller result sets where you want everything in one array, collect them manually:

```typescript
const allResults: SearchResult[] = [];
for await (const result of iterateCursorPages(
  (cursor) => search(appClient, { cql: 'space = "MYSPACE"', limit: 50, cursor }),
)) {
  allResults.push(result);
}
```
