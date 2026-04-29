---
title: Pagination
description: Working with paginated Jira and Confluence API responses.
---

Many Jira and Confluence endpoints return paginated results. `@forge-clients/core`
provides three helpers that hide the pagination loop from your code.

## Atlassian pagination models

Atlassian uses two pagination models:

**Offset-based** (most Jira v3 endpoints, Confluence v1 content):
```json
{ "startAt": 0, "maxResults": 50, "total": 243, "values": [...] }
```
Some endpoints use `issues` or `results` instead of `values` — the helpers handle all three automatically.

**Cursor-based** (Confluence v2, some Jira v3 endpoints):
```json
{ "results": [...], "_links": { "next": "/rest/api/v2/...?cursor=abc123" } }
```

## The `OffsetPage` interface

All offset-based helpers work with any response that matches this shape:

```typescript
interface OffsetPage<T> {
  values?: T[];    // used by most Jira endpoints
  issues?: T[];   // used by Jira search endpoints
  results?: T[];  // used by Confluence endpoints
  total?: number;
  isLast?: boolean;
  startAt?: number;
  maxResults?: number;
}
```

The helpers check `isLast`, `total`, and the number of returned items to know when to stop — you don't need to pass any of these explicitly.

---

## `collectAllPages` — load all results into memory

Use when you need all results at once and the total count is manageable (< ~1,000 items).
Returns a `Promise<T[]>` — waits for all pages before resolving.

```typescript
import { ForgeFunctionAdapter, asApp, collectAllPages } from '@forge-clients/core';
import { searchProjects } from '@forge-clients/jira/v3';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
const appClient = asApp(adapter);

// collectAllPages(fetchPage, pageSize?)
// fetchPage receives (startAt, maxResults) and must return Promise<OffsetPage<T>>
const allProjects = await collectAllPages(
  (startAt, maxResults) => searchProjects(appClient, { startAt, maxResults }),
  50, // optional pageSize, default 50
);

console.log(`Loaded ${allProjects.length} projects`);
// allProjects is ProjectBean[] — fully typed
```

### When does it stop fetching?

`collectAllPages` stops when **any** of these conditions is true:
- `page.isLast === true`
- `page.total !== undefined && results.length >= page.total`
- The number of items returned is less than `pageSize` (partial page = last page)

---

## `iteratePages` — process items one at a time (memory-efficient)

Use for large result sets where you want to process each item as it arrives,
or when you might stop early. `iteratePages` yields **individual items** (not pages),
fetching the next page only when needed.

```typescript
import { ForgeFunctionAdapter, asApp, iteratePages } from '@forge-clients/core';
import { searchForIssuesUsingJqlPost } from '@forge-clients/jira/v3';

const adapter = new ForgeFunctionAdapter({ product: 'jira' });
const appClient = asApp(adapter);

// iteratePages(fetchPage, pageSize?)
// fetchPage receives (startAt, maxResults) and must return Promise<OffsetPage<T>>
for await (const issue of iteratePages(
  (startAt, maxResults) => searchForIssuesUsingJqlPost(appClient, {
    body: { jql: 'project = PROJ ORDER BY created DESC', startAt, maxResults },
  }),
  100, // optional pageSize, default 50
)) {
  // issue is IssueBean — fully typed
  console.log(`${issue.key}: ${issue.fields?.summary}`);

  // Early exit — stops fetching further pages
  if (issue.fields?.status?.name === 'Done') break;
}
```

### `iteratePages` vs `collectAllPages`

| | `collectAllPages` | `iteratePages` |
|---|---|---|
| Returns | `Promise<T[]>` | `AsyncGenerator<T>` |
| Memory | Loads all into memory | One page at a time |
| Early exit | ❌ Always fetches everything | ✅ `break` stops fetching |
| Best for | Small-medium result sets | Large sets, or when you might stop early |

---

## `iterateCursorPages` — cursor-based pagination

For endpoints that use a `next` cursor link instead of `startAt`. Yields **individual items**.

```typescript
import { ForgeFunctionAdapter, asApp, iterateCursorPages } from '@forge-clients/core';
import { getContentSearch } from '@forge-clients/confluence/v1';

const adapter = new ForgeFunctionAdapter({ product: 'confluence' });
const appClient = asApp(adapter);

// iterateCursorPages(fetchPage)
// fetchPage receives the cursor string (or undefined for first page)
// and must return Promise<{ results: T[]; _links?: { next?: string } }>
for await (const result of iterateCursorPages(
  (cursor) => getContentSearch(appClient, {
    cql: 'space = "MYSPACE" AND type = page',
    cursor,
    limit: 25,
  }),
)) {
  // result is fully typed from the Confluence spec
  console.log(result.content?.title);
}
```

The cursor is automatically extracted from the `_links.next` URL on each page.
Iteration stops when `_links.next` is absent or empty.

---

## Quick reference

```typescript
import { collectAllPages, iteratePages, iterateCursorPages } from '@forge-clients/core';

// Offset pagination — load all
const all = await collectAllPages(
  (startAt, maxResults) => myEndpoint(client, { startAt, maxResults }),
);

// Offset pagination — stream items
for await (const item of iteratePages(
  (startAt, maxResults) => myEndpoint(client, { startAt, maxResults }),
)) { /* ... */ }

// Cursor pagination — stream items
for await (const item of iterateCursorPages(
  (cursor) => myEndpoint(client, { cursor }),
)) { /* ... */ }
```
