---
editUrl: false
next: false
prev: false
title: "iterateCursorPages"
---

> **iterateCursorPages**\<`T`\>(`fetchPage`): `AsyncGenerator`\<`T`\>

Defined in: [packages/core/src/pagination/PaginationHelper.ts:159](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L159)

Async generator for memory-efficient iteration over cursor-paginated results.

Used with Confluence v2 endpoints that return a `_links.next` URL instead of
an offset. Yields one item at a time and extracts the cursor from the `next`
link automatically. Stops when there is no `next` link.

## Type Parameters

### T

`T`

## Parameters

### fetchPage

(`cursor?`) => `Promise`\<[`CursorPage`](/forge-clients/reference/interfaces/cursorpage/)\<`T`\>\>

A function that fetches one page; receives `undefined` for the
                   first page and a cursor string for subsequent pages

## Returns

`AsyncGenerator`\<`T`\>

## Example

```typescript
import { iterateCursorPages } from '@forge-clients/core';
import { getPages } from '@forge-clients/confluence/v2';

for await (const page of iterateCursorPages(
  (cursor) => getPages(client, { query: { spaceKey: 'MYSPACE', cursor } }),
)) {
  console.log(page.title);
}
```
