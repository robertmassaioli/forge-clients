---
editUrl: false
next: false
prev: false
title: "CursorPage"
---

Defined in: [packages/core/src/pagination/PaginationHelper.ts:38](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/pagination/PaginationHelper.ts#L38)

Represents one page of results from a cursor-paginated Atlassian API endpoint.
Used by some Confluence v2 endpoints.

## Type Parameters

### T

`T`

## Properties

### \_links?

> `optional` **\_links?**: `object`

Defined in: [packages/core/src/pagination/PaginationHelper.ts:42](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/pagination/PaginationHelper.ts#L42)

HAL-style links object — `next` contains the URL of the next page if present

#### next?

> `optional` **next?**: `string`

***

### results

> **results**: `T`[]

Defined in: [packages/core/src/pagination/PaginationHelper.ts:40](https://github.com/robertmassaioli/forge-clients/blob/e2a10777386c183b5e970b14c7356486235d520c/packages/core/src/pagination/PaginationHelper.ts#L40)

Items on this page
