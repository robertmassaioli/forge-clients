---
editUrl: false
next: false
prev: false
title: "collectAllPages"
---

> **collectAllPages**\<`T`\>(`fetchPage`, `pageSize?`): `Promise`\<`T`[]\>

Defined in: [packages/core/src/pagination/PaginationHelper.ts:69](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/pagination/PaginationHelper.ts#L69)

Collect **all** pages of an offset-paginated endpoint into a single array.

Fetches pages sequentially until the last page is reached, then returns
all items concatenated. For large result sets, prefer [iteratePages](/forge-clients/reference/functions/iteratepages/)
to avoid loading everything into memory at once.

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

`Promise`\<`T`[]\>

## Example

```typescript
import { collectAllPages } from '@forge-clients/core';
import { searchForIssuesUsingJql } from '@forge-clients/jira/v3';

const allIssues = await collectAllPages(
  (startAt, maxResults) =>
    searchForIssuesUsingJql(client, { body: { jql: 'project = PROJ', startAt, maxResults } }),
);
console.log(`Found ${allIssues.length} issues`);
```
