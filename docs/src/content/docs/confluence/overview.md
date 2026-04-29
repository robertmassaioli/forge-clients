---
title: Confluence — Overview
description: Overview of the @forge-clients/confluence package.
---

The `@forge-clients/confluence` package provides type-safe clients for the Confluence Cloud REST API v1,
generated from Atlassian's official OpenAPI specification.

## Available modules

| Module | Import path | Endpoints |
|---|---|---|
| **Confluence v1** | `@forge-clients/confluence/v1` | 130 |

## Function naming

| REST endpoint | Function name |
|---|---|
| `GET /rest/api/content/{id}` | `getContentById` |
| `POST /rest/api/content` | `createContent` |
| `GET /rest/api/space` | `getSpaces` |
| `GET /rest/api/search` | `search` |
| `GET /rest/api/user/current` | `getCurrentUser` |

## Types

```typescript
import type { Types } from '@forge-clients/confluence/v1';

const page: Types.Content = await getContentById(adapter, { type: 'asApp' }, {
  id: '123456',
});
```
