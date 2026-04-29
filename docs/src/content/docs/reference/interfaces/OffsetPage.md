---
editUrl: false
next: false
prev: false
title: "OffsetPage"
---

Defined in: [packages/core/src/pagination/PaginationHelper.ts:17](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L17)

Represents one page of results from an offset-paginated Atlassian API endpoint.

Atlassian APIs use various field names for items (`values`, `issues`, `results`)
and various ways to signal the last page (`isLast`, `total`). This interface
unifies them so the pagination helpers work across all endpoints.

## Type Parameters

### T

`T`

## Properties

### isLast?

> `optional` **isLast?**: `boolean`

Defined in: [packages/core/src/pagination/PaginationHelper.ts:27](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L27)

`true` when this is the final page (used by Jira Software endpoints)

***

### issues?

> `optional` **issues?**: `T`[]

Defined in: [packages/core/src/pagination/PaginationHelper.ts:21](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L21)

Items returned by Jira issue search endpoints

***

### maxResults?

> `optional` **maxResults?**: `number`

Defined in: [packages/core/src/pagination/PaginationHelper.ts:31](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L31)

Maximum number of items per page

***

### results?

> `optional` **results?**: `T`[]

Defined in: [packages/core/src/pagination/PaginationHelper.ts:23](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L23)

Items returned by some Confluence and Jira Software endpoints

***

### startAt?

> `optional` **startAt?**: `number`

Defined in: [packages/core/src/pagination/PaginationHelper.ts:29](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L29)

Zero-based index of the first item on this page

***

### total?

> `optional` **total?**: `number`

Defined in: [packages/core/src/pagination/PaginationHelper.ts:25](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L25)

Total number of items across all pages (not always present)

***

### values?

> `optional` **values?**: `T`[]

Defined in: [packages/core/src/pagination/PaginationHelper.ts:19](https://github.com/robertmassaioli/forge-clients/blob/79472dcf53ad828039cd1105df5678fccd6f16ba/packages/core/src/pagination/PaginationHelper.ts#L19)

Items returned by most Jira and Confluence endpoints
