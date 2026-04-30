---
editUrl: false
next: false
prev: false
title: "iteratePages"
---

> **iteratePages**\<`T`\>(`fetchPage`, `pageSize?`): `AsyncGenerator`\<`T`\>

Defined in: [packages/core/src/pagination/PaginationHelper.ts:115](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/pagination/PaginationHelper.ts#L115)

Async generator for memory-efficient iteration over offset-paginated results.

Yields one item at a time, fetching the next page on demand. Use this instead
of [collectAllPages](/forge-clients/reference/functions/collectallpages/) when result sets may be large or when you want to
stop early (e.g. `break` out of the loop once a match is found).

## Type Parameters

### T

`T`

## Parameters

### fetchPage

(`startAt`, `maxResults`) => `Promise`\<[`OffsetPage`](/forge-clients/reference/interfaces/offsetpage/)\<`T`\>\>

A function that fetches one page given `startAt` and `maxResults`

### pageSize?

`number` = `50`

Number of items to request per page (default: 50)

## Returns

`AsyncGenerator`\<`T`\>

## Example

```typescript
import { iteratePages } from '@forge-clients/core';
import { searchForIssuesUsingJql } from '@forge-clients/jira/v3';

for await (const issue of iteratePages(
  (startAt, maxResults) =>
    searchForIssuesUsingJql(client, { body: { jql: 'project = PROJ', startAt, maxResults } }),
)) {
  console.log(issue.key);
  if (issue.key === 'PROJ-42') break; // stop early without fetching remaining pages
}
```
