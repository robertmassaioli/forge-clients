---
title: Confluence — Overview
description: Overview of the @forge-clients/confluence package.
---

The `@forge-clients/confluence` package provides type-safe clients for the Confluence Cloud REST API,
generated from Atlassian's official OpenAPI specifications.

## Available modules

| Module | Import path | Endpoints | Description |
|---|---|---|---|
| **Confluence v2** | `@forge-clients/confluence/v2` | 213 | Current Confluence REST API (recommended) |
| **Confluence v1** | `@forge-clients/confluence/v1` | 130 | Legacy Confluence REST API |

## Which version to use?

**Use Confluence v2** for new development. It is the current, actively developed API with
improved pagination (cursor-based), cleaner resource modelling, and better consistency.
Confluence v1 is maintained for backwards compatibility.

```typescript
// ✅ Recommended — v2 is the default export
import { getPages, getPageById } from '@forge-clients/confluence';
import { getPages, getPageById } from '@forge-clients/confluence/v2'; // explicit

// ⚠️ Legacy v1 — use only if you need endpoints not yet in v2
import { getContentById, createContent } from '@forge-clients/confluence/v1';
```

## Root import (v2 default)

The root `@forge-clients/confluence` import defaults to v2. It also re-exports v1 as
the `ConfluenceV1` namespace for cases where you need both APIs in the same file:

```typescript
import {
  getPages,          // v2 function (default)
  ConfluenceV1,      // v1 namespace
} from '@forge-clients/confluence';

// Use v2
const pages = await getPages(client, { spaceId: ['123'] });

// Use v1 via namespace
const content = await ConfluenceV1.getContentById(client, { path: { id: '456' } });
```

## Function naming

Function names match the `operationId` from the OpenAPI spec, converted to camelCase:

### v2 examples
| REST endpoint | Function name |
|---|---|
| `GET /wiki/api/v2/pages` | `getPages` |
| `GET /wiki/api/v2/pages/{id}` | `getPageById` |
| `POST /wiki/api/v2/pages` | `createPage` |
| `GET /wiki/api/v2/spaces` | `getSpaces` |
| `GET /wiki/api/v2/attachments` | `getAttachments` |

### v1 examples
| REST endpoint | Function name |
|---|---|
| `GET /wiki/rest/api/content/{id}` | `getContentById` |
| `POST /wiki/rest/api/content` | `createContent` |
| `GET /wiki/rest/api/space` | `getSpaces` |
| `GET /wiki/rest/api/search` | `search` |
| `GET /wiki/rest/api/user/current` | `getCurrentUser` |

## Types

All types are individually exported from each module:

```typescript
import { ForgeFunctionAdapter, asApp } from '@forge-clients/core';
import { getPageById } from '@forge-clients/confluence/v2';
import type { PageSingle } from '@forge-clients/confluence/v2';

const adapter = new ForgeFunctionAdapter({ product: 'confluence' });

const page: PageSingle = await getPageById(asApp(adapter), {
  path: { id: '123456' },
});
console.log(page.title);
```
